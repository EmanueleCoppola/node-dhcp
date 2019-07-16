"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Lease {
    constructor() {
        this.leasePeriod = 86400; // Seconds the lease is allowed to live, next lease in "leasePeriod - (now - bindTime)"
        this.renewPeriod = 1440; // Seconds till a renew is due, next renew in "renewPeriod - (now - bindTime)"
        this.rebindPeriod = 14400; // Seconds till a rebind is due, next rebind in "rebindPeriod - (now - bindTime)"
        this.tries = 0; // number of tries in order to complete a state
        this.xid = 1; // unique id, incremented with every request
    }
}
exports.Lease = Lease;
//# sourceMappingURL=Lease.js.map