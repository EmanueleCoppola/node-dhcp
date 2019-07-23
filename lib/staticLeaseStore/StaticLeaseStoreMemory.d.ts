import { ILeaseLT } from "../Lease";
import { IDHCPMessage } from "../model";
import { IStaticLeaseStore } from "./IStaticLeaseStore";
/**
 * basic static Lease conmfiguration module
 */
export declare class StaticLeaseStoreMemory implements IStaticLeaseStore {
    private data;
    private set;
    constructor(leases: {
        [key: string]: string;
    });
    addStatic(mac: string, ip: string): void;
    delStatic(mac: string): void;
    getLease(mac: string, request: IDHCPMessage): ILeaseLT | null;
    getIP(mac: string, request: IDHCPMessage): string;
    getReservedIP(): Set<string>;
}
