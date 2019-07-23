import { ILeaseEx } from "../Lease";
import { IDHCPMessage } from "../model";
import { ILeaseStaticStore } from "./ILeaseStaticStore";
/**
 * basic static Lease conmfiguration module
 */
export declare class LeaseStaticStoreMemory implements ILeaseStaticStore {
    private data;
    private set;
    constructor(leases: {
        [key: string]: string;
    });
    addStatic(mac: string, ip: string): void;
    delStatic(mac: string): void;
    getLease(mac: string, request: IDHCPMessage): ILeaseEx | null;
    getIP(mac: string, request: IDHCPMessage): string;
    getReservedIP(): Set<string>;
}
