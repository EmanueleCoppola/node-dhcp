/**
 * @license DHCP.js v0.2.18 28/06/2017
 * http://www.xarg.org/2017/06/a-pure-javascript-dhcp-implementation/
 *
 * Copyright (c) 2017, Robert Eisele (robert@xarg.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/
import {optsMeta} from './options';
const Options = optsMeta;

function trimZero(str: string): string {
  const pos = str.indexOf('\x00');
  return pos === -1 ? str : str.substr(0, pos);
}

export default class SeqBuffer {
  public _data: Buffer;
  public _r: number;
  public _w: number;
  constructor(buf?: Buffer, len?: number) {
    this._data = buf || Buffer.alloc(len || 1500); // alloc() fills the buffer with '0'
    this._r = 0;
    this._w = 0;
  }

  addUInt8(val: number): void {
    this._w = this._data.writeUInt8(val, this._w/*, true*/);
  };

  getUInt8(): number {
    return this._data.readUInt8(this._r++);
  };
  //
  addInt8(val): void {
    this._w = this._data.writeInt8(val, this._w);
  };
  getInt8(): number {
    return this._data.readInt8(this._r++);
  };

  addUInt16(val): void {
    this._w = this._data.writeUInt16BE(val, this._w);
  };

  getUInt16(): number {
    return this._data.readUInt16BE((this._r += 2) - 2);
  };
  //
  addInt16(val): void {
    this._w = this._data.writeInt16BE(val, this._w);
  };
  getInt16(): number {
    return this._data.readInt16BE((this._r += 2) - 2);
  };
  //
  addUInt32(val): void {
    this._w = this._data.writeUInt32BE(val, this._w);
  };
  getUInt32(): number {
    return this._data.readUInt32BE((this._r += 4) - 4);
  };
  //
  addInt32(val): void {
    this._w = this._data.writeInt32BE(val, this._w);
  };
  getInt32(): number {
    return this._data.readInt32BE((this._r += 4) - 4);
  };
  //
  addUTF8(val): void {
    this._w += this._data.write(val, this._w, 'utf8');
  };
  addUTF8Pad(val, fixLen): void {
    let len = Buffer.from(val, 'utf8').length;
    for (let n = 0; len > fixLen; n++) {
      val = val.slice(0, fixLen - n); // Truncate as long as character length is > fixLen
      len = Buffer.from(val, 'utf8').length;
    }

    this._data.fill(0, this._w, this._w + fixLen);
    this._data.write(val, this._w, 'utf8');
    this._w += fixLen;
  };
  getUTF8(len: number): string {
    return trimZero(this._data.toString('utf8', this._r, this._r += len));
  };
  //
  addASCII(val): void {
    this._w += this._data.write(val, this._w, 'ascii');
  };
  addASCIIPad(val, fixLen): void {
    this._data.fill(0, this._w, this._w + fixLen);
    this._data.write(val.slice(0, fixLen), this._w, 'ascii');
    this._w += fixLen;
  };
  getASCII(len: number): string {
    return trimZero(this._data.toString('ascii', this._r, this._r += len));
  };
  //
  addIP(ip): void {
    const self = this;
    const octs = ip.split('.');

    if (octs.length !== 4) {
      throw new Error('Invalid IP address ' + ip);
    }

    for (let val of octs) {

      val = parseInt(val, 10);
      if (0 <= val && val < 256) {
        self.addUInt8(val);
      } else {
        throw new Error('Invalid IP address ' + ip);
      }
    }
  };
  getIP(): string {
    return this.getUInt8() +
      '.' + this.getUInt8() +
      '.' + this.getUInt8() +
      '.' + this.getUInt8();
  };
  //
  addIPs(ips): void {
    if (ips instanceof Array) {
      for (let ip of ips) {
        this.addIP(ip);
      }
    } else {
      this.addIP(ips);
    }
  };
  getIPs(len: number): string[] {
    const ret: string[] = [];
    for (let i = 0; i < len; i += 4) {
      ret.push(this.getIP());
    }
    return ret;
  };
  //
  addMac(mac: string) {

    const octs: string[] = mac.split(/[-:]/);

    if (octs.length !== 6) {
      throw new Error('Invalid Mac address ' + mac);
    }

    for (let valStr of octs) {
      let val = parseInt(valStr, 16);
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
  };
  getMAC(htype, hlen) : string{
    const mac = this._data.toString('hex', this._r, this._r += hlen);
    if (htype !== 1 || hlen !== 6) {
      throw new Error('Invalid hardware address (len=' + hlen + ', type=' + htype + ')');
    }
    this._r += 10; // + 10 since field is 16 byte and only 6 are used for htype=1
    return mac.toUpperCase().match(/../g).join('-');
  };
  //
  addBool(): void {
    /* void */
  };
  getBool(): boolean {
    return true;
  };
  //
  addOptions(opts: { [key: number]: any }) {
    for (let k in opts) {
      if (!opts.hasOwnProperty(k))
        continue;
      let i = Number(k);
      const opt = Options[i];
      let len = 0;
      let val = opts[i];
      if (val === null) {
        continue;
      }
      switch (opt.type) {
        case 'UInt8':
        case 'Int8':
          len = 1;
          break;
        case 'UInt16':
        case 'Int16':
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
        case 'UTF8':
          len = Buffer.from(val, 'utf8').length;
          if (len === 0)
            continue; // Min length has to be 1
          for (let n = 0; len > 255; n++) {
            val = val.slice(0, 255 - n); // Truncate as long as character length is > 255
            len = Buffer.from(val, 'utf8').length;
          }
          break;
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
  };

  getOptions() {
    const options = {};
    const buf = this._data;
    while (this._r < buf.length) {
      let opt = this.getUInt8();
      if (opt === 0xff) { // End type
        break;
      } else if (opt === 0x00) { // Pad type
        this._r++; // NOP
      } else {
        let len = this.getUInt8();
        if (opt in Options) {
          options[opt] = this['get' + Options[opt].type](len);
        } else {
          this._r += len;
          console.error('Option ' + opt + ' not known');
        }
      }
    }
    return options;
  };
  //
  addUInt8s(arr): void {

    if (arr instanceof Array) {
      for (let i = 0; i < arr.length; i++) {
        this.addUInt8(arr[i]);
      }
    } else {
      this.addUInt8(arr);
    }
  };
  getUInt8s(len: number): number[] {
    const ret: number[] = [];
    for (let i = 0; i < len; i++) {
      ret.push(this.getUInt8());
    }
    return ret;
  };
  addUInt16s(arr): void {
    if (arr instanceof Array) {
      for (let i = 0; i < arr.length; i++) {
        this.addUInt16(arr[i]);
      }
    } else {
      this.addUInt16(arr);
    }
  };
  getUInt16s(len: number): number[] {
    const ret: number[] = [];
    for (let i = 0; i < len; i += 2) {
      ret.push(this.getUInt16());
    }
    return ret;
  };
  //
  getHex(len: number): string {
    return this._data.toString('hex', this._r, this._r += len);
  }
};

// module.exports = SeqBuffer;
