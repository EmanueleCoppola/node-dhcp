/**
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 */
import { ILeaseLive } from "../leaseLive/ILeaseLiveStore";
export interface ILeaseOfferStore {
    add(lease: ILeaseLive): void;
    pop(mac: string): ILeaseLive | null;
    getReservedIP(): Set<string>;
}
