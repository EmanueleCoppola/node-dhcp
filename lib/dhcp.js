"use strict";
/**
 * @license DHCP.js v0.2.18 28/06/2017
 * http://www.xarg.org/2017/06/a-pure-javascript-dhcp-implementation/
 *
 * Copyright (c) 2017, Robert Eisele (robert@xarg.org)
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ClientConfig_1 = require("./ClientConfig");
const DHCPClient_1 = require("./DHCPClient");
const DHCPServer_1 = require("./DHCPServer");
const OptionsModel = __importStar(require("./options"));
const ServerConfig_1 = require("./ServerConfig");
var DHCPOptions_1 = require("./DHCPOptions");
exports.DHCPOptions = DHCPOptions_1.DHCPOptions;
var model_1 = require("./model");
exports.OptionId = model_1.OptionId;
var DHCPClient_2 = require("./DHCPClient");
exports.DHCPClient = DHCPClient_2.DHCPClient;
var DHCPServer_2 = require("./DHCPServer");
exports.DHCPServer = DHCPServer_2.DHCPServer;
var Lease_1 = require("./Lease");
exports.Lease = Lease_1.Lease;
exports.createBroadcastHandler = () => new DHCPServer_1.DHCPServer(null, true);
exports.createClient = (opt) => new DHCPClient_1.DHCPClient(new ClientConfig_1.ClientConfig(opt));
exports.createServer = (opt) => new DHCPServer_1.DHCPServer(new ServerConfig_1.ServerConfig(opt));
exports.default = {
    addOption: OptionsModel.addOption,
    createBroadcastHandler: exports.createBroadcastHandler,
    createClient: exports.createClient,
    createServer: exports.createServer,
};
//# sourceMappingURL=dhcp.js.map