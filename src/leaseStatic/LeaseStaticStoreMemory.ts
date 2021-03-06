/**
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 */
import { IDHCPMessage } from "../model";
import { ILeaseEx, LeaseStaticStoreHelper } from "./ILeaseStaticStore";
import { ILeaseStaticStore } from "./ILeaseStaticStore";

/**
 * basic static Lease conmfiguration module
 */
export class LeaseStaticStoreMemory extends LeaseStaticStoreHelper implements ILeaseStaticStore {
    private data: { [key: string]: string } = {};
    private set: Set<string>;

    constructor(leases: { [key: string]: string }) {
        super();
        this.data = { ...leases };
        this.set = new Set(Object.values(this.data));
    }

    public addStatic(mac: string, ip: string) {
        const old = this.data[mac];
        if (old) {
            this.set.delete(old);
        }
        this.data[mac] = ip;
    }

    public delStatic(mac: string) {
        const old = this.data[mac];
        if (old) {
            this.set.delete(old);
        }
        delete this.data[mac];
    }

    public getLeaseFromMac(mac: string, request?: IDHCPMessage): ILeaseEx | null {
        const address = this.data[mac];
        if (address)
            return { mac, address };
        return null;
    }

    public hasAddress(address: string): boolean {
        return this.set.has(address);
    }

    public getReservedIP(): Set<string> {
        return this.set;
    }
}
