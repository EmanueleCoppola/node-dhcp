import { DHCPOptions } from "./DHCPOptions";
import { IOptionsTxt } from "./model";
export declare type LeaseState = "RENEWING" | "RELEASED" | "REBINDING" | "SELECTING" | "REQUESTING" | "BOUND" | "REBOOTING" | "INIT" | "OFFERED";
/**
 * Lease format for static lease
 * mac and address are mandatory
 * every options can be overwride
 */
export interface ILeaseEx {
    mac: string;
    address: string;
    tag?: string[];
    options?: IOptionsTxt;
}
/**
 * a lise from a living Host
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
export interface ILease {
    mac: string;
    bindTime: Date;
    leasePeriod: number;
    renewPeriod: number;
    rebindPeriod: number;
    leaseTime: number;
    state?: LeaseState;
    server: string;
    address: string;
    options: DHCPOptions;
    tries: number;
    xid: number;
    router: string;
}
