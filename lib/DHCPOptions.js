"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const options_1 = require("./options");
class DHCPOptions {
    constructor(data) {
        if (data)
            for (const key in data) {
                const n = options_1.getDHCPId(key);
                if (n)
                    this[n] = data[key];
            }
    }
    get(key, requested) {
        const n = options_1.getDHCPId(key);
        let val = this[n];
        if (val === undefined) {
            const meta = options_1.optsMeta[n];
            if (meta.default)
                val = meta.default;
            else
                return null;
        }
        if (typeof val === 'function') {
            val = val(requested || this);
        }
        /*
        // mapping or not mapping that the question
        const meta = OptionsModel.optsMeta[n];
        if (meta && meta.enum) {
          const values = OptionsModel.optsMeta[optId].enum;
          // Check if value is an actual enum string
          for (const i in values)
              if (values[i] === val)
                  return Number(i);
          // Okay, check  if it is the numeral value of the enum
          if (values[val] === undefined) {
              throw new Error(`Provided enum value for ${key} is not valid`);
          } else {
              val = Number(val);
          }
        */
        return val;
    }
}
exports.DHCPOptions = DHCPOptions;
//# sourceMappingURL=DHCPOptions.js.map