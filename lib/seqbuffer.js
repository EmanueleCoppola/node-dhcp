"use strict";
/**
 * @license DHCP.js v0.2.18 28/06/2017
 * http://www.xarg.org/2017/06/a-pure-javascript-dhcp-implementation/
 *
 * Copyright (c) 2017, Robert Eisele (robert@xarg.org)
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable no-console */
const DHCPOptions_1 = require("./DHCPOptions");
const options_1 = require("./options");
function trimZero(str) {
    const pos = str.indexOf('\x00');
    return pos === -1 ? str : str.substr(0, pos);
}
class SeqBuffer {
    constructor(buf, len) {
        this.buffer = buf || Buffer.alloc(len || 1500); // alloc() fills the buffer with '0'
        this.r = 0;
        this.w = 0;
    }
    addUInt8(val) {
        this.w = this.buffer.writeUInt8(val, this.w /*, true*/);
        return this;
    }
    getUInt8() {
        return this.buffer.readUInt8(this.r++);
    }
    addInt8(val) {
        this.w = this.buffer.writeInt8(val, this.w);
        return this;
    }
    getInt8() {
        return this.buffer.readInt8(this.r++);
    }
    addUInt16(val) {
        this.w = this.buffer.writeUInt16BE(val, this.w);
        return this;
    }
    getUInt16() {
        return this.buffer.readUInt16BE((this.r += 2) - 2);
    }
    addInt16(val) {
        this.w = this.buffer.writeInt16BE(val, this.w);
        return this;
    }
    getInt16() {
        return this.buffer.readInt16BE((this.r += 2) - 2);
    }
    addUInt32(val) {
        this.w = this.buffer.writeUInt32BE(val, this.w);
        return this;
    }
    getUInt32() {
        return this.buffer.readUInt32BE((this.r += 4) - 4);
    }
    addInt32(val) {
        this.w = this.buffer.writeInt32BE(val, this.w);
        return this;
    }
    getInt32() {
        return this.buffer.readInt32BE((this.r += 4) - 4);
    }
    addUTF8(val) {
        this.w += this.buffer.write(val, this.w, 'utf8');
        return this;
    }
    addUTF8Pad(val, fixLen) {
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
    getUTF8(len) {
        return trimZero(this.buffer.toString('utf8', this.r, this.r += len));
    }
    //
    addASCII(val) {
        this.w += this.buffer.write(val, this.w, 'ascii');
        return this;
    }
    addASCIIPad(val, fixLen) {
        this.buffer.fill(0, this.w, this.w + fixLen);
        this.buffer.write(val.slice(0, fixLen), this.w, 'ascii');
        this.w += fixLen;
        return this;
    }
    getASCII(len) {
        return trimZero(this.buffer.toString('ascii', this.r, this.r += len));
    }
    addIP(ip) {
        const self = this;
        const octs = ip.split('.');
        if (octs.length !== 4) {
            throw new Error('Invalid IP address ' + ip);
        }
        for (const txt of octs) {
            const val = parseInt(txt, 10);
            if (0 <= val && val < 256) {
                self.addUInt8(val);
            }
            else {
                throw new Error('Invalid IP address ' + ip);
            }
        }
        return this;
    }
    getIP() {
        return this.getUInt8() +
            '.' + this.getUInt8() +
            '.' + this.getUInt8() +
            '.' + this.getUInt8();
    }
    addIPs(ips) {
        if (ips instanceof Array) {
            for (const ip of ips)
                this.addIP(ip);
        }
        else {
            this.addIP(ips);
        }
        return this;
    }
    getIPs(len) {
        const ret = [];
        for (let i = 0; i < len; i += 4) {
            ret.push(this.getIP());
        }
        return ret;
    }
    addMac(mac) {
        const octs = mac.split(/[-:]/);
        if (octs.length !== 6) {
            throw new Error('Invalid Mac address ' + mac);
        }
        for (const valStr of octs) {
            const val = parseInt(valStr, 16);
            if (0 <= val && val < 256) {
                this.addUInt8(val);
            }
            else {
                throw new Error('Invalid Mac address ' + mac);
            }
        }
        // Add 10 more byte to pad 16 byte
        this.addUInt32(0);
        this.addUInt32(0);
        this.addUInt16(0);
        return this;
    }
    getMAC(htype, hlen) {
        const mac = this.buffer.toString('hex', this.r, this.r += hlen);
        if (htype !== 1 || hlen !== 6) {
            throw new Error('Invalid hardware address (len=' + hlen + ', type=' + htype + ')');
        }
        this.r += 10; // + 10 since field is 16 byte and only 6 are used for htype=1
        const matches = mac.toUpperCase().match(/../g);
        if (!matches)
            throw new Error('internal mac pasing error');
        return matches.join('-');
    }
    addBool() {
        /* no Data to Write  data length is 0 */
    }
    getBool() {
        return true;
    }
    addOptions(opts) {
        for (const k in opts) {
            if (!opts.hasOwnProperty(k))
                continue;
            const i = Number(k);
            const opt = options_1.optsMeta[i];
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
    getOptions() {
        const options = new DHCPOptions_1.DHCPOptions();
        const buf = this.buffer;
        while (this.r < buf.length) {
            const opt = this.getUInt8();
            if (opt === 0xff) { // End type
                break;
            }
            else if (opt === 0x00) { // Pad type
                this.r++; // NOP
            }
            else {
                const len = this.getUInt8();
                const fullType = options_1.optsMeta[opt];
                if (fullType) {
                    const { type } = options_1.optsMeta[opt];
                    options[opt] = this[`get${type}`](len);
                }
                else {
                    this.r += len;
                    console.error(`Option ${opt} not known`);
                }
            }
        }
        return options;
    }
    addUInt8s(arr) {
        if (arr instanceof Array) {
            for (const i of arr)
                this.addUInt8(i);
        }
        else {
            this.addUInt8(arr);
        }
        return this;
    }
    getUInt8s(len) {
        const ret = [];
        for (let i = 0; i < len; i++) {
            ret.push(this.getUInt8());
        }
        return ret;
    }
    addUInt16s(arr) {
        if (arr instanceof Array) {
            for (const i of arr)
                this.addUInt16(i);
        }
        else {
            this.addUInt16(arr);
        }
        return this;
    }
    getUInt16s(len) {
        const ret = [];
        for (let i = 0; i < len; i += 2) {
            ret.push(this.getUInt16());
        }
        return ret;
    }
    //
    getHex(len) {
        return this.buffer.toString('hex', this.r, this.r += len);
    }
}
exports.default = SeqBuffer;
// module.exports = SeqBuffer;
//# sourceMappingURL=seqbuffer.js.map