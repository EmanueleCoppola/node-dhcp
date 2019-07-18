import { DHCPOptions, DHCPOptionsBase } from './DHCPOptions';
import { ASCIIs, IDHCPMessage, IPs, OptionId } from './model';
import { ILeaseStore } from './store/ILeaseStote';
export interface IServerConfig extends DHCPOptionsBase {
    randomIP?: boolean;
    static: {
        [key: string]: string;
    } | ((mac: string, request: IDHCPMessage) => string | null);
    range: IPs;
    leaseState?: ILeaseStore;
    forceOptions?: ASCIIs;
}
export declare type leaseType = (mac: string, request: IDHCPMessage) => string | null;
export declare class ServerConfig extends DHCPOptions {
    randomIP: boolean;
    static: leaseType;
    leaseState?: ILeaseStore;
    private range;
    private forceOptions;
    constructor(options: IServerConfig);
    get(key: 'static', requested?: IDHCPMessage): {
        [key: string]: string;
    } | leaseType;
    get(key: OptionId | string, requested?: IDHCPMessage): any;
}
