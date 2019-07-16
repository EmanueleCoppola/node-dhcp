"use strict";
/**
 * @license DHCP.js v0.2.18 28/06/2017
 * http://www.xarg.org/2017/06/a-pure-javascript-dhcp-implementation/
 *
 * Copyright (c) 2017, Robert Eisele (robert@xarg.org)
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Client_1 = require("./Client");
const ClientConfig_1 = require("./ClientConfig");
const OptionsModel = require("./options");
const Server_1 = require("./Server");
const ServerConfig_1 = require("./ServerConfig");
exports.DHCP = exports.default = module.exports = {
    addOption: OptionsModel.addOption,
    createBroadcastHandler: () => new Server_1.Server(null, true),
    createClient: (opt) => new Client_1.Client(new ClientConfig_1.ClientConfig(opt)),
    createServer: (opt, listenOnly) => new Server_1.Server(new ServerConfig_1.ServerConfig(opt), listenOnly),
};
//# sourceMappingURL=dhcp.js.map