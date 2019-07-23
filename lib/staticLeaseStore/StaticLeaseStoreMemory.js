"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class StaticLeaseStoreMemory {
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
    getIP(mac, request) {
        return this.data[mac];
    }
    getReservedIP() {
        return this.set;
    }
}
exports.StaticLeaseStoreMemory = StaticLeaseStoreMemory;
//# sourceMappingURL=StaticLeaseStoreMemory.js.map