import { ILeaseLive } from "../Lease";

export interface ILeaseOfferStore {
    add(lease: ILeaseLive): void;
    pop(mac: string): ILeaseLive;
    getReservedIP(): Set<string>;
}
