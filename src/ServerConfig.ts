import { DHCPOptions } from "./DHCPOptions";
import { ILeaseLiveStore, LeaseLiveStoreMemory } from "./leaseLive";
import { ILeaseOfferStore } from "./leaseOffer";
import { ILeaseStaticStore, LeaseStaticStoreMemory } from "./leaseStatic";
import { ASCIIs, DHCPOptionsBase, IDHCPMessage, IPs, OptionId } from "./model";

export interface IServerConfig extends DHCPOptionsBase {
    randomIP?: boolean; // Get random new IP from pool instead of keeping one ip
    static: ILeaseStaticStore;
    range: IPs;
    leaseState?: ILeaseLiveStore;
    forceOptions?: ASCIIs; // Options that need to be sent, even if they were not requested
}

const extraOption = new Set(["range", "forceOptions", "randomIP", "static", "leaseState"]);

export class ServerConfig extends DHCPOptions {
    public randomIP: boolean; // Get random new IP from pool instead of keeping one ip
    public leaseStatic: ILeaseStaticStore;
    public leaseLive: ILeaseLiveStore;
    public LeaseOffer: ILeaseOfferStore;
    private range: IPs;
    private forceOptions: ASCIIs; // Options that need to be sent, even if they were not requested

    constructor(options: IServerConfig) {
        super(options);
        this.randomIP = options.randomIP || false;
        this.leaseStatic = options.static || new LeaseStaticStoreMemory({});
        this.range = options.range;
        this.leaseLive = options.leaseState || new LeaseLiveStoreMemory();
        this.forceOptions = options.forceOptions || ["hostname"];
        if (!this.get("server"))
            throw Error("server option is mandatoy");
    }

    public get(key: OptionId | string, requested?: IDHCPMessage): any;

    /**
     * @param key the request Key or optionId
     * @param requested the remote Options
     */
    public get(key: OptionId | string, requested?: IDHCPMessage): any {
        if (extraOption.has(key as any)) {
            let val: any = null;
            switch (key) {
                case "range":
                    val = this.range;
                    break;
                case "forceOptions":
                    val = this.forceOptions;
                    break;
                case "randomIP":
                    val = this.randomIP;
                    break;
                case "static": // can be a function
                    return this.leaseStatic;
                case "leaseState": // can be a function
                    return this.leaseLive;
            }
            if (typeof val === "function") {
                return val.call(this, requested || this);
            }
            return val;
        }
        return super.get(key, requested);
    }
}
