/**
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 */
import { IDHCPMessage, IOptionsId, IOptionsTxt } from "../model";
/**
 * Lease format for static lease
 * mac and address are mandatory
 * every options can be overwride
 */
export interface ILeaseEx {
    mac: string;
    address: string;
    options?: IOptionsId;
}
export interface ILeaseExTxt {
    mac: string;
    address: string;
    options: IOptionsTxt;
}
export interface ILeaseStaticStore {
    /**
     * get the reserved lease for a mac
     */
    getLeaseFromMac(mac: string, request?: IDHCPMessage): ILeaseEx | null;
    /**
     * same as getLeaseFromMac but returnoOptions as txt
     */
    getLeaseTxtFromMac(mac: string, request?: IDHCPMessage): ILeaseExTxt | null;
    /**
     * check if the adresse is used by a static lease
     * if a mac is neaded fork the default storage
     */
    hasAddress(address: string): boolean;
    /**
     * get a set of used IP for quick colision check
     */
    getReservedIP(): Set<string>;
}
export declare abstract class LeaseStaticStoreHelper implements ILeaseStaticStore {
    abstract hasAddress(address: string): boolean;
    abstract getReservedIP(): Set<string>;
    abstract getLeaseFromMac(mac: string, request?: IDHCPMessage): ILeaseEx | null;
    getLeaseTxtFromMac(mac: string, request?: IDHCPMessage): ILeaseExTxt | null;
    toLeaseExTxt(lease?: ILeaseEx | null): ILeaseExTxt | null;
}
