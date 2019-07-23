import { DHCPOptions } from "./DHCPOptions";
import { ILeaseLiveStore } from "./leaseLive";
import { ILeaseOfferStore } from "./leaseOffer";
import { ILeaseStaticStore } from "./leaseStatic";
import { ASCIIs, DHCPOptionsBase, IDHCPMessage, IPs, OptionId } from "./model";
export interface IServerConfig extends DHCPOptionsBase {
    randomIP?: boolean;
    static: ILeaseStaticStore;
    range: IPs;
    leaseState?: ILeaseLiveStore;
    forceOptions?: ASCIIs;
}
export declare class ServerConfig extends DHCPOptions {
    randomIP: boolean;
    leaseStatic: ILeaseStaticStore;
    leaseLive: ILeaseLiveStore;
    LeaseOffer: ILeaseOfferStore;
    private range;
    private forceOptions;
    constructor(options: IServerConfig);
    get(key: OptionId | string, requested?: IDHCPMessage): any;
}
