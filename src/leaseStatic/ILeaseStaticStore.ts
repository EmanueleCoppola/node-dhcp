import { ILeaseLT } from "../Lease";
import { IDHCPMessage } from "../model";

export interface ILeaseStaticStore {
    getLease(mac: string, request: IDHCPMessage): ILeaseLT | null;
    getReservedIP(): Set<string>;
}
