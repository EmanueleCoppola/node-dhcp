/**
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 */
import Tools from "../tools";
import { ILeaseLive, LeaseLiveStoreHelper } from "./ILeaseLiveStore";
import { ILeaseLiveStore } from "./ILeaseLiveStore";
import { IpRange } from "../IpRange";
import { IpConfiguration } from "../model";

export class LeaseLiveStoreMemory extends LeaseLiveStoreHelper implements ILeaseLiveStore {
    constructor() {
        super();
    }

    public async getLeaseFromMac(mac: string): Promise<ILeaseLive | null> {
        return this.cache[mac] || null;
    }

    public async hasAddress(address: string): Promise<boolean> {
        return this.address.has(address);
    }

    public async release(mac: string): Promise<ILeaseLive | null> {
        const old = this.cache[mac];
        if (old) {
            delete this.cache[old.mac];
            this.address.delete(old.address);
        }
        return old;
    }

    public async add(lease: ILeaseLive): Promise<boolean> {
        this.cache[lease.mac] = lease;
        this.address.add(lease.address);
        this.checkAge(lease);
        return true;
    }

    public async updateLease(lease: ILeaseLive): Promise<void> {
        this.checkAge(lease);
    }

    public async getLeases(): Promise<ILeaseLive[]> {
        return Object.values(this.cache);
    }

    public async getAddresses(): Promise<string[]> {
        return [...this.address];
    }

    public async getMacs(): Promise<string[]> {
        return Object.keys(this.cache);
    }

    public getLeases2(): ILeaseLive[] {
        return Object.values(this.cache);
    }

    public getAddresses2(): string[] {
        return [...this.address];
    }

    public getMacs2(): string[] {
        return Object.keys(this.cache);
    }

    public getFreeIP = (ranges: IpRange, reserverd: Array<Set<string>>, randomIP?: boolean): Promise<IpConfiguration> => {
        return Tools.genericGetFreeIP(ranges, [...reserverd, this.address], randomIP);
    }
}
