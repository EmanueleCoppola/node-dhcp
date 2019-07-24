/// <reference types="node" />
import { EventEmitter } from "events";
import { IDHCPMessage, IOptionsId, OptionId } from "./model";
import { ServerConfig } from "./ServerConfig";
export declare class Server extends EventEmitter {
    private socket;
    private config;
    private leaseStatic;
    private leaseLive;
    private leaseOffer;
    private optsMeta;
    constructor(config: ServerConfig, listenOnly?: boolean);
    getServer(request: IDHCPMessage): string;
    getConfigBroadcast(request: IDHCPMessage): string;
    validOption(optionId: number | string): boolean;
    getOptions(request: IDHCPMessage, pre: IOptionsId, customOpts: IOptionsId, requireds: number[], requested?: number[]): IOptionsId;
    selectAddress(clientMAC: string, request: IDHCPMessage): Promise<string>;
    handle_Discover(request: IDHCPMessage): Promise<number>;
    handle_Request(request: IDHCPMessage): Promise<number>;
    handle_Release(request: IDHCPMessage): Promise<number>;
    /**
     * Formulate the response object
     */
    sendNak(request: IDHCPMessage): Promise<number>;
    listen(port?: number, host?: string): Promise<void>;
    close(): Promise<any>;
    /**
     * @param key the request Key or optionId
     * @param requested the remote Options
     */
    getC(key: OptionId, requested?: IDHCPMessage): any;
    getRange(requested: IDHCPMessage): string[];
    getForceOptions(requested: IDHCPMessage): string[];
    getRandomIP(requested: IDHCPMessage): boolean;
    private newLease;
    private getExpiration;
    private _send;
}
