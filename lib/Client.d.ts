/// <reference types="node" />
import { EventEmitter } from "events";
import { ClientConfig } from "./ClientConfig";
import { IDHCPMessage, IOptionsId } from "./model";
export declare type LeaseState = "RENEWING" | "RELEASED" | "REBINDING" | "SELECTING" | "REQUESTING" | "BOUND" | "REBOOTING" | "INIT" | "OFFERED";
export interface ILease {
    mac: string;
    bindTime: Date;
    leasePeriod: number;
    renewPeriod: number;
    rebindPeriod: number;
    leaseTime: number;
    state?: LeaseState;
    server: string;
    address: string;
    options: IOptionsId;
    tries: number;
    xid: number;
    router: string;
}
export declare class Client extends EventEmitter {
    private socket;
    private config;
    private lastLease;
    constructor(config: ClientConfig);
    sendDiscover(): Promise<number>;
    handleOffer(req: IDHCPMessage): void;
    sendRequest(req: IDHCPMessage): Promise<number>;
    handleAck(req: IDHCPMessage): void;
    sendRelease(req: IDHCPMessage): Promise<number>;
    sendRenew(): Promise<number>;
    sendRebind(): Promise<number>;
    listen(port: number, host: string): Promise<void>;
    close(): Promise<any>;
    private send;
}
