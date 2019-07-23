"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * basic static Lease conmfiguration module
 */
class LeaseStaticStoreMemory {
    constructor(leases) {
        this.data = {};
        this.data = Object.assign({}, leases);
        this.set = new Set(Object.values(this.data));
    }
    addStatic(mac, ip) {
        const old = this.data[mac];
        if (old) {
            this.set.delete(old);
        }
        this.data[mac] = ip;
    }
    delStatic(mac) {
        const old = this.data[mac];
        if (old) {
            this.set.delete(old);
        }
        delete this.data[mac];
    }
    getLease(mac, request) {
        const address = this.data[mac];
        if (address)
            return { mac, address };
        return null;
    }
    getIP(mac, request) {
        return;
    }
    getReservedIP() {
        return this.set;
    }
}
exports.LeaseStaticStoreMemory = LeaseStaticStoreMemory;
//# sourceMappingURL=LeaseStaticStoreMemory.js.map