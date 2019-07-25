import { IDHCPMessage, IOptionsTxtOrId } from "../model";
import { ILeaseEx, LeaseStaticStoreHelper } from "./ILeaseStaticStore";
import { ILeaseStaticStore } from "./ILeaseStaticStore";
export interface ILeaseExStr {
    mac: string;
    address: string;
    tag?: string[];
    options?: IOptionsTxtOrId;
}
/**
 * basic static Lease conmfiguration module
 */
export declare class LeaseStaticStoreFile extends LeaseStaticStoreHelper implements ILeaseStaticStore {
    save: () => void;
    reload: () => void;
    private file;
    private tags;
    private data;
    private set;
    private watch;
    private prettyPrint;
    private watcher;
    constructor(file: string, option?: {
        watch?: boolean;
        debounceMs?: number;
        prettyPrint?: boolean;
    });
    addStatic(leases: ILeaseExStr): void;
    delStatic(mac: string): void;
    getLeaseFromMac(mac: string, request?: IDHCPMessage): ILeaseEx | null;
    hasAddress(address: string): boolean;
    getReservedIP(): Set<string>;
    private watchConf;
    private unwatchConf;
    private saveConf;
    private fillConf;
    private rebuildData;
    private reloadConf;
}
