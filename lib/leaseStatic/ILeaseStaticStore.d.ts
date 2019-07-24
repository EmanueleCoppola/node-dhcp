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
    getLease(mac: string, request?: IDHCPMessage): ILeaseEx | null;
    hasAddress(address: string): boolean;
    getReservedIP(): Set<string>;
}
export declare function toLeaseExTxt(lease?: ILeaseEx | null): ILeaseExTxt | null;
