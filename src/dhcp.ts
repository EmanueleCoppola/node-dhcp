/**
 * @license DHCP.js v0.2.18 28/06/2017
 * http://www.xarg.org/2017/06/a-pure-javascript-dhcp-implementation/
 *
 * Copyright (c) 2017, Robert Eisele (robert@xarg.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/

import * as OptionsModel from './options';
import { ServerConfig, ClientConfig } from './model';
import { Server } from './Server';
import { Client } from './Client';


exports.DHCP = exports.default = module.exports = {
  createServer: function (opt: ServerConfig, listenOnly?: boolean): Server {
    return new Server(opt, listenOnly);
  },
  createClient: function (opt: ClientConfig): Client {
    return new Client(opt);
  },
  createBroadcastHandler: function (): Server {
    return new Server(null, true);
  },
  /**
   * register extra option
   */
  addOption: OptionsModel.addOption,
  //DHCPDISCOVER: DHCP53Code.DHCPDISCOVER,
  //DHCPOFFER: DHCP53Code.DHCPOFFER,
  //DHCPREQUEST: DHCP53Code.DHCPREQUEST,
  //DHCPDECLINE: DHCP53Code.DHCPDECLINE,
  //DHCPACK: DHCP53Code.DHCPACK,
  //DHCPNAK: DHCP53Code.DHCPNAK,
  //DHCPRELEASE: DHCP53Code.DHCPRELEASE,
  //DHCPINFORM: DHCP53Code.DHCPINFORM
};
