"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DHCPOptions_1 = require("./DHCPOptions");
const leaseLive_1 = require("./leaseLive");
const leaseStatic_1 = require("./leaseStatic");
const extraOption = new Set(["range", "forceOptions", "randomIP", "static", "leaseState"]);
class ServerConfig extends DHCPOptions_1.DHCPOptions {
    constructor(options) {
        super(options);
        this.randomIP = options.randomIP || false;
        this.static = options.static || new leaseStatic_1.StaticLeaseStoreMemory({});
        this.range = options.range;
        this.leaseState = options.leaseState || new leaseLive_1.LeaseStoreMemory();
        this.forceOptions = options.forceOptions || ["hostname"];
        if (!this.get("server"))
            throw Error("server option is mandatoy");
    }
    /**
     * @param key the request Key or optionId
     * @param requested the remote Options
     */
    get(key, requested) {
        if (extraOption.has(key)) {
            let val = null;
            switch (key) {
                case "range":
                    val = this.range;
                    break;
                case "forceOptions":
                    val = this.forceOptions;
                    break;
                case "randomIP":
                    val = this.randomIP;
                    break;
                case "static": // can be a function
                    return this.static;
                case "leaseState": // can be a function
                    return this.leaseState;
            }
            if (typeof val === "function") {
                return val.call(this, requested || this);
            }
            return val;
        }
        return super.get(key, requested);
    }
    getStatic() {
        return this.static;
    }
}
exports.ServerConfig = ServerConfig;
//# sourceMappingURL=ServerConfig.js.map