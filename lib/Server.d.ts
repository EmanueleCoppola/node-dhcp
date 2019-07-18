/// <reference types="node" />
import { EventEmitter } from 'events';
import { DHCPOptions } from './DHCPOptions';
import { Lease } from './Lease';
import { IDHCPMessage } from './model';
import { ServerConfig } from './ServerConfig';
export declare class Server extends EventEmitter {
    private socket;
    private config;
    private leaseState;
    constructor(config: ServerConfig, listenOnly?: boolean);
    geLease(): Lease[];
    getConfigServer(request: IDHCPMessage): string;
    getConfigBroadcast(request: IDHCPMessage): string;
    getOptions(request: IDHCPMessage, pre: DHCPOptions, requireds: number[], requested?: any): DHCPOptions;
    selectAddress(clientMAC: string, request: IDHCPMessage): string;
    handleDiscover(request: IDHCPMessage): Promise<number>;
    sendOffer(request: IDHCPMessage): Promise<number>;
    handleRequest(request: IDHCPMessage): Promise<number>;
    sendAck(request: IDHCPMessage): Promise<number>;
    sendNak(request: IDHCPMessage): Promise<number>;
    listen(port: number, host: string): Promise<void>;
    close(): Promise<any>;
    private handleRelease;
    private handleRenew;
    private _send;
}
