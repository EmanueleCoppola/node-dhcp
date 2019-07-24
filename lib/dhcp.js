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
const Server_1 = require("./Server");
const ServerConfig_1 = require("./ServerConfig");
var Client_2 = require("./Client");
exports.Client = Client_2.Client;
var Server_2 = require("./Server");
exports.Server = Server_2.Server;
var leaseLive_1 = require("./leaseLive");
exports.LeaseLiveStoreFile = leaseLive_1.LeaseLiveStoreFile;
exports.LeaseLiveStoreMemory = leaseLive_1.LeaseLiveStoreMemory;
var leaseStatic_1 = require("./leaseStatic");
exports.LeaseStaticStoreFile = leaseStatic_1.LeaseStaticStoreFile;
exports.LeaseStaticStoreMemory = leaseStatic_1.LeaseStaticStoreMemory;
exports.toLeaseExTxt = leaseStatic_1.toLeaseExTxt;
var leaseOffer_1 = require("./leaseOffer");
exports.LeaseOfferStoreMemory = leaseOffer_1.LeaseOfferStoreMemory;
var model_1 = require("./model");
exports.OptionId = model_1.OptionId;
var options_1 = require("./options");
exports.getDHCPName = options_1.getDHCPName;
exports.getDHCPId = options_1.getDHCPId;
exports.createBroadcastHandler = () => new Server_1.Server(ServerConfig_1.newServerConfig({ range: ["0.0.0.0", "0.0.0.1"] }), true);
exports.createClient = (opt) => new Client_1.Client(new ClientConfig_1.ClientConfig(opt));
exports.createServer = (opt) => new Server_1.Server(ServerConfig_1.newServerConfig(opt));
exports.default = {
    createBroadcastHandler: exports.createBroadcastHandler,
    createClient: exports.createClient,
    createServer: exports.createServer,
};
//# sourceMappingURL=dhcp.js.map