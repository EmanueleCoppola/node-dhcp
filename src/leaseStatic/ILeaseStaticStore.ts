/**
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 */
import { Helper } from "../Helper";
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

export abstract class LeaseStaticStoreHelper implements ILeaseStaticStore {
    public abstract hasAddress(address: string): boolean;
    public abstract getReservedIP(): Set<string>;
    public abstract getLeaseFromMac(mac: string, request?: IDHCPMessage): ILeaseEx | null;

    public getLeaseTxtFromMac(mac: string, request?: IDHCPMessage): ILeaseExTxt | null {
        return Helper.toLeaseExTxt(this.getLeaseFromMac(mac, request));
    }
}
