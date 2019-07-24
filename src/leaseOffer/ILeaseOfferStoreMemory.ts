/**
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 */
import { ILeaseLive } from "../leaseLive/ILeaseLiveStore";
import { ILeaseOfferStore } from "./ILeaseOfferStore";

interface ILeaseOffer extends ILeaseLive {
    timer?: NodeJS.Timeout;
}

export class LeaseOfferStoreMemory implements ILeaseOfferStore {
    private cache: { [key: string]: ILeaseOffer };
    private ips: Set<string>;
    /**
     * lease expiration in sec (should be less that 60 sec)
     */
    private timeOut: number;

    constructor(timeout?: number) {
        this.timeOut = timeout || 10;
        this.cache = {};
        this.ips = new Set();
    }

    public add(lease: ILeaseLive): void {
        this.pop(lease.mac);
        this.cache[lease.mac] = lease;
        this.ips.add(lease.address);
        (lease as ILeaseOffer).timer = setTimeout(() => this.remove(lease), this.timeOut * 1000);
    }

    public pop(mac: string): ILeaseLive {
        const old = this.cache[mac];
        this.remove(old);
        return old;
    }

    public getReservedIP(): Set<string> {
        return this.ips;
    }

    private remove(lease: ILeaseOffer) {
        if (lease) {
            delete this.cache[lease.mac];
            this.ips.delete(lease.address);
            delete lease.timer;
        }
    }
}
