"use strict";
/* tslint:disable no-bitwise */
Object.defineProperty(exports, "__esModule", { value: true });
const prime_1 = require("./prime");
exports.parseIp = (str) => {
    if (typeof str === "number")
        return str;
    const octs = str.split(".");
    if (octs.length !== 4) {
        throw new Error(`Invalid IP address ${str}`);
    }
    return octs.reduce((prev, valStr) => {
        const val = parseInt(valStr, 10);
        if (0 <= val && val < 256) {
            return (prev << 8) | val;
        }
        else {
            throw new Error(`Invalid IP address ${str}`);
        }
    }, 0);
};
exports.formatIp = (num) => {
    let ip = "";
    for (let i = 24; i >= 0; i -= 8) {
        if (ip)
            ip += ".";
        ip += ((num >>> i) & 0xFF).toString(10);
    }
    return ip;
};
// Source: http://www.xarg.org/tools/subnet-calculator/
exports.netmaskFromCIDR = (cidr) => -1 << (32 - cidr);
exports.netmaskFromIP = (ip) => {
    // we don't have much information, pick a class related netmask
    ip = exports.parseIp(ip);
    const first = ip >>> 24;
    if (first <= 127) {
        return 0xff000000;
    }
    else if (first >= 192) {
        return 0xffffff00;
    }
    else {
        return 0xffff0000;
    }
};
// Source: http://www.xarg.org/tools/subnet-calculator/
exports.wildcardFromCIDR = (cidr) => ~exports.netmaskFromCIDR(cidr);
// Source: http://www.xarg.org/tools/subnet-calculator/
exports.networkFromIpCIDR = (ip, cidr) => exports.netmaskFromCIDR(cidr) & exports.parseIp(ip);
// Source: http://www.xarg.org/tools/subnet-calculator/
exports.broadcastFromIpCIDR = (ip, cidr) => exports.networkFromIpCIDR(exports.parseIp(ip), cidr) | exports.wildcardFromCIDR(cidr);
// Source: http://www.xarg.org/tools/subnet-calculator/
exports.CIDRFromNetmask = (net) => {
    net = exports.parseIp(net);
    let s = 0;
    let d = 0;
    let t = net & 1;
    const wild = t;
    for (let i = 0; i < 32; i++) {
        d += t ^ net & 1;
        t = net & 1;
        net >>>= 1;
        s += t;
    }
    if (d !== 1) {
        throw new Error(`Invalid Netmask ${net}`);
    }
    if (wild)
        s = 32 - s;
    return s;
};
// Source: http://www.xarg.org/tools/subnet-calculator/
exports.gatewayFromIpCIDR = (ip, cidr) => {
    // The gateway is not the first host of the network in general
    // But it's the best guess we can make.
    ip = exports.parseIp(ip);
    if (cidr === 32)
        return ip;
    return exports.networkFromIpCIDR(ip, cidr) + 1;
};
// Source: http://www.xarg.org/tools/subnet-calculator/
exports.netmaskFromRange = (ip1, ip2) => {
    ip1 = exports.parseIp(ip1);
    ip2 = exports.parseIp(ip2);
    const cidr = 32 - Math.floor(Math.log2((ip1 ^ (ip2 - 1)) + 2)) - 1;
    return exports.netmaskFromCIDR(cidr);
};
async function genericGetFreeIP(IP1, IP2, reservedSet, used, rnd) {
    const firstIP = exports.parseIp(IP1);
    const lastIP = exports.parseIp(IP2);
    const total = lastIP - firstIP;
    const leases = used;
    // Check if all IP's are used and delete the oldest
    if (lastIP - firstIP === leases) {
        throw Error("DHCP is full");
    }
    // Exclude our own server IP from pool
    // Select a random IP, using prime number iterator
    if (rnd) {
        const prime = prime_1.random(1000, 10000);
        let offset = 0;
        loop: for (let i = 0; i < total; i++) {
            offset = (offset + prime) % total;
            const ip = firstIP + offset;
            const strIP = exports.formatIp(ip);
            for (const set of reservedSet)
                if (set.has(strIP))
                    continue loop;
        }
    }
    else {
        // Choose first free IP in subnet
        loop: for (let ip = firstIP; ip <= lastIP; ip++) {
            const strIP = exports.formatIp(ip);
            for (const set of reservedSet)
                if (set.has(strIP))
                    continue loop;
            return strIP;
        }
    }
}
exports.genericGetFreeIP = genericGetFreeIP;
//# sourceMappingURL=tools.js.map