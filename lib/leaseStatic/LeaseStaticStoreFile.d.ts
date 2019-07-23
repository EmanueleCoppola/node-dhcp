import { ILeaseEx } from "../Lease";
import { IDHCPMessage, IOptionsTxt } from "../model";
import { ILeaseStaticStore } from "./ILeaseStaticStore";
export interface ILeaseExStr {
    mac: string;
    address: string;
    tag?: string[];
    options?: IOptionsTxt;
}
/**
 * basic static Lease conmfiguration module
 */
export declare class LeaseStaticStoreFile implements ILeaseStaticStore {
    save: () => void;
    private file;
    private tags;
    private data;
    private set;
    constructor(file: string);
    addStatic(leases: ILeaseExStr): void;
    delStatic(mac: string): void;
    getLease(mac: string, request: IDHCPMessage): ILeaseEx | null;
    getReservedIP(): Set<string>;
    private _save;
}
