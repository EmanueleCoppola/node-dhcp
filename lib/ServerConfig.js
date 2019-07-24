"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DHCPOptions_1 = require("./DHCPOptions");
const leaseLive_1 = require("./leaseLive");
const leaseOffer_1 = require("./leaseOffer");
const leaseStatic_1 = require("./leaseStatic");
const model_1 = require("./model");
// export type ServerConfigKey = "range" | "forceOptions" | "randomIP" | "static" | "leaseState";
class ServerConfig extends DHCPOptions_1.DHCPOptions {
    constructor(options) {
        super(options);
        this.randomIP = options.randomIP || false;
        this.leaseStatic = options.leaseStatic || new leaseStatic_1.LeaseStaticStoreMemory({});
        this.range = options.range;
        this.leaseLive = options.leaseState || new leaseLive_1.LeaseLiveStoreMemory();
        this.leaseOffer = options.leaseOffer || new leaseOffer_1.LeaseOfferStoreMemory();
        this.forceOptions = options.forceOptions || ["hostname"];
        if (!this[model_1.OptionId.server])
            throw Error("server option is mandatoy");
    }
}
exports.ServerConfig = ServerConfig;
//# sourceMappingURL=ServerConfig.js.map