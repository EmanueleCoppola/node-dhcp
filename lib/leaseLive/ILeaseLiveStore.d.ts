import { ILeaseLive } from "../Lease";
export interface ILeaseLiveStore {
    getFreeIP?: (firstIPstr: string, lastIPStr: string, reserverd: Array<Set<string>>, randomIP?: boolean) => Promise<string>;
    getLeaseFromMac(mac: string): Promise<ILeaseLive | null>;
    hasAddress(address: string): Promise<boolean>;
    add(lease: ILeaseLive): Promise<boolean>;
    getLeases(): Promise<ILeaseLive[]>;
    getAddresses(): Promise<string[]>;
    getMacs(): Promise<string[]>;
    release(mac: string): Promise<ILeaseLive | null>;
}
