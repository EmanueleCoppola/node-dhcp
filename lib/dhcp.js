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
const Client_1 = require("./Client");
const ClientConfig_1 = require("./ClientConfig");
const OptionsModel = __importStar(require("./options"));
const Server_1 = require("./Server");
const ServerConfig_1 = require("./ServerConfig");
var DHCPOptions_1 = require("./DHCPOptions");
exports.DHCPOptions = DHCPOptions_1.DHCPOptions;
var model_1 = require("./model");
exports.OptionId = model_1.OptionId;
var Client_2 = require("./Client");
exports.Client = Client_2.Client;
var Server_2 = require("./Server");
exports.Server = Server_2.Server;
var Lease_1 = require("./Lease");
exports.Lease = Lease_1.Lease;
var leaseStore_1 = require("./leaseStore/");
exports.LeaseStoreFile = leaseStore_1.LeaseStoreFile;
exports.LeaseStoreMemory = leaseStore_1.LeaseStoreMemory;
var staticLeaseStore_1 = require("./staticLeaseStore/");
exports.StaticLeaseStoreMemory = staticLeaseStore_1.StaticLeaseStoreMemory;
exports.createBroadcastHandler = () => new Server_1.Server(null, true);
exports.createClient = (opt) => new Client_1.Client(new ClientConfig_1.ClientConfig(opt));
exports.createServer = (opt) => new Server_1.Server(new ServerConfig_1.ServerConfig(opt));
exports.default = {
    addOption: OptionsModel.addOption,
    createBroadcastHandler: exports.createBroadcastHandler,
    createClient: exports.createClient,
    createServer: exports.createServer,
};
//# sourceMappingURL=dhcp.js.map