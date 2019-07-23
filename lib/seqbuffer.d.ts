/**
 * @license DHCP.js v0.2.18 28/06/2017
 * http://www.xarg.org/2017/06/a-pure-javascript-dhcp-implementation/
 *
 * Copyright (c) 2017, Robert Eisele (robert@xarg.org)
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
/// <reference types="node" />
import { DHCPOptions } from "./DHCPOptions";
export default class SeqBuffer {
    buffer: Buffer;
    r: number;
    w: number;
    constructor(buf?: Buffer, len?: number);
    addUInt8(val: number): SeqBuffer;
    getUInt8(): number;
    addInt8(val: number): SeqBuffer;
    getInt8(): number;
    addUInt16(val: number): SeqBuffer;
    getUInt16(): number;
    addInt16(val: number): SeqBuffer;
    getInt16(): number;
    addUInt32(val: number): SeqBuffer;
    getUInt32(): number;
    addInt32(val: number): SeqBuffer;
    getInt32(): number;
    addUTF8(val: string): SeqBuffer;
    addUTF8Pad(val: string, fixLen: number): SeqBuffer;
    getUTF8(len: number): string;
    addASCII(val: string): SeqBuffer;
    addASCIIPad(val: string, fixLen: number): SeqBuffer;
    getASCII(len: number): string;
    addIP(ip: string): SeqBuffer;
    getIP(): string;
    addIPs(ips: string | string[]): SeqBuffer;
    getIPs(len: number): string[];
    addMac(mac: string): SeqBuffer;
    getMAC(htype: number, hlen: number): string;
    addBool(): void;
    getBool(): boolean;
    addOptions(opts: {
        [key: number]: any;
    }): SeqBuffer;
    getOptions(): DHCPOptions;
    addUInt8s(arr: number[]): SeqBuffer;
    getUInt8s(len: number): number[];
    addUInt16s(arr: number[]): SeqBuffer;
    getUInt16s(len: number): number[];
    getHex(len: number): string;
}
