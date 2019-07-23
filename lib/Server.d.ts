/// <reference types="node" />
import { EventEmitter } from "events";
import { DHCPOptions } from "./DHCPOptions";
import { IDHCPMessage } from "./model";
import { ServerConfig } from "./ServerConfig";
export declare class Server extends EventEmitter {
    private socket;
    private config;
    private leaseStatic;
    private leaseLive;
    private leaseOffer;
    constructor(config: ServerConfig, listenOnly?: boolean);
    getServer(request: IDHCPMessage): string;
    getConfigBroadcast(request: IDHCPMessage): string;
    validOption(optionId: number | string): boolean;
    getOptions(request: IDHCPMessage, pre: DHCPOptions, requireds: number[], requested?: number[]): DHCPOptions;
    selectAddress(clientMAC: string, request: IDHCPMessage): Promise<string>;
    handle_Discover(request: IDHCPMessage): Promise<number>;
    handle_Release(request: IDHCPMessage): Promise<number>;
    handle_Request(request: IDHCPMessage): Promise<number>;
    /**
     * Formulate the response object
     */
    sendNak(request: IDHCPMessage): Promise<number>;
    listen(port?: number, host?: string): Promise<void>;
    close(): Promise<any>;
    private newLease;
    private getExpiration;
    private handleRelease;
    private handleRenew;
    private _send;
}
