"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
const DHCPOptions_1 = require("./DHCPOptions");
const model_1 = require("./model");
const options_1 = require("./options");
const extraOption = new Set(["mac", "features"]);
class ClientConfig extends DHCPOptions_1.DHCPOptions {
    constructor(options) {
        super(options);
        if (!options)
            return;
        for (const key in options) {
            if (extraOption.has(key))
                this[key] = options[key];
        }
    }
    getMac() {
        if (this.mac)
            return this.mac;
        const macs = [];
        const inets = os_1.networkInterfaces();
        Object.values(inets).forEach((inet) => {
            inet.filter((add) => add.family === "IPv4" && !add.internal)
                .forEach((add) => macs.push(add.mac));
        });
        if (macs.length > 1)
            throw new Error(`${macs.length} network interfaces detected, set mac address manually from
- ${macs.join("\n - ")}
\tclient = dhcp.createClient({mac: "12:23:34:45:56:67"});`);
        if (macs.length === 1)
            this.mac = macs[0];
        else
            throw new Error('No network interfaces detected, set mac address manually:\n\tclient = dhcp.createClient({mac: "12:23:34:45:56:67"});');
        return this.mac;
    }
    getFeatures() {
        // Default list we request
        const defaultFeatures = [
            model_1.OptionId.netmask,
            model_1.OptionId.router,
            model_1.OptionId.leaseTime,
            model_1.OptionId.server,
            model_1.OptionId.dns,
        ];
        const fSet = new Set(defaultFeatures);
        const configFeatures = this.features;
        if (configFeatures) {
            for (const f of configFeatures) {
                const id = options_1.getDHCPId(f);
                if (!id)
                    throw new Error("Unknown option " + f);
                if (fSet.has(id))
                    continue;
                defaultFeatures.push(id);
                fSet.add(id);
            }
        }
        return defaultFeatures;
    }
    get(key, remote) {
        if (extraOption.has(key)) {
            let val = null;
            switch (key) {
                case "mac":
                    val = this.mac;
                    break;
                case "features":
                    val = this.features;
                    break;
            }
            if (typeof val === "function") {
                return val.call(this, remote || this);
            }
            return val;
        }
        return super.get(key, remote);
    }
}
exports.ClientConfig = ClientConfig;
//# sourceMappingURL=ClientConfig.js.map