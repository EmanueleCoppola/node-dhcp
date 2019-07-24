/**
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 */
import { IDHCPMessage } from "../model";
import { ILeaseEx } from "./ILeaseStaticStore";
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
    getLease(mac: string, request?: IDHCPMessage): ILeaseEx | null;
    getReservedIP(): Set<string>;
}
