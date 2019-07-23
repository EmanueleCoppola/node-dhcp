/* tslint:disable max-classes-per-file */
import { DHCPOptionsBase, IDHCPMessage, OptionId } from './model';
import { getDHCPId, optsMeta } from './options';

export class DHCPOptions extends DHCPOptionsBase {
  constructor(data?: any | DHCPOptionsBase) {
    super();
    if (data)
      for (const key in data) {
        const n = getDHCPId(key);
        if (n)
          this[n] = data[key];
      }
  }

  public get(key: OptionId | string, requested: IDHCPMessage): any {
    const n = getDHCPId(key);
    let val = this[n];
    if (val === undefined) {
      const meta = optsMeta[n];
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
