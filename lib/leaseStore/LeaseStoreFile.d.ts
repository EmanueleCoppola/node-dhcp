import { ILease } from "../Lease";
import { ILeaseStore } from "./ILeaseStote";
export declare class LeaseStoreFile implements ILeaseStore {
    cache: {
        [key: string]: ILease;
    };
    address: Set<string>;
    oldest: ILease | null;
    cnt: number;
    save: () => void;
    private file;
    constructor(file: string);
    getLeaseFromMac(mac: string): Promise<ILease | null>;
    hasAddress(address: string): Promise<boolean>;
    size(): Promise<number>;
    add(lease: ILease): Promise<boolean>;
    getLeases(): Promise<ILease[]>;
    getAddresses(): Promise<string[]>;
    getMacs(): Promise<string[]>;
    getLeases2(): ILease[];
    getAddresses2(): string[];
    getMacs2(): string[];
    getFreeIP(IP1: string, IP2: string, reserverd: Array<Set<string>>, randomIP?: boolean): Promise<string>;
    private _save;
    private reIndex;
    private _add;
}
