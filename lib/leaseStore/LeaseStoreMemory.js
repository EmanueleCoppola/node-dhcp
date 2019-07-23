"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tools_1 = require("../tools");
class LeaseStoreMemory {
    constructor() {
        this.cache = {};
        this.address = new Set();
        this.oldest = null;
        this.cnt = 0;
    }
    async getLeaseFromMac(mac) {
        return this.cache[mac] || null;
    }
    async hasAddress(address) {
        return this.address.has(address);
    }
    async size() {
        return this.cnt;
    }
    async add(lease) {
        this.cache[lease.mac] = lease;
        this.address.add(lease.address);
        this.cnt++;
        return true;
    }
    // public getOldest(): Lease | null {
    //    if (this.oldest)
    //        return this.oldest;
    //    let oldest: Lease | null = null;
    //    let oldestTime = Infinity;
    //    for (const lease of Object.values(this.cache)) {
    //        if (lease.leaseTime < oldestTime) {
    //            oldestTime = lease.leaseTime;
    //            oldest = lease;
    //        }
    //    }
    //    this.oldest = oldest;
    //    return oldest;
    // }
    async getLeases() {
        return Object.values(this.cache);
    }
    async getAddresses() {
        return [...this.address];
    }
    async getMacs() {
        return Object.keys(this.cache);
    }
    getLeases2() {
        return Object.values(this.cache);
    }
    getAddresses2() {
        return [...this.address];
    }
    getMacs2() {
        return Object.keys(this.cache);
    }
    async getFreeIP(IP1, IP2, reserverd, randomIP) {
        return tools_1.genericGetFreeIP(IP1, IP2, [...reserverd, this.address], this.cnt, randomIP);
    }
}
exports.LeaseStoreMemory = LeaseStoreMemory;
//# sourceMappingURL=LeaseStoreMemory.js.map