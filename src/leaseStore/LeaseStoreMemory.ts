import { ILease } from "../Lease";
import { genericGetFreeIP } from "../tools";
import { ILeaseStore } from "./ILeaseStote";

export class LeaseStoreMemory implements ILeaseStore {
    public cache: { [key: string]: ILease } = {};
    public address: Set<string> = new Set();
    public oldest: ILease | null = null;
    public cnt = 0;

    public async getLeaseFromMac(mac: string): Promise<ILease | null> {
        return this.cache[mac] || null;
    }

    public async hasAddress(address: string): Promise<boolean> {
        return this.address.has(address);
    }

    public async size(): Promise<number> {
        return this.cnt;
    }

    public async add(lease: ILease): Promise<boolean> {
        this.cache[lease.mac] = lease;
        this.address.add(lease.address);
        this.cnt++;
        return true;
    }

    // public getOldest(): Lease | null {
    //    if (this.oldest)
    //        return this.oldest;
    //    let oldest: Lease | null = null;
    //    let oldestTime = Infinity;
    //    for (const lease of Object.values(this.cache)) {
    //        if (lease.leaseTime < oldestTime) {
    //            oldestTime = lease.leaseTime;
    //            oldest = lease;
    //        }
    //    }
    //    this.oldest = oldest;
    //    return oldest;
    // }

    public async getLeases(): Promise<ILease[]> {
        return Object.values(this.cache);
    }

    public async getAddresses(): Promise<string[]> {
        return [...this.address];
    }

    public async getMacs(): Promise<string[]> {
        return Object.keys(this.cache);
    }

    public getLeases2(): ILease[] {
        return Object.values(this.cache);
    }

    public getAddresses2(): string[] {
        return [...this.address];
    }

    public getMacs2(): string[] {
        return Object.keys(this.cache);
    }

    public async getFreeIP(IP1: string, IP2: string, reserverd?: Array<Set<string>>, randomIP?: boolean): Promise<string> {
        return genericGetFreeIP(IP1, IP2, [...reserverd, this.address], this.cnt, randomIP);
    }

}
