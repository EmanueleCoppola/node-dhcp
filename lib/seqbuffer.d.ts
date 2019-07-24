/**
 * @license DHCP.js v0.2.18 28/06/2017
 * http://www.xarg.org/2017/06/a-pure-javascript-dhcp-implementation/
 *
 * Copyright (c) 2017, Robert Eisele (robert@xarg.org)
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
/// <reference types="node" />
import { IOptionsId } from "./model";
export default class SeqBuffer {
    buffer: Buffer;
    r: number;
    w: number;
    constructor(buf?: Buffer, len?: number);
    writeUInt8(value: number): SeqBuffer;
    writeUInt16(value: number): SeqBuffer;
    writeUInt32(value: number): SeqBuffer;
    writeInt32(value: number): SeqBuffer;
    writeIP(value: string): SeqBuffer;
    writeASCII(val: string): SeqBuffer;
    isIPV4(ip: string): boolean | undefined;
    /**
     * If the encoding byte has the value 0, it is followed by a list of domain names, as described below (Section 3.1).
     * If the encoding byte has the value 1, it is followed by one or more IPv4 addresses (Section 3.2).
     */
    writeIPv4orDNS(val: string[] | string): SeqBuffer;
    writeUTF8(val: string): SeqBuffer;
    writeBool(val: any): SeqBuffer;
    writeIPs(val: string | string[]): SeqBuffer;
    writeUInt8s(arr: number[]): SeqBuffer;
    writeUInt16s(arr: number[]): SeqBuffer;
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
    getIPs(len: number): string[];
    addMac(mac: string): SeqBuffer;
    getMAC(htype: number, hlen: number): string;
    addBool(): void;
    getBool(): boolean;
    addOptions(opts: {
        [key: number]: any;
    }): SeqBuffer;
    getOptions(): IOptionsId;
    getUInt8s(len: number): number[];
    addUInt16s(arr: number[]): SeqBuffer;
    getUInt16s(len: number): number[];
    getHex(len: number): string;
}
