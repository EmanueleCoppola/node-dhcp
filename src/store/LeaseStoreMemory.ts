import { Lease } from '../Lease';
import { ILeaseStore } from './ILeaseStote';

export class LeaseStoreMemory implements ILeaseStore {
    public cache: { [key: string]: Lease } = {};
    public address: Set<string> = new Set();
    public oldest: Lease | null = null;
    public cnt = 0;

    public getLeaseFromMac(mac: string): Lease | null {
        return this.cache[mac] || null;
    }

    public hasAddress(address: string): boolean {
        return this.address.has(address);
    }

    public size(): number {
        return this.cnt;
    }

    public add(lease: Lease) {
        this.cache[lease.mac] = lease;
        this.address.add(lease.address);
        this.cnt++;
        return true;
    }

    public getOldest(): Lease | null {
        if (this.oldest)
            return this.oldest;
        let oldest: Lease | null = null;
        let oldestTime = Infinity;
        for (const lease of Object.values(this.cache)) {
            if (lease.leaseTime < oldestTime) {
                oldestTime = lease.leaseTime;
                oldest = lease;
            }
        }
        this.oldest = oldest;
        return oldest;
    }

    public getLeases(): Lease[] {
        return Object.values(this.cache);
    }

    public getAddresses(): string[] {
        return [...this.address];
    }

    public getMacs(): string[] {
        return Object.keys(this.cache);
    }

}
