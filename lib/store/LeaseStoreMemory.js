"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LeaseStoreMemory {
    constructor() {
        this.cache = {};
        this.address = new Set();
        this.oldest = null;
        this.cnt = 0;
    }
    getLeaseFromMac(mac) {
        return this.cache[mac] || null;
    }
    hasAddress(address) {
        return this.address.has(address);
    }
    size() {
        return this.cnt;
    }
    add(lease) {
        this.cache[lease.mac] = lease;
        this.address.add(lease.address);
        this.cnt++;
        return true;
    }
    getOldest() {
        if (this.oldest)
            return this.oldest;
        let oldest = null;
        let oldestTime = Infinity;
        for (const lease of Object.values(this.cache)) {
            if (lease.leaseTime < oldestTime) {
                oldestTime = lease.leaseTime;
                oldest = lease;
            }
        }
        this.oldest = oldest;
        return oldest;
    }
    getLeases() {
        return Object.values(this.cache);
    }
    getAddresses() {
        return [...this.address];
    }
    getMacs() {
        return Object.keys(this.cache);
    }
}
exports.LeaseStoreMemory = LeaseStoreMemory;
//# sourceMappingURL=LeaseStoreMemory.js.map