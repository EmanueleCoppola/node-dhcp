"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const options_1 = require("../options");
function toLeaseExTxt(lease) {
    if (!lease)
        return null;
    const out = {
        mac: lease.mac,
        address: lease.address,
        options: {},
    };
    if (lease.options) {
        for (const k of Object.keys(lease.options)) {
            const name = options_1.getDHCPName(k);
            if (name)
                out.options[name] = lease.options[k];
        }
    }
    return out;
}
exports.toLeaseExTxt = toLeaseExTxt;
//# sourceMappingURL=ILeaseStaticStore.js.map