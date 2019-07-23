import { DHCPOptionsBase, IDHCPMessage, OptionId } from "./model";
export declare class DHCPOptions extends DHCPOptionsBase {
    constructor(data?: any | DHCPOptionsBase);
    get(key: OptionId | string, requested: IDHCPMessage): any;
}
