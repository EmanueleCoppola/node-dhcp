import { getDHCPId, optsMeta } from './options';
import { IP } from './Server';
import { Int32, ASCII, UInt16, DHCPEnabled, UInt8, UInt32, DHCP46Code, DHCP52Code, DHCP53Code, OptionId, DHCP116Code } from './model';

export class DHCPOptions {
    public 1?: IP;
    public 2?: Int32;
    public 3?: IP;
    public 4?: IP[];
    public 5?: IP[];
    public 6?: IP[];
    public 7?: IP[];
    public 8?: IP[];
    public 9?: IP[];
    public 10?: IP[];
    public 11?: IP[];
    public 12?: ASCII;
    public 13?: UInt16;
    public 14?: ASCII;
    public 15?: ASCII;
    public 16?: IP;
    public 17?: ASCII;
    public 18?: ASCII;
    public 19?: DHCPEnabled;
    public 20?: boolean;
    public 21?: IP[];
    public 22?: UInt16;
    public 23?: UInt8;
    public 24?: UInt32;
    public 25?: UInt16[];
    public 26?: UInt16;
    public 27?: DHCPEnabled;
    public 28?: IP;
    public 29?: DHCPEnabled;
    public 30?: DHCPEnabled;
    public 31?: DHCPEnabled;
    public 32?: IP;
    public 33?: IP[];
    public 34?: boolean;
    public 35?: UInt32;
    public 36?: boolean;
    public 37?: UInt8;
    public 38?: UInt32;
    public 39?: boolean;
    public 40?: ASCII;
    public 41?: IP[];
    public 42?: IP[];
    public 43?: UInt8[];
    public 44?: IP[];
    public 45?: IP;
    public 46?: DHCP46Code;
    public 47?: ASCII;
    public 48?: IP[];
    public 49?: IP[];
    public 50?: IP;
    public 51?: UInt32;
    public 52?: DHCP52Code;
    public 53?: DHCP53Code;
    public 54?: IP;
    public 55?: UInt8[];
    public 56?: ASCII;
    public 57?: UInt16;
    public 58?: UInt32;
    public 59?: UInt32;
    public 60?: ASCII;
    public 61?: ASCII;
    public 64?: ASCII;
    public 65?: IP[];
    public 66?: ASCII;
    public 67?: ASCII;
    public 68?: ASCII;
    public 69?: IP[];
    public 70?: IP[];
    public 71?: IP[];
    public 72?: IP[];
    public 73?: IP[];
    public 74?: IP[];
    public 75?: IP[];
    public 76?: IP[];
    public 80?: boolean;
    // 82?: { // RFC 3046, relayAgentInformation
    public 116?: DHCP116Code;
    public 118?: IP;
    public 119?: ASCII;
    public 121?: IP[];
    public 145?: UInt8[];
    public 208?: UInt32;
    public 209?: ASCII;
    public 210?: ASCII;
    public 211?: UInt32;
    public 252?: ASCII;
  
    constructor(data?: any) {
      if (data)
        for (const key in data) {
          const n = getDHCPId(key);
          if (n)
            this[n] = data[key];
        }
    }
  
    public get(key: OptionId | string, requested: DHCPOptions): any {
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
  