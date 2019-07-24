"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable max-classes-per-file */
const model_1 = require("./model");
const options_1 = require("./options");
/**
 * hold a DHCPOtioms map that support funtion value
 *
 * Only used in DHCP server configuragion
 */
class DHCPOptions extends model_1.DHCPOptionsFnc {
    constructor(data) {
        super();
        if (data)
            for (const key in data) {
                const n = options_1.getDHCPId(key);
                if (n)
                    this[n] = data[key];
            }
    }
}
exports.DHCPOptions = DHCPOptions;
//# sourceMappingURL=DHCPOptions.js.map