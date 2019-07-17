"use strict";
/**
 * @license DHCP.js v0.2.18 28/06/2017
 * http://www.xarg.org/2017/06/a-pure-javascript-dhcp-implementation/
 *
 * Copyright (c) 2017, Robert Eisele (robert@xarg.org)
 * Copyright (c) 2019, Chemouni Uriel (uchemouni@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
/* tslint:disable object-literal-sort-keys */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const seqbuffer_1 = __importDefault(require("./seqbuffer"));
exports.parse = (buf) => {
    if (buf.length < 230) { // 230 byte minimum length of DHCP packet
        throw new Error('Received data is too short');
    }
    const sb = new seqbuffer_1.default(buf);
    let hlen;
    let htype;
    // RFC 2131
    return {
        op: sb.getUInt8(),
        htype: (htype = sb.getUInt8()),
        hlen: (hlen = sb.getUInt8()),
        hops: sb.getUInt8(),
        xid: sb.getUInt32(),
        secs: sb.getUInt16(),
        flags: sb.getUInt16(),
        ciaddr: sb.getIP(),
        yiaddr: sb.getIP(),
        siaddr: sb.getIP(),
        giaddr: sb.getIP(),
        chaddr: sb.getMAC(htype, hlen),
        sname: sb.getUTF8(64),
        file: sb.getUTF8(128),
        magicCookie: sb.getUInt32(),
        options: sb.getOptions(),
    };
};
exports.format = (data) => {
    return new seqbuffer_1.default()
        .addUInt8(data.op)
        .addUInt8(data.htype)
        .addUInt8(data.hlen)
        .addUInt8(data.hops)
        .addUInt32(data.xid)
        .addUInt16(data.secs)
        .addUInt16(data.flags)
        .addIP(data.ciaddr)
        .addIP(data.yiaddr)
        .addIP(data.siaddr)
        .addIP(data.giaddr)
        .addMac(data.chaddr)
        .addUTF8Pad(data.sname, 64)
        .addUTF8Pad(data.file, 128)
        .addUInt32(0x63825363)
        .addOptions(data.options)
        .addUInt8(255); // Mark end
    // TODO: Must options packet be >= 68 byte and 4 byte alligned?
};
//# sourceMappingURL=protocol.js.map