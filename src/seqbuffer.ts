
/**
 * @license DHCP.js v0.2.18 28/06/2017
 * http://www.xarg.org/2017/06/a-pure-javascript-dhcp-implementation/
 *
 * Copyright (c) 2017, Robert Eisele (robert@xarg.org)
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

/* tslint:disable no-console */

import { IOptionsId } from "./model";
import { IOptionMeta, optsMetaDefault } from "./options";

function trimZero(str: string): string {
  const pos = str.indexOf("\x00");
  return pos === -1 ? str : str.substr(0, pos);
}

export default class SeqBuffer {
  public buffer: Buffer;
  public r: number;
  public w: number;

  constructor(buf?: Buffer | null, len?: number) {
    this.buffer = buf || Buffer.alloc(len || 1500); // alloc() fills the buffer with '0'
    this.r = 0;
    this.w = 0;
  }

  public writeUInt8(value: number): SeqBuffer {
    // len is 1
    this.addUInt8(1);
    // Write length
    this.addUInt8(value);
    return this;
  }

  public writeUInt16(value: number): SeqBuffer {
    // len is 1
    this.addUInt8(2);
    // Write length
    this.addUInt16(value);
    return this;
  }

  public writeUInt32(value: number): SeqBuffer {
    // len is 1
    this.addUInt8(4);
    // Write length
    this.addUInt32(value);
    return this;
  }

  public writeInt32(value: number): SeqBuffer {
    // len is 1
    this.addUInt8(4);
    // Write length
    this.addInt32(value);
    return this;
  }

  public writeIP(value: string): SeqBuffer {
    // len is 1
    this.addUInt8(4);
    // Write length
    this.addIP(value);
    return this;
  }

  public writeASCII(val: string): SeqBuffer {
    let len = val.length;
    if (len === 0)
      throw Error("can not send an empty string in a DHCP messgae");
    if (len > 255) {
      // console.error(val + " too long, truncating...");
      val = val.slice(0, 255);
      len = 255;
    }
    // len is 1
    this.addUInt8(len);
    // Write length
    this.addASCII(val);
    return this;
  }

  public isIPV4(ip: string) {
    const octs = ip.split(".");
    if (octs.length !== 4) {
      return false;
    }
    for (const txt of octs) {
      const val = parseInt(txt, 10);
      if (val < 0 || val > 256)
        return false;
      return true;
    }
  }
  /**
   * If the encoding byte has the value 0, it is followed by a list of domain names, as described below (Section 3.1).
   * If the encoding byte has the value 1, it is followed by one or more IPv4 addresses (Section 3.2).
   */
  public writeIPv4orDNS(val: string[] | string): SeqBuffer {
    if (typeof val === "string") {
      if (this.isIPV4(val)) {
        return this.addUInt8(5).addUInt8(1).addIP(val);
      } else {
        const len = val.length;
        if (len > 254)
          throw Error("Data tuncation for domain name " + val);
        return this.addUInt8(len + 1).addUInt8(0).addASCII(val);
      }
    }

    if (val instanceof Array) {
      let isIP = true;
      val.forEach((ip) => { if (!this.isIPV4(ip)) isIP = false; });
      if (isIP) {
        const len = val.length * 4 + 1;
        if (len > 255)
          throw Error("Data tuncation for IP list name " + val);
        this.addUInt8(len).addUInt8(1);
        for (const ip of val)
          this.addIP(ip);
        return this;
      } else {
        const len = val.reduce((acc, str) => acc + str.length + 1, 1);
        if (len > 255)
          throw Error("Data tuncation for dns list name " + val);
        this.addUInt8(len).addUInt8(0);
        val.forEach((str) => this.addASCII(str).addUInt8(0));
      }
    }
    return this;
  }

  public writeUTF8(val: string): SeqBuffer {
    let len = Buffer.from(val, "utf8").length;
    if (len === 0)
      throw Error("can not send an empty string in a DHCP messgae");
    for (let n = 0; len > 255; n++) {
      val = val.slice(0, 255 - n); // Truncate as long as character length is > 255
      len = Buffer.from(val, "utf8").length;
    }
    // len is 1
    this.addUInt8(len);
    // Write length
    this.addUTF8(val);
    return this;
  }

  public writeBool(val: any): SeqBuffer {
    this.addUInt8(1);
    if (val === true || val === 1 || val === "1" || val === "true" || val === "TRUE" || val === "True")
      this.addUInt8(1);
    else
      this.addUInt8(0);
    return this;
  }

  public writeIPs(val: string | string[]): SeqBuffer {
    if (val instanceof Array) {
      this.addUInt8(4 * val.length);
      for (const ip of val)
        this.addIP(ip);
    } else {
      this.addUInt8(4);
      this.addIP(val);
    }
    return this;
  }

  public writeUInt8s(arr: number[]): SeqBuffer {
    if (arr instanceof Array) {
      this.addUInt8(arr.length);
      for (const i of arr)
        this.addUInt8(i);
    } else {
      this.addUInt8(1);
      this.addUInt8(arr);
    }
    return this;
  }

  public writeUInt16s(arr: number[]): SeqBuffer {
    if (arr instanceof Array) {
      this.addUInt8(arr.length * 2);
      for (const i of arr)
        this.addUInt16(i);
    } else {
      this.addUInt8(2);
      this.addUInt16(arr);
    }
    return this;
  }

