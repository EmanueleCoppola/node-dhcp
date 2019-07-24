import { DHCPOptions } from "./DHCPOptions";
import { ILeaseLiveStore, LeaseLiveStoreMemory } from "./leaseLive";
import { ILeaseOfferStore, LeaseOfferStoreMemory } from "./leaseOffer";
import { ILeaseStaticStore, LeaseStaticStoreMemory } from "./leaseStatic";
import { ASCIIs, Bool, DHCPOptionsFnc, IDHCPMessage, IPs, OptionId } from "./model";

export interface IServerConfig extends DHCPOptionsFnc {
    randomIP?: Bool; // Get random new IP from pool instead of keeping one ip
    range: IPs;
    leaseStatic?: ILeaseStaticStore;
    leaseLive?: ILeaseLiveStore;
    leaseOffer?: ILeaseOfferStore;
    forceOptions?: ASCIIs; // Options that need to be sent, even if they were not requested
}
// export type ServerConfigKey = "range" | "forceOptions" | "randomIP" | "static" | "leaseState";

export class ServerConfig extends DHCPOptions {
    public randomIP: Bool; // Get random new IP from pool instead of keeping one ip
    public leaseStatic: ILeaseStaticStore;
    public leaseLive: ILeaseLiveStore;
    public leaseOffer: ILeaseOfferStore;
    public range: IPs;
    public forceOptions: ASCIIs; // Options that need to be sent, even if they were not requested

    constructor(options: IServerConfig) {
        super(options);
        this.randomIP = options.randomIP || false;
        this.leaseStatic = options.leaseStatic || new LeaseStaticStoreMemory({});
        this.range = options.range;
        this.leaseLive = options.leaseLive || new LeaseLiveStoreMemory();
        this.leaseOffer = options.leaseOffer || new LeaseOfferStoreMemory();
        this.forceOptions = options.forceOptions || ["hostname"];
        if (!this[OptionId.server])
            throw Error("server option is mandatoy");
    }
}
