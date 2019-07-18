import { Lease } from '../Lease';
import { ILeaseStore } from './ILeaseStote';
export declare class LeaseStoreMemory implements ILeaseStore {
    cache: {
        [key: string]: Lease;
    };
    address: Set<string>;
    oldest: Lease | null;
    cnt: number;
    getLeaseFromMac(mac: string): Lease | null;
    hasAddress(address: string): boolean;
    size(): number;
    add(lease: Lease): boolean;
    getOldest(): Lease | null;
    getLeases(): Lease[];
    getAddresses(): string[];
    getMacs(): string[];
}
