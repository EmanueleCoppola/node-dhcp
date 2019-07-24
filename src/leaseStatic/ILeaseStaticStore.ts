/**
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 */
import { IDHCPMessage, IOptionsId, IOptionsTxt, OptionId } from "../model";
import { getDHCPName } from "../options";

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
    getReservedIP(): Set<string>;
}

export function toLeaseExTxt(lease?: ILeaseEx | null): ILeaseExTxt | null {
    if (!lease)
        return null;
    const out: ILeaseExTxt = {
        mac: lease.mac,
        address: lease.address,
        options: {},
    };
    if (lease.options) {
        for (const k of Object.keys(lease.options)) {
            const name = getDHCPName(k);
            if (name)
                out.options[name] = lease.options[k];
        }
    }
    return out;
}
