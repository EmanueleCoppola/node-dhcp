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

exports.DHCP = exports.default = module.exports = {
  addOption: OptionsModel.addOption,
  createBroadcastHandler: (): Server => new Server(null, true),
  createClient: (opt: ClientConfig): Client => new Client(opt),
  createServer: (opt: ServerConfig, listenOnly?: boolean): Server => new Server(opt, listenOnly),
  /**
   * register extra option
   */
  // DHCPDISCOVER: DHCP53Code.DHCPDISCOVER,
  // DHCPOFFER: DHCP53Code.DHCPOFFER,
  // DHCPREQUEST: DHCP53Code.DHCPREQUEST,
  // DHCPDECLINE: DHCP53Code.DHCPDECLINE,
  // DHCPACK: DHCP53Code.DHCPACK,
  // DHCPNAK: DHCP53Code.DHCPNAK,
  // DHCPRELEASE: DHCP53Code.DHCPRELEASE,
  // DHCPINFORM: DHCP53Code.DHCPINFORM
};
