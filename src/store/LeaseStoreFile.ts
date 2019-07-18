import debounce from 'debounce';
import * as fse from 'fs-extra';
import { Lease } from '../Lease';
import { genericGetFreeIP } from '../tools';
import { ILeaseStore } from './ILeaseStote';

export class LeaseStoreFile implements ILeaseStore {
    public cache: { [key: string]: Lease } = {};
    public address: Set<string> = new Set();
    public oldest: Lease | null = null;
    public cnt = 0;
    public save: () => void;

    private file: string;

    constructor(file: string) {
        this.file = file;
        this.save = debounce(() => this._save(), 300);
        let data: Lease[];
        try {
            data = fse.readJSONSync(this.file);
        } catch (e) {
            data = [];
        }
        this.reIndex(data);
    }

    public async getLeaseFromMac(mac: string): Promise<Lease | null> {
        return this.cache[mac] || null;
    }

    public async hasAddress(address: string): Promise<boolean> {
        return this.address.has(address);
    }

    public async size(): Promise<number> {
    return this.cnt;
    }

    public async add(lease: Lease): Promise<boolean> {
        const out = this._add(lease);
        if (out)
            this.save();
        return out;
    }

    public async getOldest(): Promise<Lease | null> {
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

    public async getLeases(): Promise<Lease[]> {
        return Object.values(this.cache);
    }

    public async getAddresses(): Promise<string[]> {
        return [...this.address];
    }

    public async getMacs(): Promise<string[]> {
        return Object.keys(this.cache);
    }

    public getLeases2(): Lease[] {
        return Object.values(this.cache);
    }

    public getAddresses2(): string[] {
        return [...this.address];
    }

    public getMacs2(): string[] {
        return Object.keys(this.cache);
    }

    public async getFreeIP(IP1: string, IP2: string, reserverd?: string[], randomIP?: boolean): Promise<string> {
        return genericGetFreeIP(IP1, IP2, new Set(reserverd), this.address, this.cnt, randomIP);
    }

    private _save() {
        return fse.writeJSON(`${this.file}`, Object.values(this.cache), { spaces: 2 });
    }

    private reIndex(leases: Lease[]) {
        const index: { [key: string]: Lease } = {};
        this.cache = {};
        this.address = new Set();
        this.oldest = null;
        this.cnt = 0;

        for (const entry of leases) {
            this._add(entry);
        }
    }

    private _add(lease: Lease) {
        this.cache[lease.mac] = lease;
        this.address.add(lease.address);
        this.cnt++;
        return true;
    }
}
