
import { ILeaseLiveStore, LeaseLiveStoreMemory } from "./leaseLive";
import { ILeaseOfferStore, LeaseOfferStoreMemory } from "./leaseOffer";
import { ILeaseStaticStore, LeaseStaticStoreMemory } from "./leaseStatic";
import { ASCIIs, Bool, IDHCPOptionsFncId, IPs, OptionId } from "./model";
import { getDHCPId } from "./options";

export interface IServerConfig extends IDHCPOptionsFncId {
    randomIP?: Bool; // Get random new IP from pool instead of keeping one ip
    leaseStatic?: ILeaseStaticStore;
    leaseLive?: ILeaseLiveStore;
    leaseOffer?: ILeaseOfferStore;
    range: IPs;
    forceOptions?: OptionId[]; // Options that need to be sent, even if they were not requested
}

export interface IServerConfigValid extends IServerConfig {
    randomIP: Bool; // Get random new IP from pool instead of keeping one ip
    leaseStatic: ILeaseStaticStore;
    leaseLive: ILeaseLiveStore;
    leaseOffer: ILeaseOfferStore;
    range: IPs;
    forceOptions: OptionId[]; // Options that need to be sent, even if they were not requested
}

export function newServerConfig(options: IServerConfig): IServerConfigValid {
    const config = {
        randomIP: options.randomIP || false,
        leaseStatic: options.leaseStatic || new LeaseStaticStoreMemory({}),
        range: options.range,
        leaseLive: options.leaseLive || new LeaseLiveStoreMemory(),
        leaseOffer: options.leaseOffer || new LeaseOfferStoreMemory(),
        forceOptions: options.forceOptions || [OptionId.hostname],
    } as IServerConfigValid;
    for (const k in options) {
        const id = getDHCPId(k);
        if (id && !config[id])
            config[id] = options[k];
    }
    if (!config[OptionId.server])
        throw Error("server option is mandatoy");
    return config;
}
