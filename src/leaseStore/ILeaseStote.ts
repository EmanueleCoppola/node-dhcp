import { Lease } from '../Lease';

export interface ILeaseStore {
    getFreeIP?: (firstIPstr: string, lastIPStr: string, reserverd: Array<Set<string>>, randomIP?: boolean) => Promise<string>;
    getLeaseFromMac(mac: string): Promise<Lease | null>;
    hasAddress(address: string): Promise<boolean>;
    add(lease: Lease): Promise<boolean>;
    size(): Promise<number>;
    getLeases(): Promise<Lease[]>;
    getAddresses(): Promise<string[]>;
    getMacs(): Promise<string[]>;
}
