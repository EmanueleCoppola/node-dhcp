"use strict";
/* tslint:disable no-console */
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dgram = __importStar(require("dgram"));
const events_1 = require("events");
const DHCPOptions_1 = require("./DHCPOptions");
const Lease_1 = require("./Lease");
const model_1 = require("./model");
const OptionsModel = __importStar(require("./options"));
const prime_1 = require("./prime");
const Protocol = __importStar(require("./protocol"));
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
        const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        this.on('getLeasesState', () => {
            this.emit('LeaseState', this.leaseState);
        });
        socket.on('message', (buf) => {
            let request;
            try {
                request = Protocol.parse(buf);
            }
            catch (e) {
                return self.emit('error', e);
            }
            if (request.op !== model_1.BootCode.BOOTREQUEST) {
                return self.emit('error', new Error('Malformed packet'), request);
            }
            if (!request.options[model_1.OptionId.dhcpMessageType]) {
                return self.emit('error', new Error('Got message, without valid message type'), request);
            }
            self.emit('message', request);
            if (!listenOnly) {
                // Handle request
                const mode = request.options[model_1.OptionId.dhcpMessageType];
                switch (mode) {
                    case model_1.DHCP53Code.DHCPDISCOVER: // 1.
                        self.handleDiscover(request);
                        break;
                    case model_1.DHCP53Code.DHCPREQUEST: // 3.
                        self.handleRequest(request);
                        break;
                    case model_1.DHCP53Code.DHCPINFORM:
                    default:
                        console.error('Not implemented DHCP 53 Type', request.options[53]);
                }
            }
        });
        socket.on('listening', () => self.emit('listening', socket));
        socket.on('close', () => self.emit('close'));
        this.socket = socket;
        process.on('SIGINT', () => {
            self.close();
        });
        this.config = config;
        this.leaseState = {};
    }
    getLeases() {
        return Object.values(this.leaseState);
    }
    getConfigServer(request) {
        const value = this.config.get('server', request);
        if (!value)
            throw Error('server is mandatory in server configuration');
        return value;
    }
    getConfigBroadcast(request) {
        const value = this.config.get('broadcast', request);
        if (!value)
            throw Error('broadcast is mandatory in server configuration');
        return value;
    }
    getOptions(request, pre, requireds, requested) {
        for (const required of requireds) {
            // Check if option id actually exists
            if (OptionsModel.optsMeta[required] !== undefined) {
                // Take the first config value always
                if (pre[required] === undefined)
                    pre[required] = this.config.get(required, request);
                if (!pre[required])
                    throw new Error(`Required option ${OptionsModel.optsMeta[required].config} does not have a value set`);
            }
            else {
                this.emit('error', `Unknown option ${required}`);
            }
        }
        // Add all values, the user wants, which are not already provided:
        if (requested) {
            for (const req of requested) {
                // Check if option id actually exists
                if (OptionsModel.optsMeta[req] !== undefined) {
                    // Take the first config value always
                    if (pre[req] === undefined) {
                        const val = this.config.get(req, req.options);
                        // Add value only, if it's meaningful
                        if (val)
                            pre[req] = val;
                    }
                }
                else {
                    this.emit('error', `Unknown option ${req}`);
                }
            }
        }
        // Finally Add all missing and forced options
        const forceOptions = this.config.get('forceOptions', request);
        if (forceOptions instanceof Array) {
            for (const option of forceOptions) {
                // Add numeric options right away and look up alias names
                const id = OptionsModel.getDHCPId(option);
                // Add option if it is valid and not present yet
                if (id !== undefined && pre[id] === undefined) {
                    pre[id] = this.config.get(option, request);
                }
            }
        }
        return pre;
    }
    selectAddress(clientMAC, request) {
        /*
         * IP Selection algorithm:
         *
         * 0. Is Mac already known, send same IP of known lease
         *
         * 1. Is there a wish for static binding?
         *
         * 2. Are all available IP's occupied?
         *    - Send release to oldest lease and reuse
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
        if (this.leaseState[clientMAC] && this.leaseState[clientMAC].address) {
            return this.leaseState[clientMAC].address;
        }
        // Is there a static binding?
        const staticLeases = this.config.get('static', request);
        if (typeof staticLeases === 'function') {
            const staticResult = staticLeases(clientMAC, request);
            if (staticResult)
                return staticResult;
        }
        else if (staticLeases[clientMAC]) {
            return staticLeases[clientMAC];
        }
        const randIP = this.config.get('randomIP', request);
        const [firstIPstr, lastIPStr] = this.config.get('range', request);
        const firstIP = tools_1.parseIp(firstIPstr);
        const lastIP = tools_1.parseIp(lastIPStr);
        // Add all known addresses and save the oldest lease
        const ipSet = new Set();
        // Exclude our own server IP from pool
        ipSet.add(tools_1.parseIp(this.getConfigServer(request)));
        let oldestMac = null;
        let oldestTime = Infinity;
        let leases = 0;
        for (const mac in this.leaseState) {
            if (this.leaseState[mac].address)
                ipSet.add(tools_1.parseIp(this.leaseState[mac].address));
            if (this.leaseState[mac].leaseTime < oldestTime) {
                oldestTime = this.leaseState[mac].leaseTime;
                oldestMac = mac;
            }
            leases++;
        }
        // Check if all IP's are used and delete the oldest
        if (oldestMac !== null && lastIP - firstIP === leases) {
            const ip = this.leaseState[oldestMac].address;
            // TODO: Notify deleted client
            delete this.leaseState[oldestMac];
            return ip;
        }
        // Select a random IP, using prime number iterator
        if (randIP) {
            let total = lastIP - firstIP;
            const p = prime_1.random(100, 10000);
            let offset = 0;
            while (total--) {
                offset = (offset + p) % total;
                const ip = firstIP + offset;
                if (!ipSet.has(ip))
                    return tools_1.formatIp(ip);
            }
            console.error('no More IP available');
        }
        // Choose first free IP in subnet
        for (let i = firstIP; i <= lastIP; i++) {
            if (!ipSet.has(i))
                return tools_1.formatIp(i);
        }
    }
    handleDiscover(request) {
        // console.log('Handle Discover', req);
        const lease = this.leaseState[request.chaddr] = this.leaseState[request.chaddr] || new Lease_1.Lease();
        lease.address = this.selectAddress(request.chaddr, request);
        lease.leasePeriod = this.config.get(model_1.OptionId.leaseTime, request);
        lease.server = this.getConfigServer(request);
        lease.state = 'OFFERED';
        return this.sendOffer(request);
    }
    sendOffer(request) {
        // console.log('Send Offer');
        // Formulate the response object
        const siaddr = this.getConfigServer(request); // next server in bootstrap. That's us
        const yiaddr = this.selectAddress(request.chaddr, request); // My offer
        const options = this.getOptions(request, new DHCPOptions_1.DHCPOptions({
            [model_1.OptionId.dhcpMessageType]: model_1.DHCP53Code.DHCPOFFER,
        }), [model_1.OptionId.netmask, model_1.OptionId.router, model_1.OptionId.leaseTime, model_1.OptionId.server, model_1.OptionId.dns], request.options[model_1.OptionId.dhcpParameterRequestList]);
        const ans = Object.assign({ op: model_1.BootCode.BOOTREPLY }, ansCommon, { chaddr: request.chaddr, ciaddr: INADDR_ANY, flags: request.flags, giaddr: request.giaddr, options,
            siaddr, xid: request.xid, // 'xid' from client DHCPDISCOVER message
            yiaddr });
        // Send the actual data
        // INADDR_BROADCAST : 68 <- SERVER_IP : 67
        const broadcast = this.getConfigBroadcast(request);
        return this._send(broadcast, ans);
    }
    handleRequest(request) {
        // console.log('Handle Request', req);
        const lease = this.leaseState[request.chaddr] = this.leaseState[request.chaddr] || new Lease_1.Lease();
        lease.address = this.selectAddress(request.chaddr, request);
        lease.leasePeriod = this.config.get('leaseTime', request);
        lease.server = this.getConfigServer(request);
        lease.state = 'BOUND';
        lease.bindTime = new Date();
        return this.sendAck(request);
    }
    sendAck(request) {
        // console.log('Send ACK');
        // Formulate the response object
        const options = this.getOptions(request, new DHCPOptions_1.DHCPOptions({
            [model_1.OptionId.dhcpMessageType]: model_1.DHCP53Code.DHCPACK,
        }), [model_1.OptionId.netmask, model_1.OptionId.router, model_1.OptionId.leaseTime, model_1.OptionId.server, model_1.OptionId.dns], request.options[model_1.OptionId.dhcpParameterRequestList]);
        const ans = Object.assign({ op: model_1.BootCode.BOOTREPLY }, ansCommon, { chaddr: request.chaddr, ciaddr: request.ciaddr, flags: request.flags, giaddr: request.giaddr, // 'giaddr' from client DHCPREQUEST message
            options, siaddr: this.getConfigServer(request), xid: request.xid, yiaddr: this.selectAddress(request.chaddr, request) });
        this.emit('bound', this.leaseState);
        // Send the actual data
        // INADDR_BROADCAST : 68 <- SERVER_IP : 67
        return this._send(this.getConfigBroadcast(request), ans);
    }
    sendNak(request) {
        // console.log('Send NAK');
        // Formulate the response object
        const options = this.getOptions(request, new DHCPOptions_1.DHCPOptions({
            [model_1.OptionId.dhcpMessageType]: model_1.DHCP53Code.DHCPNAK,
        }), [model_1.OptionId.server]);
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
            const sb = Protocol.format(data);
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