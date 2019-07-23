/**
 * Format:
 * name: A string description of the option
 * type: A type, which is used by SeqBuffer to parse the option
 * config: The name of the configuration option
 * attr: When a client sends data and an option has no configuration, this is the attribute name for the option
 * default: Gets passed if no configuration is supplied for the option (can be a value or a function)
 * enum: Represents a map of possible enum for this option
 */
export interface IOptionMeta {
    name: string;
    type: "IP" | "Int32" | "UInt32" | "UInt16" | "UInt8" | "IPs" | "IP" | "ASCII" | "Bool" | "UInt16s" | "UInt8s" | "any";
    attr?: string;
    enum?: {
        [key: number]: string;
    };
    config?: string;
    default?: any;
}
export declare const optsMeta: {
    [key: number]: IOptionMeta;
};
export declare const attrMapping: {
    [key: string]: number;
};
export declare function addOption(code: string, opt: IOptionMeta): void;
export declare function getDHCPId(key: string | number): number;
