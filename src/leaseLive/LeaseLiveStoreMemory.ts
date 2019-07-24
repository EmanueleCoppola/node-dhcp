/**
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 */
import { genericGetFreeIP } from "../tools";
import { ILeaseLive } from "./ILeaseLiveStore";
import { ILeaseLiveStore } from "./ILeaseLiveStore";

export class LeaseLiveStoreMemory implements ILeaseLiveStore {
    public cache: { [key: string]: ILeaseLive } = {};
    public address: Set<string> = new Set();

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
        return true;
    }

    public async updateLease(lease: ILeaseLive): Promise<void> {
        // nothink to do
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

    public async getFreeIP(IP1: string, IP2: string, reserverd?: Array<Set<string>>, randomIP?: boolean): Promise<string> {
        return genericGetFreeIP(IP1, IP2, [...reserverd, this.address], randomIP);
    }

}
