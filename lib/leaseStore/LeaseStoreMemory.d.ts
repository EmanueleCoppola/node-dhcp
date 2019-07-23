import { Lease } from '../Lease';
import { ILeaseStore } from './ILeaseStote';
export declare class LeaseStoreMemory implements ILeaseStore {
    cache: {
        [key: string]: Lease;
    };
    address: Set<string>;
    oldest: Lease | null;
    cnt: number;
    getLeaseFromMac(mac: string): Promise<Lease | null>;
    hasAddress(address: string): Promise<boolean>;
    size(): Promise<number>;
    add(lease: Lease): Promise<boolean>;
    getLeases(): Promise<Lease[]>;
    getAddresses(): Promise<string[]>;
    getMacs(): Promise<string[]>;
    getLeases2(): Lease[];
    getAddresses2(): string[];
    getMacs2(): string[];
    getFreeIP(IP1: string, IP2: string, reserverd?: Array<Set<string>>, randomIP?: boolean): Promise<string>;
}
