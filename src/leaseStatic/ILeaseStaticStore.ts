import { ILeaseEx } from "../Lease";
import { IDHCPMessage } from "../model";

export interface ILeaseStaticStore {
    getLease(mac: string, request: IDHCPMessage): ILeaseEx | null;
    getReservedIP(): Set<string>;
}
