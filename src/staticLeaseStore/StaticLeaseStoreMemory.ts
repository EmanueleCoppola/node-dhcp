import { ILeaseLT } from '../Lease';
import { IDHCPMessage } from '../model';
import { IStaticLeaseStore } from './IStaticLeaseStore';

/**
 * basic static Lease conmfiguration module
 */
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

    public getLease(mac: string, request: IDHCPMessage): ILeaseLT | null {
        const address = this.data[mac];
        if (address)
            return { mac, address };
        return null;
    }


    public getIP(mac: string, request: IDHCPMessage): string {
        return;
    }

    public getReservedIP(): Set<string> {
        return this.set;
    }
}
