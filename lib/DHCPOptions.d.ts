import { ASCII, DHCP116Code, DHCP46Code, DHCP52Code, DHCP53Code, DHCPEnabled, IDHCPMessage, Int32, OptionId, UInt16, UInt32, UInt8 } from './model';
import { IP } from './model';
export declare class DHCPOptionsBase {
    1?: IP;
    2?: Int32;
    3?: IP;
    4?: IP[];
    5?: IP[];
    6?: IP[];
    7?: IP[];
    8?: IP[];
    9?: IP[];
    10?: IP[];
    11?: IP[];
    12?: ASCII;
    13?: UInt16;
    14?: ASCII;
    15?: ASCII;
    16?: IP;
    17?: ASCII;
    18?: ASCII;
    19?: DHCPEnabled;
    20?: boolean;
    21?: IP[];
    22?: UInt16;
    23?: UInt8;
    24?: UInt32;
    25?: UInt16[];
    26?: UInt16;
    27?: DHCPEnabled;
    28?: IP;
    29?: DHCPEnabled;
    30?: DHCPEnabled;
    31?: DHCPEnabled;
    32?: IP;
    33?: IP[];
    34?: boolean;
    35?: UInt32;
    36?: boolean;
    37?: UInt8;
    38?: UInt32;
    39?: boolean;
    40?: ASCII;
    41?: IP[];
    42?: IP[];
    43?: UInt8[];
    44?: IP[];
    45?: IP;
    46?: DHCP46Code;
    47?: ASCII;
    48?: IP[];
    49?: IP[];
    50?: IP;
    51?: UInt32;
    52?: DHCP52Code;
    53?: DHCP53Code;
    54?: IP;
    55?: UInt8[];
    56?: ASCII;
    57?: UInt16;
    58?: UInt32;
    59?: UInt32;
    60?: ASCII;
    61?: ASCII;
    64?: ASCII;
    65?: IP[];
    66?: ASCII;
    67?: ASCII;
    68?: ASCII;
    69?: IP[];
    70?: IP[];
    71?: IP[];
    72?: IP[];
    73?: IP[];
    74?: IP[];
    75?: IP[];
    76?: IP[];
    80?: boolean;
    116?: DHCP116Code;
    118?: IP;
    119?: ASCII;
    121?: IP[];
    145?: UInt8[];
    208?: UInt32;
    209?: ASCII;
    210?: ASCII;
    211?: UInt32;
    252?: ASCII;
}
export declare class DHCPOptions extends DHCPOptionsBase {
    constructor(data?: any);
    get(key: OptionId | string, requested: IDHCPMessage): any;
}
