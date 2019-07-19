"use strict";
/* tslint:disable no-console */
Object.defineProperty(exports, "__esModule", { value: true });
const dgram_1 = require("dgram");
const events_1 = require("events");
const DHCPOptions_1 = require("./DHCPOptions");
const Lease_1 = require("./Lease");
const model_1 = require("./model");
const options_1 = require("./options");
const prime_1 = require("./prime");
const protocol_1 = require("./protocol");
const LeaseStoreMemory_1 = require("./store/LeaseStoreMemory");
const tools_1 = require("./tools");
const INADDR_ANY = '0.0.0.0';
const SERVER_PORT = 67;
const CLIENT_PORT = 68;
const ansCommon = {
    file: '',
    hlen: 6,
    hops: 0,
    htype: model_1.HardwareType.Ethernet,
    secs: 0,
    sname: '',
};
class Server extends events_1.EventEmitter {
    constructor(config, listenOnly) {
        super();
        const self = this;
        const socket = dgram_1.createSocket({ type: 'udp4', reuseAddr: true });
        this.config = config;
        this.leaseState = config.leaseState || new LeaseStoreMemory_1.LeaseStoreMemory();
        this.socket = socket;
        socket.on('message', async (buf) => {
            let request;
            try {
                request = protocol_1.parse(buf);
            }
            catch (e) {
                return self.emit('error', e);
            }
            if (request.op !== model_1.BootCode.BOOTREQUEST)
                return self.emit('error', new Error('Malformed packet'), request);
            if (!request.options[model_1.OptionId.dhcpMessageType])
                return self.emit('error', new Error('Got message, without valid message type'), request);
            self.emit('message', request);
            if (listenOnly)
                return;
            try {
                // Handle request
                const mode = request.options[model_1.OptionId.dhcpMessageType];
                switch (mode) {
                    case model_1.DHCP53Code.DHCPDISCOVER: // 1.
                        return await self.handleDiscover(request);
                    case model_1.DHCP53Code.DHCPREQUEST: // 3.
                        return await self.handleRequest(request);
                    case model_1.DHCP53Code.DHCPINFORM:
                    default:
                        console.error('Not implemented DHCP 53 Type', request.options[53]);
                }
            }
            catch (e) {
                console.error(e);
            }
        });
        socket.on('listening', () => self.emit('listening', socket));
        socket.on('close', () => self.emit('close'));
        process.on('SIGINT', () => self.close());
    }
    getServer(request) {
        const value = this.config.get(model_1.OptionId.server, request);
        if (!value)
            throw Error('server is mandatory in server configuration');
        return value;
    }
    getConfigBroadcast(request) {
        const value = this.config.get(model_1.OptionId.broadcast, request);
        if (!value)
            throw Error('broadcast is mandatory in server configuration');
        return value;
    }
    getOptions(request, pre, requireds, requested) {
        for (const required of requireds) {
            // Check if option id actually exists
            if (options_1.optsMeta[required] !== undefined) {
                // Take the first config value always
                if (pre[required] === undefined)
                    pre[required] = this.config.get(required, request);
                if (!pre[required])
                    throw new Error(`Required option ${options_1.optsMeta[required].config} does not have a value set`);
            }
            else {
                this.emit('error', `Unknown option ${required}`);
            }
        }
        // Add all values, the user wants, which are not already provided:
        if (requested) {
            for (const optionId of requested) {
                // Check if option id actually exists
                if (options_1.optsMeta[optionId]) {
                    // Take the first config value always
                    if (pre[optionId]) {
                        const val = this.config.get(optionId, request);
                        // Add value only, if it's meaningful
                        if (val)
                            pre[optionId] = val;
                    }
                }
                else {
                    this.emit('error', `Unknown option ${optionId}`);
                }
            }
        }
        // Finally Add all missing and forced options
        const forceOptions = this.config.get('forceOptions', request);
        if (forceOptions instanceof Array) {
            for (const option of forceOptions) {
                // Add numeric options right away and look up alias names
                const id = options_1.getDHCPId(option);
                // Add option if it is valid and not present yet
                if (id && !pre[id]) {
                    pre[id] = this.config.get(option, request);
                }
            }
        }
        return pre;
    }
    async selectAddress(clientMAC, request) {
        /*
         * IP Selection algorithm:
         *
         * 0. Is Mac already known, send same IP of known lease
         *
         * 1. Is there a wish for static binding?
         *
         * 3. is config randomIP?
         *    - Select random IP of range, until no occupied slot is found
         *
         * 4. Take first unmapped IP of range
         *
         * TODO:
         * - Incorporate user preference, sent to us
         * - Check APR if IP exists on net
         */
        // If existing lease for a mac address is present, re-use the IP
        const l1 = await this.leaseState.getLeaseFromMac(clientMAC);
        if (l1 && l1.address) {
            return l1.address;
        }
        // Is there a static binding?
        const staticLeases = this.config.get('static', request);
        if (typeof staticLeases === 'function') {
            const staticResult = await staticLeases(clientMAC, request);
            if (staticResult)
                return staticResult;
        }
        else if (staticLeases[clientMAC]) {
            return staticLeases[clientMAC];
        }
        const randIP = this.config.get('randomIP', request);
        const [firstIPstr, lastIPStr] = this.config.get('range', request);
        const myIPStr = this.getServer(request);
        if (this.leaseState.getFreeIP) {
            const strIP = await this.leaseState.getFreeIP(firstIPstr, lastIPStr, [myIPStr], randIP);
            if (strIP)
                return strIP;
            throw Error('DHCP is full');
        }
        const firstIP = tools_1.parseIp(firstIPstr);
        const lastIP = tools_1.parseIp(lastIPStr);
        const leases = await this.leaseState.size();
        // Check if all IP's are used and delete the oldest
        if (lastIP - firstIP === leases) {
            throw Error('DHCP is full');
        }
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
                if (!await this.leaseState.hasAddress(strIP))
                    return strIP;
            }
        }
        else {
            // Choose first free IP in subnet
            for (let ip = firstIP; ip <= lastIP; ip++) {
                const strIP = tools_1.formatIp(ip);
                if (!await this.leaseState.hasAddress(strIP))
                    return strIP;
            }
        }
        throw Error('DHCP is full');
    }
    async handleDiscover(request) {
        const { chaddr } = request;
        let newLease = false;
        let lease = await this.leaseState.getLeaseFromMac(chaddr);
        if (!lease) {
            lease = new Lease_1.Lease(chaddr);
            newLease = true;
        }
        lease.address = await this.selectAddress(request.chaddr, request);
        lease.leasePeriod = this.config.get(model_1.OptionId.leaseTime, request);
        lease.server = this.getServer(request);
        lease.state = 'OFFERED';
        if (newLease) {
            this.leaseState.add(lease);
        }
        return this.sendOffer(request);
    }
    async sendOffer(request) {
        // Formulate the response object
        const siaddr = this.getServer(request); // next server in bootstrap. That's us
        const yiaddr = await this.selectAddress(request.chaddr, request); // My offer
        const pre = new DHCPOptions_1.DHCPOptions({
            [model_1.OptionId.dhcpMessageType]: model_1.DHCP53Code.DHCPOFFER,
        });
        const requireds = [model_1.OptionId.netmask, model_1.OptionId.router, model_1.OptionId.leaseTime, model_1.OptionId.server, model_1.OptionId.dns];
        const requested = request.options[model_1.OptionId.dhcpParameterRequestList];
        const options = this.getOptions(request, pre, requireds, requested);
        const ans = Object.assign({ op: model_1.BootCode.BOOTREPLY }, ansCommon, { chaddr: request.chaddr, ciaddr: INADDR_ANY, flags: request.flags, giaddr: request.giaddr, options,
            siaddr, xid: request.xid, // 'xid' from client DHCPDISCOVER message
            yiaddr });
        // Send the actual data
        // INADDR_BROADCAST : 68 <- SERVER_IP : 67
        const broadcast = this.getConfigBroadcast(request);
        return this._send(broadcast, ans);
    }
    async handleRequest(request) {
        const { chaddr } = request;
        let newLease = false;
        let lease = await this.leaseState.getLeaseFromMac(chaddr);
        if (!lease) {
            lease = new Lease_1.Lease(chaddr);
            newLease = true;
        }
        lease.address = await this.selectAddress(chaddr, request);
        lease.leasePeriod = this.config.get('leaseTime', request);
        lease.server = this.getServer(request);
        lease.state = 'BOUND';
        lease.bindTime = new Date();
        if (newLease) {
            this.leaseState.add(lease);
        }
        return this.sendAck(request);
    }
    async sendAck(request) {
        // console.log('Send ACK');
        // Formulate the response object
        const pre = new DHCPOptions_1.DHCPOptions({
            [model_1.OptionId.dhcpMessageType]: model_1.DHCP53Code.DHCPACK,
        });
        const requireds = [model_1.OptionId.netmask, model_1.OptionId.router, model_1.OptionId.leaseTime, model_1.OptionId.server, model_1.OptionId.dns];
        const requested = request.options[model_1.OptionId.dhcpParameterRequestList];
        const options = this.getOptions(request, pre, requireds, requested);
        const address = await this.selectAddress(request.chaddr, request);
        const ans = Object.assign({ op: model_1.BootCode.BOOTREPLY }, ansCommon, { chaddr: request.chaddr, ciaddr: request.ciaddr, flags: request.flags, giaddr: request.giaddr, // 'giaddr' from client DHCPREQUEST message
            options, siaddr: this.getServer(request), xid: request.xid, yiaddr: address });
        // this.emit('bound', this.leaseState);
        // Send the actual data
        // INADDR_BROADCAST : 68 <- SERVER_IP : 67
        return this._send(this.getConfigBroadcast(request), ans);
    }
    sendNak(request) {
        // console.log('Send NAK');
        // Formulate the response object
        const pre = new DHCPOptions_1.DHCPOptions({
            [model_1.OptionId.dhcpMessageType]: model_1.DHCP53Code.DHCPNAK,
        });
        const requireds = [model_1.OptionId.server];
        const options = this.getOptions(request, pre, requireds);
        const ans = Object.assign({}, ansCommon, { chaddr: request.chaddr, ciaddr: INADDR_ANY, flags: request.flags, giaddr: request.giaddr, op: model_1.BootCode.BOOTREPLY, options, siaddr: INADDR_ANY, xid: request.xid, yiaddr: INADDR_ANY });
        // Send the actual data
        return this._send(this.getConfigBroadcast(request), ans);
    }
    listen(port, host) {
        const { socket } = this;
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
    handleRelease() {
        /** TODO */
    }
    handleRenew() {
        // Send ack
    }
    _send(host, data) {
        const { socket } = this;
        if (!socket)
            throw Error('Socket had bee closed');
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