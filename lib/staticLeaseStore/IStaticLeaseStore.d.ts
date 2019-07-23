import { ILeaseLT } from "../Lease";
import { IDHCPMessage } from "../model";
export interface IStaticLeaseStore {
    getLease(mac: string, request: IDHCPMessage): ILeaseLT | null;
    getReservedIP(): Set<string>;
}
