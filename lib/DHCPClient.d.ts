/// <reference types="node" />
import { EventEmitter } from 'events';
import { ClientConfig } from './ClientConfig';
import { IDHCPMessage } from './model';
export declare class DHCPClient extends EventEmitter {
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
