/**
 * @license DHCP.js v0.2.18 28/06/2017
 * http://www.xarg.org/2017/06/a-pure-javascript-dhcp-implementation/
 *
 * Copyright (c) 2017, Robert Eisele (robert@xarg.org)
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
import { Client } from "./Client";
import { IClientConfig } from "./ClientConfig";
import { Server } from "./Server";
import { IServerConfig } from "./ServerConfig";
export { OptionId } from "./model";
export { IClientConfig } from "./ClientConfig";
export { IServerConfig } from "./ServerConfig";
export { IDHCPMessage } from "./model";
export { Client } from "./Client";
export { Server } from "./Server";
export { ILeaseLiveStore, LeaseLiveStoreFile, LeaseLiveStoreMemory, ILeaseLive } from "./leaseLive";
export { ILeaseStaticStore, LeaseStaticStoreFile, LeaseStaticStoreMemory, ILeaseEx } from "./leaseStatic";
export { ILeaseOfferStore, LeaseOfferStoreMemory } from "./leaseOffer";
export { IOptionsTxtOrId, IOptionsTxt, IOptionsId, IDHCPOptionsFncId } from "./model";
export declare const createBroadcastHandler: () => Server;
export declare const createClient: (opt: IClientConfig) => Client;
export declare const createServer: (opt: IServerConfig) => Server;
declare const _default: {
    createBroadcastHandler: () => Server;
    createClient: (opt: IClientConfig) => Client;
    createServer: (opt: IServerConfig) => Server;
};
export default _default;
