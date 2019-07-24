import { ILeaseLiveStore } from "./leaseLive";
import { ILeaseOfferStore } from "./leaseOffer";
import { ILeaseStaticStore } from "./leaseStatic";
import { ASCIIs, Bool, IDHCPOptionsFncId, IPs } from "./model";
export interface IServerConfig extends IDHCPOptionsFncId {
    randomIP?: Bool;
    leaseStatic?: ILeaseStaticStore;
    leaseLive?: ILeaseLiveStore;
    leaseOffer?: ILeaseOfferStore;
    range: IPs;
    forceOptions?: ASCIIs;
}
export interface IServerConfigValid extends IServerConfig {
    randomIP: Bool;
    leaseStatic: ILeaseStaticStore;
    leaseLive: ILeaseLiveStore;
    leaseOffer: ILeaseOfferStore;
    range: IPs;
    forceOptions: ASCIIs;
}
export declare function newServerConfig(options: IServerConfig): IServerConfigValid;
