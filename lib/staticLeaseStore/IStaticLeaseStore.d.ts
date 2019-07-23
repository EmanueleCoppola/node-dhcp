import { IDHCPMessage } from '../model';
export interface IStaticLeaseStore {
    getIP(mac: string, request: IDHCPMessage): string | null;
    getReservedIP(): Set<string>;
}
