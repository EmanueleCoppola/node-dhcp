import { DHCPOptions, DHCPOptionsBase } from "./DHCPOptions";
import { ILeaseStore } from "./leaseStore/ILeaseStote";
import { LeaseStoreMemory } from "./leaseStore/LeaseStoreMemory";
import { ASCIIs, IDHCPMessage, IPs, OptionId } from "./model";
import { IStaticLeaseStore } from "./staticLeaseStore/IStaticLeaseStore";
import { StaticLeaseStoreMemory } from "./staticLeaseStore/StaticLeaseStoreMemory";

export interface IServerConfig extends DHCPOptionsBase {
    randomIP?: boolean; // Get random new IP from pool instead of keeping one ip
    static: IStaticLeaseStore;
    range: IPs;
    leaseState?: ILeaseStore;
    forceOptions?: ASCIIs; // Options that need to be sent, even if they were not requested
}

const extraOption = new Set(["range", "forceOptions", "randomIP", "static", "leaseState"]);

export class ServerConfig extends DHCPOptions {
    public randomIP: boolean; // Get random new IP from pool instead of keeping one ip
    public static: IStaticLeaseStore;
    public leaseState: ILeaseStore;
    private range: IPs;
    private forceOptions: ASCIIs; // Options that need to be sent, even if they were not requested

    constructor(options: IServerConfig) {
        super(options);
        this.randomIP = options.randomIP || false;
        this.static = options.static || new StaticLeaseStoreMemory({});
        this.range = options.range;
        this.leaseState = options.leaseState || new LeaseStoreMemory();
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
                    return this.static;
                case "leaseState": // can be a function
                    return this.leaseState;
            }
            if (typeof val === "function") {
                return val.call(this, requested || this);
            }
            return val;
        }
        return super.get(key, requested);
    }

    public getStatic(): IStaticLeaseStore | undefined {
        return this.static;
    }
}
