/**
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 */
import { IDHCPMessage, IOptionsId } from "../model";

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

export interface ILeaseStaticStore {
    getLease(mac: string, request: IDHCPMessage): ILeaseEx | null;
    getReservedIP(): Set<string>;
}
