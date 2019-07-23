import { ILeaseLive } from "../Lease";
import { ILeaseOfferStore } from "./ILeaseOfferStore";
export declare class LeaseOfferStoreMemory implements ILeaseOfferStore {
    private cache;
    private ips;
    /**
     * lease expiration in sec (should be less that 60 sec)
     */
    private timeOut;
    constructor(timeout?: number);
    add(lease: ILeaseLive): void;
    pop(mac: string): ILeaseLive;
    getReservedIP(): Set<string>;
    private remove;
}
