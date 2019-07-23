import { IDHCPMessage } from '../model';
import { IStaticLeaseStore } from './IStaticLeaseStore';

export class StaticLeaseStoreMemory implements IStaticLeaseStore {
    private data: { [key: string]: string } = {};
    private set: Set<string>;

    constructor(leases: { [key: string]: string }) {
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

    public getIP(mac: string, request: IDHCPMessage): string {
        return this.data[mac];
    }

    public getReservedIP(): Set<string> {
        return this.set;
    }
}
