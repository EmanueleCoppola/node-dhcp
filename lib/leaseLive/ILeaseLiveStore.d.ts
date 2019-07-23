import { ILease } from "../Lease";
export interface ILeaseLiveStore {
    getFreeIP?: (firstIPstr: string, lastIPStr: string, reserverd: Array<Set<string>>, randomIP?: boolean) => Promise<string>;
    getLeaseFromMac(mac: string): Promise<ILease | null>;
    hasAddress(address: string): Promise<boolean>;
    add(lease: ILease): Promise<boolean>;
    size(): Promise<number>;
    getLeases(): Promise<ILease[]>;
    getAddresses(): Promise<string[]>;
    getMacs(): Promise<string[]>;
}
