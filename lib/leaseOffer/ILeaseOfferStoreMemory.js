"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LeaseOfferStoreMemory {
    constructor(timeout) {
        this.timeOut = timeout || 10;
        this.ips = new Set();
    }
    add(lease) {
        this.pop(lease.mac);
        this.cache[lease.mac] = lease;
        this.ips.add(lease.address);
        lease.timer = setTimeout(() => this.remove(lease), this.timeOut * 1000);
    }
    pop(mac) {
        const old = this.cache[mac];
        this.remove(old);
        return old;
    }
    getReservedIP() {
        return this.ips;
    }
    remove(lease) {
        if (lease) {
            delete this.cache[lease.mac];
            this.ips.delete(lease.address);
            delete lease.timer;
        }
    }
}
exports.LeaseOfferStoreMemory = LeaseOfferStoreMemory;
//# sourceMappingURL=ILeaseOfferStoreMemory.js.map