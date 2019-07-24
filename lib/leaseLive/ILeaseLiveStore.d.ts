/**
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 */
/**
 * a lease from a living Host
 */
export interface ILeaseLive {
    /**
     * Expiration in sec from 1970
     */
    expiration: number;
    /**
     * Mac
     */
    mac: string;
    /**
     * IP
     */
    address: string;
    /**
     * Name use for readability
     */
    name: string;
}
export interface ILeaseLiveStore {
    getFreeIP?: (firstIPstr: string, lastIPStr: string, reserverd: Array<Set<string>>, randomIP?: boolean) => Promise<string>;
    getLeaseFromMac(mac: string): Promise<ILeaseLive | null>;
    /**
     * call to extant a lease valididity
     */
    updateLease(lease: ILeaseLive): Promise<void>;
    hasAddress(address: string): Promise<boolean>;
    add(lease: ILeaseLive): Promise<boolean>;
    getLeases(): Promise<ILeaseLive[]>;
    getAddresses(): Promise<string[]>;
    getMacs(): Promise<string[]>;
    release(mac: string): Promise<ILeaseLive | null>;
}
