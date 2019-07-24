import { DHCPOptions } from "./DHCPOptions";
import { ILeaseLiveStore } from "./leaseLive";
import { ILeaseOfferStore } from "./leaseOffer";
import { ILeaseStaticStore } from "./leaseStatic";
import { ASCIIs, Bool, DHCPOptionsFnc, IPs } from "./model";
export interface IServerConfig extends DHCPOptionsFnc {
    randomIP?: Bool;
    range: IPs;
    leaseStatic?: ILeaseStaticStore;
    leaseLive?: ILeaseLiveStore;
    leaseOffer?: ILeaseOfferStore;
    forceOptions?: ASCIIs;
}
export declare class ServerConfig extends DHCPOptions {
    randomIP: Bool;
    leaseStatic: ILeaseStaticStore;
    leaseLive: ILeaseLiveStore;
    leaseOffer: ILeaseOfferStore;
    range: IPs;
    forceOptions: ASCIIs;
    constructor(options: IServerConfig);
}
