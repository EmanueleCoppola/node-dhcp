import { DHCPOptionsFnc } from "./model";
export interface IClientConfig extends DHCPOptionsFnc {
    mac?: string;
    features?: string[];
}
export declare class ClientConfig {
    mac?: string;
    features?: string[];
    constructor(options?: IClientConfig);
    getMac(): string;
    getFeatures(): number[];
}
