import { ILeaseLive } from "./ILeaseLiveStore";
import { ILeaseLiveStore } from "./ILeaseLiveStore";
export declare class LeaseLiveStoreFile implements ILeaseLiveStore {
    cache: {
        [key: string]: ILeaseLive;
    };
    address: Set<string>;
    oldest: ILeaseLive | null;
    save: () => void;
    private file;
    constructor(file: string);
    getLeaseFromMac(mac: string): Promise<ILeaseLive | null>;
    hasAddress(address: string): Promise<boolean>;
    add(lease: ILeaseLive): Promise<boolean>;
    release(mac: string): Promise<ILeaseLive | null>;
    getLeases(): Promise<ILeaseLive[]>;
    getAddresses(): Promise<string[]>;
    getMacs(): Promise<string[]>;
    getLeases2(): ILeaseLive[];
    getAddresses2(): string[];
    getMacs2(): string[];
    getFreeIP(IP1: string, IP2: string, reserverd: Array<Set<string>>, randomIP?: boolean): Promise<string>;
    private _save;
    private reIndex;
    private _add;
    private _delete;
}
