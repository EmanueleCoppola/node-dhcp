"use strict";
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
const ClientConfig_1 = require("./ClientConfig");
const DHCPOptions_1 = require("./DHCPOptions");
const Lease_1 = require("./Lease");
const model_1 = require("./model");
const OptionsModel = __importStar(require("./options"));
const Protocol = __importStar(require("./protocol"));
const Tools = __importStar(require("./tools"));
const SERVER_PORT = 67;
const CLIENT_PORT = 68;
const INADDR_ANY = '0.0.0.0';
const INADDR_BROADCAST = '255.255.255.255';
const ansCommon = {
    file: '',
    giaddr: INADDR_ANY,
    hlen: 6,
    hops: 0,
    htype: model_1.HardwareType.Ethernet,
    op: model_1.BootCode.BOOTREQUEST,
    secs: 0,
    siaddr: INADDR_ANY,
    sname: '',
    yiaddr: INADDR_ANY,
};
class Client extends events_1.EventEmitter {
    constructor(config) {
        super();
        const self = this;
        const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        sock.on('message', (buf) => {
            let request;
            try {
                request = Protocol.parse(buf);
            }
            catch (e) {
                return self.emit('error', e);
            }
            // self._req = req;
            if (request.op !== model_1.BootCode.BOOTREPLY) {
                return self.emit('error', new Error('Malformed packet'), request);
            }
            if (!request.options[model_1.OptionId.dhcpMessageType]) {
                return self.emit('error', new Error('Got message, without valid message type'), request);
            }
            self.emit('message', request);
            // Handle request
            switch (request.options[model_1.OptionId.dhcpMessageType]) {
                case model_1.DHCP53Code.DHCPOFFER:
                    self.handleOffer(request);
                    break;
                case model_1.DHCP53Code.DHCPACK:
                case model_1.DHCP53Code.DHCPNAK:
                    self.handleAck(request);
                    break;
            }
        });
        sock.on('listening', () => self.emit('listening', sock));
        sock.on('close', () => self.emit('close'));
        this.socket = sock;
        this.config = config || new ClientConfig_1.ClientConfig();
        this.lastLease = new Lease_1.Lease();
    }
    sendDiscover() {
        // console.log('Send Discover');
        const mac = this.config.getMac();
        const features = this.config.getFeatures();
        // Formulate the response object
        const ans = Object.assign({}, ansCommon, { chaddr: mac, ciaddr: INADDR_ANY, flags: 0, options: new DHCPOptions_1.DHCPOptions({
                [model_1.OptionId.maxMessageSize]: 1500,
                [model_1.OptionId.dhcpMessageType]: model_1.DHCP53Code.DHCPDISCOVER,
                [model_1.OptionId.dhcpClientIdentifier]: mac,
                [model_1.OptionId.dhcpParameterRequestList]: features,
            }), xid: this.lastLease.xid++ });
        this.lastLease.state = 'SELECTING';
        this.lastLease.tries = 0;
        // TODO: set timeouts
        // Send the actual data
        // INADDR_ANY : 68 -> INADDR_BROADCAST : 67
        return this.send(INADDR_BROADCAST, ans);
    }
    handleOffer(req) {
        // console.log('Handle Offer', req);
        // Select an offer out of all offers
        // We simply take the first one and change the state then
        if (req.options[model_1.OptionId.server]) {
            // Check if we already sent a request to the first appearing server
            if (this.lastLease.state !== 'REQUESTING') {
                this.sendRequest(req);
            }
        }
        else {
            this.emit('error', 'Offer does not have a server identifier', req);
        }
    }
    sendRequest(req) {
        // console.log('Send Request');
        // Formulate the response object
        const mac = this.config.getMac();
        const ans = Object.assign({}, ansCommon, { chaddr: mac, ciaddr: INADDR_ANY, flags: 0, options: new DHCPOptions_1.DHCPOptions({
                [model_1.OptionId.maxMessageSize]: 1500,
                [model_1.OptionId.dhcpMessageType]: model_1.DHCP53Code.DHCPREQUEST,
                [model_1.OptionId.dhcpClientIdentifier]: mac,
                [model_1.OptionId.dhcpParameterRequestList]: this.config.getFeatures(),
                [model_1.OptionId.requestedIpAddress]: this.lastLease.address,
            }), xid: req.xid });
        this.lastLease.server = req.options.get(model_1.OptionId.server, req);
        this.lastLease.address = req.yiaddr;
        this.lastLease.state = 'REQUESTING';
        this.lastLease.tries = 0;
        // TODO: retry timeout
        // INADDR_ANY : 68 -> INADDR_BROADCAST : 67
        return this.send(INADDR_BROADCAST, ans);
    }
    handleAck(req) {
        if (req.options[model_1.OptionId.dhcpMessageType] === model_1.DHCP53Code.DHCPACK) {
            // We now know the IP for sure
            // console.log('Handle ACK', req);
            this.lastLease.bindTime = new Date();
            this.lastLease.state = 'BOUND';
            this.lastLease.address = req.yiaddr;
            this.lastLease.options = new DHCPOptions_1.DHCPOptions();
            // Lease time is available
            if (req.options[model_1.OptionId.leaseTime]) {
                const leaseTime = req.options.get(model_1.OptionId.leaseTime, req);
                this.lastLease.leasePeriod = leaseTime;
                this.lastLease.renewPeriod = leaseTime / 2;
                this.lastLease.rebindPeriod = leaseTime;
            }
            // Renewal time is available
            if (req.options[model_1.OptionId.renewalTime]) {
                this.lastLease.renewPeriod = req.options.get(model_1.OptionId.renewalTime, req);
            }
            // Rebinding time is available
            if (req.options[model_1.OptionId.rebindingTime]) {
                this.lastLease.rebindPeriod = req.options.get(model_1.OptionId.rebindingTime, req);
            }
            // TODO: set renew & rebind timer
            const options = req.options;
            this.lastLease.options = new DHCPOptions_1.DHCPOptions();
            // Map all options from request
            for (const id in options) {
                const id2 = Number(id);
                if (id2 === model_1.OptionId.dhcpMessageType || id2 === model_1.OptionId.leaseTime || id2 === model_1.OptionId.renewalTime || id2 === model_1.OptionId.rebindingTime)
                    continue;
                const conf = OptionsModel.optsMeta[id];
                const key = conf.config || conf.attr;
                if (conf.enum) {
                    this.lastLease.options[key] = conf.enum[options[id]];
                }
                else {
                    this.lastLease.options[key] = options[id];
                }
            }
            // If netmask is not given, set it to a class related mask
            if (!this.lastLease.options[model_1.OptionId.netmask]) {
                this.lastLease.options[model_1.OptionId.netmask] = Tools.formatIp(Tools.netmaskFromIP(this.lastLease.address));
            }
            const cidr = Tools.CIDRFromNetmask(this.lastLease.options.get(model_1.OptionId.netmask, req));
            // If router is not given, guess one
            if (!this.lastLease.options[model_1.OptionId.router]) {
                this.lastLease.options[model_1.OptionId.router] = Tools.formatIp(Tools.gatewayFromIpCIDR(this.lastLease.address, cidr));
            }
            // If broadcast is missing
            if (!this.lastLease.options[model_1.OptionId.broadcast]) {
                this.lastLease.options[model_1.OptionId.broadcast] = Tools.formatIp(Tools.broadcastFromIpCIDR(this.lastLease.address, cidr));
            }
            this.emit('bound', this.lastLease);
        }
        else {
            // We're sorry, today we have no IP for you...
        }
    }
    sendRelease(req) {
        // console.log('Send Release');
        // Formulate the response object
        const ans = Object.assign({}, ansCommon, { chaddr: this.config.getMac(), ciaddr: this.lastLease.server, flags: 0, options: new DHCPOptions_1.DHCPOptions({
                [model_1.OptionId.dhcpMessageType]: model_1.DHCP53Code.DHCPRELEASE,
                // TODO: MAY clientID
                [model_1.OptionId.server]: this.lastLease.server,
            }), xid: this.lastLease.xid++ });
        this.lastLease.bindTime = null;
        this.lastLease.state = 'RELEASED';
        this.lastLease.tries = 0;
        this.emit('released');
        // Send the actual data
        return this.send(this.lastLease.server, ans); // Send release directly to server
    }
    sendRenew() {
        // console.log('Send Renew');
        // TODO: check ans against rfc
        // Formulate the response object
        const ans = Object.assign({}, ansCommon, { chaddr: this.config.getMac(), ciaddr: this.lastLease.server, flags: 0, options: {
                [model_1.OptionId.dhcpMessageType]: model_1.DHCP53Code.DHCPREQUEST,
                [model_1.OptionId.requestedIpAddress]: this.lastLease.address,
                // TODO: MAY clientID
                [model_1.OptionId.server]: this.lastLease.server,
            }, xid: this.lastLease.xid++ });
        this.lastLease.state = 'RENEWING';
        this.lastLease.tries = 0;
        // Send the actual data
        return this.send(this.lastLease.server, ans); // Send release directly to server
    }
    sendRebind() {
        // console.log('Send Rebind');
        // TODO: check ans against rfc
        // Formulate the response object
        const ans = Object.assign({}, ansCommon, { chaddr: this.config.getMac(), ciaddr: this.lastLease.server, flags: 0, options: new DHCPOptions_1.DHCPOptions({
                [model_1.OptionId.dhcpMessageType]: model_1.DHCP53Code.DHCPREQUEST,
                [model_1.OptionId.requestedIpAddress]: this.lastLease.address,
                // TODO: MAY clientID
                [model_1.OptionId.server]: this.lastLease.server,
            }), xid: this.lastLease.xid++ });
        this.lastLease.state = 'REBINDING';
        this.lastLease.tries = 0;
        // TODO: timeout
        // Send the actual data
        return this.send(INADDR_BROADCAST, ans); // Send release directly to server
    }
    listen(port, host) {
        const { socket } = this;
        return new Promise((resolve) => {
            socket.bind(port || CLIENT_PORT, host || INADDR_ANY, () => {
                socket.setBroadcast(true);
                resolve();
            });
        });
    }
    close() {
        const that = this;
        return new Promise((resolve) => that.socket.close(resolve));
    }
    send(host, data) {
        const { socket } = this;
        return new Promise((resolve, reject) => {
            const sb = Protocol.format(data);
            socket.send(sb.buffer, 0, sb.w, SERVER_PORT, host, (err, bytes) => {
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
exports.Client = Client;
//# sourceMappingURL=Client.js.map