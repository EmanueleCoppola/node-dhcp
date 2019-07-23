import { IDHCPMessage } from '../model';
import { IStaticLeaseStore } from './IStaticLeaseStore';
export declare class StaticLeaseStoreMemory implements IStaticLeaseStore {
    private data;
    private set;
    constructor(leases: {
        [key: string]: string;
    });
    addStatic(mac: string, ip: string): void;
    delStatic(mac: string): void;
    getIP(mac: string, request: IDHCPMessage): string;
    getReservedIP(): Set<string>;
}
