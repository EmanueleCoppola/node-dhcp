/**
 * @license DHCP.js v0.2.18 28/06/2017
 * http://www.xarg.org/2017/06/a-pure-javascript-dhcp-implementation/
 *
 * Copyright (c) 2017, Robert Eisele (robert@xarg.org)
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

import { Client } from './Client';
import { ClientConfig } from './ClientConfig';
import * as OptionsModel from './options';
import { Server } from './Server';
import { ServerConfig } from './ServerConfig';

export {DHCPOptions} from './DHCPOptions';
export {OptionId} from './model';

export const createBroadcastHandler = (): Server => new Server(null, true);
export const createClient = (opt: any): Client => new Client(new ClientConfig(opt));
export const createServer = (opt: any, listenOnly?: boolean): Server => new Server(new ServerConfig(opt), listenOnly);

export default {
  addOption: OptionsModel.addOption,
  createBroadcastHandler,
  createClient,
  createServer,
};
