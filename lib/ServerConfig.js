"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const leaseLive_1 = require("./leaseLive");
const leaseOffer_1 = require("./leaseOffer");
const leaseStatic_1 = require("./leaseStatic");
const model_1 = require("./model");
const options_1 = require("./options");
function newServerConfig(options) {
    const config = {
        randomIP: options.randomIP || false,
        leaseStatic: options.leaseStatic || new leaseStatic_1.LeaseStaticStoreMemory({}),
        range: options.range,
        leaseLive: options.leaseLive || new leaseLive_1.LeaseLiveStoreMemory(),
        leaseOffer: options.leaseOffer || new leaseOffer_1.LeaseOfferStoreMemory(),
        forceOptions: options.forceOptions || ["hostname"],
    };
    for (const k in options) {
        const id = options_1.getDHCPId(k);
        if (id && !config[id])
            config[id] = options[k];
    }
    if (!config[model_1.OptionId.server])
        throw Error("server option is mandatoy");
    return config;
}
exports.newServerConfig = newServerConfig;
//# sourceMappingURL=ServerConfig.js.map