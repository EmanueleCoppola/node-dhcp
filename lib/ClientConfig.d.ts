import { DHCPOptions, DHCPOptionsBase } from './DHCPOptions';
import { IDHCPMessage, OptionId } from './model';
export interface IClientConfig extends DHCPOptionsBase {
    mac?: string;
    features?: string[];
}
export declare class ClientConfig extends DHCPOptions {
    mac?: string;
    features?: string[];
    constructor(options?: IClientConfig);
    getMac(): string;
    getFeatures(): number[];
    get(key: OptionId | string, remote: IDHCPMessage): any;
}
