/**
 * @license DHCP.js v0.2.18 28/06/2017
 * http://www.xarg.org/2017/06/a-pure-javascript-dhcp-implementation/
 *
 * Copyright (c) 2017, Robert Eisele (robert@xarg.org)
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
import { OptionMeta, optsMeta } from './options';

function trimZero(str: string): string {
  const pos = str.indexOf('\x00');
  return pos === -1 ? str : str.substr(0, pos);
}

export default class SeqBuffer {
  public buffer: Buffer;
  public r: number;
  public w: number;

  constructor(buf?: Buffer, len?: number) {
    this.buffer = buf || Buffer.alloc(len || 1500); // alloc() fills the buffer with '0'
    this.r = 0;
    this.w = 0;
  }

  public addUInt8(val: number): SeqBuffer {
    this.w = this.buffer.writeUInt8(val, this.w/*, true*/);
    return this;
  }

  public getUInt8(): number {
    return this.buffer.readUInt8(this.r++);
  }

  public addInt8(val: number): SeqBuffer {
    this.w = this.buffer.writeInt8(val, this.w);
    return this;
  }

  public getInt8(): number {
    return this.buffer.readInt8(this.r++);
  }

  public addUInt16(val: number): SeqBuffer {
    this.w = this.buffer.writeUInt16BE(val, this.w);
    return this;
  }

  public getUInt16(): number {
    return this.buffer.readUInt16BE((this.r += 2) - 2);
  }

  public addInt16(val: number): SeqBuffer {
    this.w = this.buffer.writeInt16BE(val, this.w);
    return this;
  }

  public getInt16(): number {
    return this.buffer.readInt16BE((this.r += 2) - 2);
  }

  public addUInt32(val: number): SeqBuffer {
    this.w = this.buffer.writeUInt32BE(val, this.w);
    return this;
  }

  public getUInt32(): number {
    return this.buffer.readUInt32BE((this.r += 4) - 4);
  }

  public addInt32(val: number): SeqBuffer {
    this.w = this.buffer.writeInt32BE(val, this.w);
    return this;
  }

  public getInt32(): number {
    return this.buffer.readInt32BE((this.r += 4) - 4);
  }

  public addUTF8(val: string): SeqBuffer {
    this.w += this.buffer.write(val, this.w, 'utf8');
    return this;
  }

  public addUTF8Pad(val: string, fixLen: number): SeqBuffer {
    let len = Buffer.from(val, 'utf8').length;
    for (let n = 0; len > fixLen; n++) {
      val = val.slice(0, fixLen - n); // Truncate as long as character length is > fixLen
      len = Buffer.from(val, 'utf8').length;
    }

    this.buffer.fill(0, this.w, this.w + fixLen);
    this.buffer.write(val, this.w, 'utf8');
    this.w += fixLen;
    return this;
  }

  public getUTF8(len: number): string {
    return trimZero(this.buffer.toString('utf8', this.r, this.r += len));
  }
  //
  public addASCII(val: string): SeqBuffer {
    this.w += this.buffer.write(val, this.w, 'ascii');
    return this;
  }

  public addASCIIPad(val: string, fixLen: number): SeqBuffer {
    this.buffer.fill(0, this.w, this.w + fixLen);
    this.buffer.write(val.slice(0, fixLen), this.w, 'ascii');
    this.w += fixLen;
    return this;
  }

  public getASCII(len: number): string {
    return trimZero(this.buffer.toString('ascii', this.r, this.r += len));
  }

  public addIP(ip: string): SeqBuffer {
    const self = this;
    const octs = ip.split('.');
    if (octs.length !== 4) {
      throw new Error('Invalid IP address ' + ip);
    }
    for (const txt of octs) {
      const val = parseInt(txt, 10);
      if (0 <= val && val < 256) {
        self.addUInt8(val);
      } else {
        throw new Error('Invalid IP address ' + ip);
      }
    }
    return this;
  }

  public getIP(): string {
    return this.getUInt8() +
      '.' + this.getUInt8() +
      '.' + this.getUInt8() +
      '.' + this.getUInt8();
  }

  public addIPs(ips: string | string[]): SeqBuffer {
    if (ips instanceof Array) {
      for (const ip of ips)
        this.addIP(ip);
    } else {
      this.addIP(ips);
    }
    return this;
  }

  public getIPs(len: number): string[] {
    const ret: string[] = [];
    for (let i = 0; i < len; i += 4) {
      ret.push(this.getIP());
    }
    return ret;
  }

  public addMac(mac: string): SeqBuffer {
    const octs: string[] = mac.split(/[-:]/);
    if (octs.length !== 6) {
      throw new Error('Invalid Mac address ' + mac);
    }

    for (const valStr of octs) {
      const val = parseInt(valStr, 16);
      if (0 <= val && val < 256) {
        this.addUInt8(val);
      } else {
        throw new Error('Invalid Mac address ' + mac);
      }
    }

    // Add 10 more byte to pad 16 byte
    this.addUInt32(0);
    this.addUInt32(0);
    this.addUInt16(0);
    return this;
  }

  public getMAC(htype: number, hlen: number): string {
    const mac = this.buffer.toString('hex', this.r, this.r += hlen);
    if (htype !== 1 || hlen !== 6) {
      throw new Error('Invalid hardware address (len=' + hlen + ', type=' + htype + ')');
    }
    this.r += 10; // + 10 since field is 16 byte and only 6 are used for htype=1
    return mac.toUpperCase().match(/../g).join('-');
  }

  public addBool(): void {
    /* void */
  }

  public getBool(): boolean {
    return true;
  }

  public addOptions(opts: { [key: number]: any }): SeqBuffer {
    for (const k in opts) {
      if (!opts.hasOwnProperty(k))
        continue;
      const i = Number(k);
      const opt = optsMeta[i];
      let len = 0;
      let val = opts[i];
      if (val === null) {
        continue;
      }
      switch (opt.type) {
        case 'UInt8':
          // case 'Int8':
          len = 1;
          break;
        case 'UInt16':
          // case 'Int16':
          len = 2;
          break;
        case 'UInt32':
        case 'Int32':
        case 'IP':
          len = 4;
          break;
        case 'IPs':
          len = val instanceof Array ? 4 * val.length : 4;
          break;
        case 'ASCII':
          len = val.length;
          if (len === 0)
            continue; // Min length has to be 1
          if (len > 255) {
            console.error(val + ' too long, truncating...');
            val = val.slice(0, 255);
            len = 255;
          }
          break;
        // case 'UTF8':
        //  len = Buffer.from(val, 'utf8').length;
        //  if (len === 0)
        //    continue; // Min length has to be 1
        //  for (let n = 0; len > 255; n++) {
        //    val = val.slice(0, 255 - n); // Truncate as long as character length is > 255
        //    len = Buffer.from(val, 'utf8').length;
        //  }
        //  break;
        case 'Bool':
          if (!(val === true || val === 1 || val === '1' || val === 'true' || val === 'TRUE' || val === 'True'))
            continue;
          // Length must be zero, so nothing to do here
          break;
        case 'UInt8s':
          len = val instanceof Array ? val.length : 1;
          break;
        case 'UInt16s':
          len = val instanceof Array ? 2 * val.length : 2;
          break;
        default:
          throw new Error('No such type ' + opt.type);
      }
      // Write code
      this.addUInt8(i);
      // Write length
      this.addUInt8(len);
      // Write actual data
      this['add' + opt.type](val);
    }
    return this;
  }

  public getOptions() {
    const options = {};
    const buf = this.buffer;
    while (this.r < buf.length) {
      const opt = this.getUInt8();
      if (opt === 0xff) { // End type
        break;
      } else if (opt === 0x00) { // Pad type
        this.r++; // NOP
      } else {
        const len = this.getUInt8();
        const fullType: OptionMeta = optsMeta[opt];
        if (fullType) {
          const { type } = optsMeta[opt];
          options[opt] = this[`get${type}`](len);
        } else {
          this.r += len;
          console.error(`Option ${opt} not known`);
        }
      }
    }
    return options;
  }

  public addUInt8s(arr: number[]): SeqBuffer {
    if (arr instanceof Array) {
      for (let i = 0; i < arr.length; i++) {
        this.addUInt8(arr[i]);
      }
    } else {
      this.addUInt8(arr);
    }
    return this;
  }

  public getUInt8s(len: number): number[] {
    const ret: number[] = [];
    for (let i = 0; i < len; i++) {
      ret.push(this.getUInt8());
    }
    return ret;
  }

  public addUInt16s(arr: number[]): SeqBuffer {
    if (arr instanceof Array) {
      for (let i = 0; i < arr.length; i++) {
        this.addUInt16(arr[i]);
      }
    } else {
      this.addUInt16(arr);
    }
    return this;
  }

  public getUInt16s(len: number): number[] {
    const ret: number[] = [];
    for (let i = 0; i < len; i += 2) {
      ret.push(this.getUInt16());
    }
    return ret;
  }

  //
  public getHex(len: number): string {
    return this.buffer.toString('hex', this.r, this.r += len);
  }
}

// module.exports = SeqBuffer;
