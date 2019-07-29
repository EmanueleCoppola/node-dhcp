/**
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 */
import debounce from "debounce";
import * as fse from "fs-extra";
import { genericGetFreeIP } from "../tools";
import { ILeaseLive, LeaseLiveStoreHelper } from "./ILeaseLiveStore";
import { ILeaseLiveStore } from "./ILeaseLiveStore";

export interface IFlushEvent {
    on(event: "save", listener: (file: string, nbLease: number) => void): this;
    once(event: "save", listener: (file: string, nbLease: number) => void): this;
}

export class LeaseLiveStoreFile extends LeaseLiveStoreHelper implements ILeaseLiveStore, IFlushEvent {
    public save: () => void;

    private file: string;

    constructor(file: string) {
        super();
        this.file = file;
        this.save = debounce(() => this._save(), 300);
        let data: ILeaseLive[];
        try {
            data = fse.readJSONSync(this.file);
        } catch (e) {
            data = [];
        }
        this.reIndex(data);
        this.on("expire", () => this.save());
    }

    public async getLeaseFromMac(mac: string): Promise<ILeaseLive | null> {
        return this.cache[mac] || null;
    }

    public getLeaseFromMac2(mac: string): ILeaseLive | null {
        return this.cache[mac] || null;
    }

    public async hasAddress(address: string): Promise<boolean> {
        return this.address.has(address);
    }

    public hasAddress2(address: string): boolean {
        return this.address.has(address);
    }

    public async add(lease: ILeaseLive): Promise<boolean> {
        const out = this._add(lease);
        if (out)
            this.save();
        this.checkAge(lease);
        return out;
    }

    public async release(mac: string): Promise<ILeaseLive | null> {
        const old = this.cache[mac];
        if (old) {
            this._delete(old);
            this.save();
        }
        return old;
    }

    public async updateLease(lease: ILeaseLive): Promise<void> {
        this.checkAge(lease);
        this.save();
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

    public getFreeIP = (IP1: string, IP2: string, reserverd: Array<Set<string>>, randomIP?: boolean): Promise<string> => {
        return genericGetFreeIP(IP1, IP2, [...reserverd, this.address], randomIP);
    }

    private _save() {
        const data = Object.values(this.cache);
        this.emit("save", this.file, data.length);
        return fse.writeJSON(`${this.file}`, data, { spaces: 2 });
    }

    private reIndex(leases: ILeaseLive[]) {
        this.cache = {};
        this.address = new Set();

        for (const entry of leases) {
            this._add(entry);
        }
    }

    private _add(lease: ILeaseLive) {
        const prev = this.cache[lease.mac];
        if (prev) {
            if (prev.address !== lease.address)
                this.address.delete(prev.address);
        }
        this.cache[lease.mac] = lease;
        this.address.add(lease.address);
        return true;
    }

    private _delete(lease: ILeaseLive) {
        if (!lease)
            return false;
        const prev = this.cache[lease.mac];
        if (prev) {
            this.address.delete(prev.address);
            delete this.cache[lease.mac];
        }
        return true;
    }
}
