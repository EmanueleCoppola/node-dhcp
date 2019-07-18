/**
 * @license DHCP.js v0.2.18 28/06/2017
 * http://www.xarg.org/2017/06/a-pure-javascript-dhcp-implementation/
 *
 * Copyright (c) 2017, Robert Eisele (robert@xarg.org)
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

import { Client } from './Client';
import { ClientConfig, IClientConfig } from './ClientConfig';
import * as OptionsModel from './options';
import { Server } from './Server';
import { IServerConfig, ServerConfig } from './ServerConfig';

export { DHCPOptions } from './DHCPOptions';
export { OptionId } from './model';
export { IClientConfig } from './ClientConfig';
export { IServerConfig } from './ServerConfig';
export { IDHCPMessage } from './model';
export { Client } from './Client';
export { Server } from './Server';
export { Lease } from './Lease';
export { ILeaseStore } from './store/ILeaseStote';
export { LeaseStoreFile } from './store/LeaseStoreFile';
export { LeaseStoreMemory } from './store/LeaseStoreMemory';

export const createBroadcastHandler = (): Server => new Server(null, true);
export const createClient = (opt: IClientConfig): Client => new Client(new ClientConfig(opt));
export const createServer = (opt: IServerConfig): Server => new Server(new ServerConfig(opt));

export default {
  addOption: OptionsModel.addOption,
  createBroadcastHandler,
  createClient,
  createServer,
};
