import { DHCPOptions, DHCPOptionsBase } from './DHCPOptions';
import { ILeaseStore } from './leaseStore/ILeaseStote';
import { ASCIIs, IDHCPMessage, IPs, OptionId } from './model';
import { IStaticLeaseStore } from './staticLeaseStore/IStaticLeaseStore';
export interface IServerConfig extends DHCPOptionsBase {
    randomIP?: boolean;
    static: IStaticLeaseStore;
    range: IPs;
    leaseState?: ILeaseStore;
    forceOptions?: ASCIIs;
}
export declare class ServerConfig extends DHCPOptions {
    randomIP: boolean;
    static: IStaticLeaseStore;
    leaseState: ILeaseStore;
    private range;
    private forceOptions;
    constructor(options: IServerConfig);
    get(key: OptionId | string, requested?: IDHCPMessage): any;
    getStatic(): IStaticLeaseStore | undefined;
}
