"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DHCPOptions_1 = require("./DHCPOptions");
const extraOption = new Set(['range', 'forceOptions', 'randomIP', 'static']);
class ServerConfig extends DHCPOptions_1.DHCPOptions {
    constructor(options) {
        super(options);
        if (options)
            for (const key in options) {
                if (extraOption.has(key))
                    this[key] = options[key];
            }
        if (!options.forceOptions)
            this.forceOptions = ['hostname'];
        if (!this.get('server'))
            throw Error('server option is mandatoy');
    }
    /**
     * @param key the request Key or optionId
     * @param requested the remote Options
     */
    get(key, requested) {
        if (extraOption.has(key)) {
            let val = null;
            switch (key) {
                case 'range':
                    val = this.range;
                    break;
                case 'forceOptions':
                    val = this.forceOptions;
                    break;
                case 'randomIP':
                    val = this.randomIP;
                    break;
                case 'static': // can be a function
                    return this.static;
            }
            if (typeof val === 'function') {
                return val.call(this, requested || this);
            }
            return val;
        }
        return super.get(key, requested);
    }
}
exports.ServerConfig = ServerConfig;
//# sourceMappingURL=ServerConfig.js.map