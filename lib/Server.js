"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable no-console */
const dgram_1 = require("dgram");
const events_1 = require("events");
const leaseLive_1 = require("./leaseLive");
const leaseOffer_1 = require("./leaseOffer");
const leaseStatic_1 = require("./leaseStatic");
const model_1 = require("./model");
const options_1 = require("./options");
const prime_1 = require("./prime");
const protocol_1 = require("./protocol");
const tools_1 = require("./tools");
const INADDR_ANY = "0.0.0.0";
const SERVER_PORT = 67;
const CLIENT_PORT = 68;
/**
 * helper to build DHCPresponse
 */
function toResponse(request, options) {
    return {
        op: model_1.BootCode.BOOTREPLY,
        htype: model_1.HardwareType.Ethernet,
        hlen: 6,
        hops: 0,
        xid: request.xid,
        secs: 0,
        flags: request.flags,
        // ciaddr
        // yiaddr
        // siaddr
        giaddr: request.giaddr,
        chaddr: request.chaddr,
        sname: "",
        file: "",
        options,
    };
}
/**
 * Mains DHCP server class
 */
class Server extends events_1.EventEmitter {
    constructor(config, listenOnly) {
        super();
        const self = this;
        const socket = dgram_1.createSocket({ type: "udp4", reuseAddr: true });
        this.config = config;
        this.leaseLive = config.leaseLive || new leaseLive_1.LeaseLiveStoreMemory();
        this.leaseOffer = config.leaseOffer || new leaseOffer_1.LeaseOfferStoreMemory();
        this.leaseStatic = config.leaseStatic || new leaseStatic_1.LeaseStaticStoreMemory({});
        this.socket = socket;
        this.optsMeta = options_1.getOptsMeta(this);
        socket.on("message", async (buf) => {
            let request;
            try {
                request = protocol_1.parse(buf);
            }
            catch (e) {
                return self.emit("error", e);
            }
            if (request.op !== model_1.BootCode.BOOTREQUEST)
                return self.emit("error", new Error("Malformed packet"), request);
            if (!request.options[model_1.OptionId.dhcpMessageType])
                return self.emit("error", new Error("Got message, without valid message type"), request);
            self.emit("message", request);
            if (listenOnly)
                return;
            try {
                // Handle request
                const mode = request.options[model_1.OptionId.dhcpMessageType];
                switch (mode) {
                    case model_1.DHCP53Code.DHCPDISCOVER: // 1
                        return await self.handle_Discover(request);
                    case model_1.DHCP53Code.DHCPOFFER: // 2,
                        return; // nothink to do with incomming offer
                    case model_1.DHCP53Code.DHCPREQUEST: // 3
                        return await self.handle_Request(request);
                    case model_1.DHCP53Code.DHCPDECLINE: // 4
                        return console.error("Not implemented DHCPDECLINE");
                    case model_1.DHCP53Code.DHCPACK: // 5,
                        return; // nothink to do with incomming ACK
                    case model_1.DHCP53Code.DHCPNAK: // 6,
                        return; // nothink to do with incomming NAK
                    case model_1.DHCP53Code.DHCPRELEASE: // 7
                        return await self.handle_Release(request);
                    case model_1.DHCP53Code.DHCPINFORM: // 8
                        return console.error("Not implemented DHCPINFORM");
                    default:
                        console.error("Not implemented DHCP 53 Type", request.options[53]);
                }
            }
            catch (e) {
                console.error(e);
            }
        });
        socket.on("listening", () => self.emit("listening", socket));
        socket.on("close", () => self.emit("close"));
        process.on("SIGINT", () => self.close());
    }
    getServer(request) {
        const value = this.getC(model_1.OptionId.server, request);
        if (!value)
            throw Error("server is mandatory in server configuration");
        return value;
    }
    getConfigBroadcast(request) {
        const value = this.getC(model_1.OptionId.broadcast, request);
        if (!value)
            throw Error("broadcast is mandatory in server configuration");
        return value;
    }
    validOption(optionId) {
        if (this.optsMeta[optionId])
            return true;
        this.emit("error", `Unknown Type for option ${optionId}, add this type in options.ts`);
        return false;
    }
    getOptions(request, pre, customOpts, requireds, requested) {
        // Check if option id actually exists
        customOpts = customOpts || {};
        requested = requested || [];
        requireds = requireds.filter((o) => this.validOption(o));
        requested = requested.filter((o) => this.validOption(o));
        for (const optionId of requireds) {
            // Take the first config value always
            if (!pre[optionId]) {
                pre[optionId] = customOpts[optionId];
            }
            if (!pre[optionId]) {
                pre[optionId] = this.getC(optionId, request);
            }
            if (!pre[optionId])
                throw new Error(`Required option ${this.optsMeta[optionId].config} does not have a value set`);
        }
        // Add all values, the user wants, which are not already provided:
        for (const optionId of requested) {
            // Take the first config value always
            let val = customOpts[optionId];
            if (val) {
                pre[optionId] = val;
            }
            if (pre[optionId]) {
                val = this.getC(optionId, request);
                // Add value only, if it's meaningful
                if (val)
                    pre[optionId] = val;
                else
                    this.emit("warning", `No value for option ${optionId} in config for ${request.chaddr}`);
            }
        }
        // Finally Add all missing and forced options
        const forceOptions = this.getForceOptions(request);
        if (forceOptions instanceof Array) {
            for (const option of forceOptions) {
                // Add numeric options right away and look up alias names
                const id = options_1.getDHCPId(option);
                // Add option if it is valid and not present yet
                if (id && !pre[id]) {
                    pre[id] = this.getC(id, request);
                }
            }
        }
        return pre;
    }
    async selectAddress(clientMAC, request) {
        /**
         * IP Selection algorithm:
         *
         * 0. static lease are checked before this call since they can be fully customised
         * 1. look for a previous lease
         * 2. look for a free lease from the pool
         * TODO:
         * - Incorporate user preference, sent to us
         * - Check APR if IP exists on net
         */
        /**
         * If existing lease for a mac address is present, re-use the IP
         * live leases contains only IP data
         * in this function we only care about IP, so it's fine
         */
        const l1 = await this.leaseLive.getLeaseFromMac(clientMAC);
        if (l1 && l1.address) {
            return l1.address;
        }
        /**
         * find a free IP
         */
        const randIP = this.getRandomIP(request);
        const [firstIPstr, lastIPStr] = this.getRange(request);
        const myIPStr = this.getServer(request);
        const staticSerserve = this.leaseStatic.getReservedIP();
        if (this.leaseLive.getFreeIP) {
            const strIP = await this.leaseLive.getFreeIP(firstIPstr, lastIPStr, [new Set(myIPStr), staticSerserve], randIP);
            if (strIP)
                return strIP;
            throw Error("DHCP is full");
        }
        const firstIP = tools_1.parseIp(firstIPstr);
        const lastIP = tools_1.parseIp(lastIPStr);
        // Exclude our own server IP from pool
        const myIP = tools_1.parseIp(myIPStr);
        // Select a random IP, using prime number iterator
        if (randIP) {
            let total = lastIP - firstIP;
            const p = prime_1.random(1000, 10000);
            let offset = 0;
            while (total--) {
                offset = (offset + p) % total;
                const ip = firstIP + offset;
                if (ip === myIP)
                    continue;
                const strIP = tools_1.formatIp(ip);
                if (staticSerserve.has(strIP))
                    continue;
                if (await this.leaseLive.hasAddress(strIP))
                    continue;
                return strIP;
            }
        }
        else {
            // Choose first free IP in subnet
            for (let ip = firstIP; ip <= lastIP; ip++) {
                const strIP = tools_1.formatIp(ip);
                if (!await this.leaseLive.hasAddress(strIP))
                    return strIP;
            }
        }
        throw Error("DHCP is full");
    }
    async handle_Discover(request) {
        const { chaddr } = request;
        const myIPStr = this.getServer(request);
        let nextLease = false;
        let lease = await this.leaseLive.getLeaseFromMac(chaddr);
        if (lease) {
            // extand lease time
            lease.expiration = this.genExpiration(request);
            await this.leaseLive.updateLease(lease);
        }
        else {
            lease = this.newLease(request);
            nextLease = true;
        }
        const staticLease = this.leaseStatic.getLease(request.chaddr, request);
        let customOpts = {};
        if (staticLease) {
            lease.address = staticLease.address;
            customOpts = staticLease.options || {};
        }
        else {
            let requestedIpAddress = request.options[model_1.OptionId.requestedIpAddress];
            if (requestedIpAddress) {
                const usedLive = await this.leaseLive.hasAddress(requestedIpAddress);
                const usedStatic = this.leaseStatic.hasAddress(requestedIpAddress);
                const usedMe = myIPStr === requestedIpAddress;
                if (usedMe || usedStatic || usedLive)
                    requestedIpAddress = undefined;
            }
            if (requestedIpAddress)
                lease.address = requestedIpAddress;
            else
                lease.address = await this.selectAddress(request.chaddr, request);
        }
        if (nextLease) {
            this.leaseOffer.add(lease);
        }
        const pre = { [model_1.OptionId.dhcpMessageType]: model_1.DHCP53Code.DHCPOFFER };
        const requireds = [model_1.OptionId.netmask, model_1.OptionId.router, model_1.OptionId.leaseTime, model_1.OptionId.server, model_1.OptionId.dns];
        const requested = request.options[model_1.OptionId.dhcpParameterRequestList];
        const options = this.getOptions(request, pre, customOpts, requireds, requested);
        const ans = toResponse(request, options);
        ans.ciaddr = INADDR_ANY;
        ans.yiaddr = lease.address;
        ans.siaddr = this.getServer(request); // next server in bootstrap. That's us;
        // Send the actual data
        // INADDR_BROADCAST : 68 <- SERVER_IP : 67
        const broadcast = this.getConfigBroadcast(request);
        return this._send(broadcast, ans);
    }
    async handle_Request(request) {
        const { chaddr } = request;
        let nextLease = false;
        let lease = this.leaseOffer.pop(chaddr);
        if (lease) {
            nextLease = true;
        }
        if (!lease) {
            lease = await this.leaseLive.getLeaseFromMac(chaddr);
            // nextLease = true;
        }
        else if (!lease) {
            this.emit("error", "Get request for an non existing lease, you may extend offer timeout");
            return 0;
            // error;
            // lease = this.newLease(request);
            // nextLease = true;
        }
        if (lease) { // extand lease time
            lease.expiration = this.genExpiration(request);
            await this.leaseLive.updateLease(lease);
        }
        if (!lease) {
            this.emit("error", "Get request for an non existing lease, you may extend offer timeout");
            return 0;
        }
        const staticLease = this.leaseStatic.getLease(request.chaddr, request);
        let customOpts = {};
        if (staticLease) {
            lease.address = staticLease.address;
            customOpts = staticLease.options || {};
        }
        else {
            lease.address = await this.selectAddress(chaddr, request);
        }
        if (nextLease) {
            this.leaseLive.add(lease);
        }
        const pre = { [model_1.OptionId.dhcpMessageType]: model_1.DHCP53Code.DHCPACK };
        const requireds = [model_1.OptionId.netmask, model_1.OptionId.router, model_1.OptionId.leaseTime, model_1.OptionId.server, model_1.OptionId.dns];
        const requested = request.options[model_1.OptionId.dhcpParameterRequestList];
        const options = this.getOptions(request, pre, customOpts, requireds, requested);
        const ans = toResponse(request, options);
        ans.ciaddr = request.ciaddr;
        ans.yiaddr = lease.address;
        ans.siaddr = this.getServer(request); // server ip, that's us
        this.emit("bound", lease);
        // Send the actual data
        // INADDR_BROADCAST : 68 <- SERVER_IP : 67
        return this._send(this.getConfigBroadcast(request), ans);
    }
    async handle_Release(request) {
        const { chaddr } = request;
        this.leaseOffer.pop(chaddr);
        this.leaseLive.release(chaddr);
        const pre = { [model_1.OptionId.dhcpMessageType]: model_1.DHCP53Code.DHCPACK };
        const requireds = [model_1.OptionId.server];
        const options = this.getOptions(request, pre, {}, requireds);
        const ans = toResponse(request, options);
        ans.ciaddr = INADDR_ANY; // not shure
        ans.yiaddr = INADDR_ANY; // not shure
        ans.siaddr = INADDR_ANY; // not shure
        // Send the actual data
        return this._send(this.getConfigBroadcast(request), ans);
    }
    /**
     * Formulate the response object
     */
    sendNak(request) {
        const pre = { [model_1.OptionId.dhcpMessageType]: model_1.DHCP53Code.DHCPNAK };
        const requireds = [model_1.OptionId.server];
        const options = this.getOptions(request, pre, {}, requireds);
        const ans = toResponse(request, options);
        ans.ciaddr = INADDR_ANY;
        ans.yiaddr = INADDR_ANY;
        ans.siaddr = INADDR_ANY;
        // Send the actual data
        return this._send(this.getConfigBroadcast(request), ans);
    }
    listen(port, host) {
        const { socket } = this;
        if (!socket)
            throw Error("Socket had been destry!");
        return new Promise((resolve) => {
            socket.bind({ port: port || SERVER_PORT, address: host || INADDR_ANY }, () => {
                socket.setBroadcast(true);
                resolve();
            });
        });
    }
    close() {
        const { socket } = this;
        if (!socket)
            return Promise.resolve();
        this.socket = null;
        return new Promise((resolve) => socket.close(resolve));
    }
    /**
     * @param key the request Key or optionId
     * @param requested the remote Options
     */
    getC(key, requested) {
        const n = options_1.getDHCPId(key);
        let val = this.config[n];
        if (val === undefined) {
            const meta = this.optsMeta[n];
            if (meta.default)
                val = meta.default;
            else
                return null;
        }
        if (typeof val === "function") {
            val = val(requested);
        }
        return val;
    }
    getRange(requested) {
        const val = this.config.range;
        if (typeof val === "function")
            return val(requested);
        return val;
    }
    getForceOptions(requested) {
        const val = this.config.forceOptions;
        if (typeof val === "function")
            return val(requested);
        return val;
    }
    getRandomIP(requested) {
        const val = this.config.randomIP;
        if (typeof val === "function")
            return val(requested);
        return val;
    }
    newLease(request) {
        const { chaddr } = request;
        const name = request.options[model_1.OptionId.hostname] || "";
        const expiration = this.genExpiration(request);
        return { address: "", mac: chaddr, name: name, expiration };
    }
    genExpiration(request) {
        return this.getC(model_1.OptionId.leaseTime, request) + Math.round(new Date().getTime() / 1000);
    }
    _send(host, data) {
        const { socket } = this;
        if (!socket)
            throw Error("Socket had bee closed");
        return new Promise((resolve, reject) => {
            const sb = protocol_1.format(data);
            socket.send(sb.buffer, 0, sb.w, CLIENT_PORT, host, (err, bytes) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(bytes);
                }
            });
        });
    }
}
exports.Server = Server;
//# sourceMappingURL=Server.js.map