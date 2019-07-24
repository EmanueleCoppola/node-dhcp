import { ILeaseLive } from "./ILeaseLiveStore";
import { ILeaseLiveStore } from "./ILeaseLiveStore";
export declare class LeaseLiveStoreMemory implements ILeaseLiveStore {
    cache: {
        [key: string]: ILeaseLive;
    };
    address: Set<string>;
    getLeaseFromMac(mac: string): Promise<ILeaseLive | null>;
    hasAddress(address: string): Promise<boolean>;
    release(mac: string): Promise<ILeaseLive | null>;
    add(lease: ILeaseLive): Promise<boolean>;
    getLeases(): Promise<ILeaseLive[]>;
    getAddresses(): Promise<string[]>;
    getMacs(): Promise<string[]>;
    getLeases2(): ILeaseLive[];
    getAddresses2(): string[];
    getMacs2(): string[];
    getFreeIP(IP1: string, IP2: string, reserverd?: Array<Set<string>>, randomIP?: boolean): Promise<string>;
}