  public addUInt8(val: number): SeqBuffer {
    if (val > 255 || val < 0)
      throw Error("Data tuncation for uint8 " + val);
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
    this.w += this.buffer.write(val, this.w, "utf8");
    return this;
  }

  public addUTF8Pad(val: string, fixLen: number): SeqBuffer {
    let len = Buffer.from(val, "utf8").length;
    for (let n = 0; len > fixLen; n++) {
      val = val.slice(0, fixLen - n); // Truncate as long as character length is > fixLen
      len = Buffer.from(val, "utf8").length;
    }

    this.buffer.fill(0, this.w, this.w + fixLen);
    this.buffer.write(val, this.w, "utf8");
    this.w += fixLen;
    return this;
  }

  public getUTF8(len: number): string {
    return trimZero(this.buffer.toString("utf8", this.r, this.r += len));
  }
  //
  public addASCII(val: string): SeqBuffer {
    this.w += this.buffer.write(val, this.w, "ascii");
    return this;
  }

  public addASCIIPad(val: string, fixLen: number): SeqBuffer {
    this.buffer.fill(0, this.w, this.w + fixLen);
    this.buffer.write(val.slice(0, fixLen), this.w, "ascii");
    this.w += fixLen;
    return this;
  }

  public getASCII(len: number): string {
    return trimZero(this.buffer.toString("ascii", this.r, this.r += len));
  }


  public addIPs(ips: string[]): SeqBuffer {
    for (const ip of ips)
      this.addIP(ip);
    return this;
  }

  public addIP(ip: string): SeqBuffer {
    const octs = ip.split(".");
    if (octs.length !== 4) {
      throw new Error("Invalid IP address " + ip);
    }
    for (const txt of octs) {
      const val = parseInt(txt, 10);
      if (0 <= val && val < 256) {
        this.addUInt8(val);
      } else {
        throw new Error("Invalid IP address " + ip);
      }
    }
    return this;
  }

  public getIP(): string {
    return this.getUInt8() +
      "." + this.getUInt8() +
      "." + this.getUInt8() +
      "." + this.getUInt8();
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
      throw new Error("Invalid Mac address " + mac);
    }

    for (const valStr of octs) {
      const val = parseInt(valStr, 16);
      if (0 <= val && val < 256) {
        this.addUInt8(val);
      } else {
        throw new Error("Invalid Mac address " + mac);
      }
    }

    // Add 10 more byte to pad 16 byte
    this.addUInt32(0);
    this.addUInt32(0);
    this.addUInt16(0);
    return this;
  }

  public getMAC(htype: number, hlen: number): string {
    const mac = this.buffer.toString("hex", this.r, this.r += hlen);
    if (htype !== 1 || hlen !== 6) {
      throw new Error("Invalid hardware address (len=" + hlen + ", type=" + htype + ")");
    }
    this.r += 10; // + 10 since field is 16 byte and only 6 are used for htype=1
    const matches = mac.toUpperCase().match(/../g);
    if (!matches)
      throw new Error("internal mac pasing error");
    return matches.join("-");
  }

  public addBool(): void {
    /* no Data to Write  data length is 0 */
  }

  public getBool(): boolean {
    return true;
  }

  public addOptions(opts: { [key: number]: any }): SeqBuffer {
    Wloop: for (const k in opts) {
      if (!opts.hasOwnProperty(k))
        continue;
      const optionId = Number(k);
      const optionMeta = optsMetaDefault[optionId];
      const val = opts[optionId];
      if (val === null) {
        continue;
      }
      // Write code
      this.addUInt8(optionId);
      switch (optionMeta.type) {
        case "UInt8":
          this.writeUInt8(val);
          continue Wloop;
        case "UInt16":
          this.writeUInt16(val);
          continue Wloop;
        case "UInt32":
          this.writeUInt32(val);
          continue Wloop;
        case "Int32":
          this.writeInt32(val);
          continue Wloop;
        case "IP":
          this.writeIP(val);
          continue Wloop;
        case "IPs":
          this.writeIPs(val);
          continue Wloop;
        case "UInt8s":
          this.writeUInt8s(val);
          continue Wloop;
        case "UInt16s":
          this.writeUInt16s(val);
          continue Wloop;
        case "Bool":
          this.writeBool(val);
          continue Wloop;
        case "ASCII":
          this.writeASCII(val);
          continue Wloop;
        case "IPv4orDNS":
          this.writeIPv4orDNS(val);
          continue Wloop;
        default:
          throw new Error("No such type " + optionMeta.type);
      }
    }
    return this;
  }

  public getOptions(): IOptionsId {
    const options: IOptionsId = {};
    const buf = this.buffer;
    while (this.r < buf.length) {
      const opt = this.getUInt8();
      if (opt === 0xff) { // End type
        break;
      } else if (opt === 0x00) { // Pad type
        this.r++; // NOP
      } else {
        const len = this.getUInt8();
        const fullType: IOptionMeta = optsMetaDefault[opt];
        if (fullType) {
          const { type } = optsMetaDefault[opt];
          options[opt] = this[`get${type}`](len);
        } else {
          this.r += len;
          console.error(`Option ${opt} not known`);
        }
      }
    }
    return options;
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
      for (const i of arr)
        this.addUInt16(i);
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
    return this.buffer.toString("hex", this.r, this.r += len);
  }
}

// module.exports = SeqBuffer;
