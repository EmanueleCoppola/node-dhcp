import { DHCPOptions } from './DHCPOptions';
export declare type LeaseState = 'RENEWING' | 'RELEASED' | 'REBINDING' | 'SELECTING' | 'REQUESTING' | 'BOUND' | 'REBOOTING' | 'INIT' | 'OFFERED';
export declare type IP = string;
export declare class Lease {
    mac: string;
    bindTime: Date;
    leasePeriod: number;
    renewPeriod: number;
    rebindPeriod: number;
    leaseTime: number;
    state?: LeaseState;
    server: string;
    address: IP;
    options: DHCPOptions;
    tries: number;
    xid: number;
    router: string;
    constructor(mac: string);
}
