import { Lease } from '../Lease';

export interface ILeaseStore {
    getLeaseFromMac(mac: string): Lease | null;
    hasAddress(address: string): boolean;
    getOldest(): Lease | null;
    add(lease: Lease): boolean;
    size(): number;
    getLeases(): Lease[];
    getAddresses(): string[];
    getMacs(): string[];
}
