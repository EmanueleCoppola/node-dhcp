import { EventEmitter } from "events";
import * as Protocol from './protocol';
import * as dgram from 'dgram';
import * as OptionsModel from './options';
import { DHCP53Code, BootCode, DHCPMessage, HardwareType, ServerConfig, DHCPOption, DHCPConfig } from './model';
import { parseIp, formatIp } from './tools';
import { Lease } from "./Lease";
import { random } from "./prime";

const INADDR_ANY = '0.0.0.0';
const SERVER_PORT = 67;
const CLIENT_PORT = 68;

export type IP = string;

const ansCommon = {
    htype: HardwareType.Ethernet,
    hlen: 6, // Mac addresses are 6 byte
    hops: 0,
    secs: 0, // 0 or seconds since DHCP process started
    sname: '', // unused
    file: '', // unused
}

export class Server extends EventEmitter {
    // Socket handle
    private socket: dgram.Socket;
    // Config (cache) object
    _conf: ServerConfig;
    // All mac -> IP mappings, we currently have assigned or blacklisted
    _state: any;

    constructor(config: ServerConfig, listenOnly?: boolean) {
        super()
        const self = this;
        const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        socket.on('message', (buf: Buffer) => {
            let req: DHCPMessage;
            try {
                req = Protocol.parse(buf);
            } catch (e) {
                return self.emit('error', e);
            }
            if (req.op !== BootCode.BOOTREQUEST) {
                return self.emit('error', new Error('Malformed packet'), req);
            }
            if (!req.options[DHCPOption.dhcpMessageType]) {
                return self.emit('error', new Error('Got message, without valid message type'), req);
            }
            self.emit('message', req);
            if (!listenOnly) {
                // Handle request
                const mode = req.options[DHCPOption.dhcpMessageType]
                switch (mode) {
                    case DHCP53Code.DHCPDISCOVER: // 1.
                        self.handleDiscover(req);
                        break;
                    case DHCP53Code.DHCPREQUEST: // 3.
                        self.handleRequest(req);
                        break;
                    default:
                        console.error("Not implemented method", req.options[53]);
                }
            }
        });
        socket.on('listening', () => self.emit('listening', socket));
        socket.on('close', () => self.emit('close'));
        this.socket = socket;
        this._conf = config;
        this._state = {};
    }

    public getConfigServer(req: DHCPMessage): string {
        return <string>this.getConfig('server', req);
    }
    
    public getConfigBroadcast(req: DHCPMessage): string {
        return <string>this.getConfig('broadcast', req);
    }

    public getConfig(key: string, req: DHCPMessage): any {
        const optId: number = OptionsModel.getDHCPId(key);
        // If config setting is set by user
        let val = this._conf[key];
        if (val === undefined) {
            if (!OptionsModel.optsMeta[optId])
                throw new Error('Invalid option ' + key);
            val = OptionsModel.optsMeta[optId].default;
            if (val === undefined)
                return 0;
        }

        // If a function was provided
        // TODO change Function format
        if (val instanceof Function) {
            let reqOpt = {};
            for (let i in req.options) {
                let opt = OptionsModel.optsMeta[i];
                if (opt.enum) {
                    reqOpt[opt.attr || i] = opt.enum[req.options[i]];
                } else {
                    reqOpt[opt.attr || i] = req.options[i];
                }
            }
            val = val.call(this, reqOpt);
        }

        if (key !== 'range' && key !== 'static' && key !== 'randomIP')
            return val;

        // If the option has an "enum" attribute:
        if (OptionsModel.optsMeta[optId].enum) {
            const values = OptionsModel.optsMeta[optId].enum;
            // Check if value is an actual enum string
            for (let i in values)
                if (values[i] === val)
                    return Number(i);
            // Okay, check  if it is the numeral value of the enum
            if (values[val] === undefined) {
                throw new Error(`Provided enum value for ${key} is not valid`);
            } else {
                val = Number(val);
            }
        }
        return val;
    };

    private getOptions(req: DHCPMessage, pre: DHCPConfig, requireds: number[], requested?: any): DHCPConfig {
        for (let required of requireds) {
            // Check if option id actually exists
            if (OptionsModel.optsMeta[required] !== undefined) {
                // Take the first config value always
                if (pre[required] === undefined)
                    pre[required] = this.getConfig(OptionsModel.optsMeta[required].config, req);
                if (!pre[required])
                    throw new Error(`Required option ${OptionsModel.optsMeta[required].config} does not have a value set`);
            } else {
                this.emit('error', `Unknown option ${required}`);
            }
        }

        // Add all values, the user wants, which are not already provided:
        if (requested) {
            for (let req of requested) {
                // Check if option id actually exists
                if (OptionsModel.optsMeta[req] !== undefined) {
                    // Take the first config value always
                    if (pre[req] === undefined) {
                        const val = this.getConfig(OptionsModel.optsMeta[req].config, req);
                        // Add value only, if it's meaningful
                        if (val)
                            pre[req] = val;
                    }
                } else {
                    this.emit('error', `Unknown option ${req}`);
                }
            }
        }

        // Finally Add all missing and forced options
        const forceOptions = this._conf.forceOptions;
        if (forceOptions instanceof Array) {
            for (let option of forceOptions) {
                // Add numeric options right away and look up alias names
                let id = OptionsModel.getDHCPId(option);
                // Add option if it is valid and not present yet
                if (id !== undefined && pre[id] === undefined) {
                    pre[id] = this.getConfig(option, req);
                }
            }
        }
        return pre;
    };

    private selectAddress(clientMAC: string, req: DHCPMessage): string {
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
        if (this._state[clientMAC] && this._state[clientMAC].address) {
            return this._state[clientMAC].address;
        }

        // Is there a static binding?
        const _static = <{ [key: string]: string } | Function>this.getConfig('static', req);

        if (typeof _static === "function") {
            const staticResult = _static(clientMAC, req);
            if (staticResult)
                return staticResult;
        } else if (_static[clientMAC]) {
            return _static[clientMAC];
        }

        const randIP = this.getConfig('randomIP', req);
        const [firstIPstr, lastIPStr] = <string[]>this.getConfig('range', req);
        const firstIP = parseIp(firstIPstr);
        const lastIP = parseIp(lastIPStr);

        // Add all known addresses and save the oldest lease
        const ipSet: Set<number> = new Set();
        // Exclude our own server IP from pool
        ipSet.add(parseIp(this.getConfigServer(req)));
        let oldestMac = null;
        let oldestTime = Infinity;
        let leases = 0;
        for (let mac in this._state) {
            if (this._state[mac].address)
                ipSet.add(parseIp(this._state[mac].address));
            if (this._state[mac].leaseTime < oldestTime) {
                oldestTime = this._state[mac].leaseTime;
                oldestMac = mac;
            }
            leases++;
        }

        // Check if all IP's are used and delete the oldest
        if (oldestMac !== null && lastIP - firstIP === leases) {
            const ip = this._state[oldestMac].address;
            // TODO: Notify deleted client
            delete this._state[oldestMac];
            return ip;
        }

        // Select a random IP, using prime number iterator
        if (randIP) {
            let total = lastIP - firstIP;
            let p = random(100, 10000);
            let offset = 0;
            while (p--) {
                offset = (offset + p) % total;
                const ip = firstIP + offset;
                if (!ipSet.has(ip))
                    return formatIp(ip);
            }
            console.error('no More IP available');
        }

        // Choose first free IP in subnet
        for (let i = firstIP; i <= lastIP; i++) {
            if (!ipSet.has(i))
                return formatIp(i);
        }
    };

    handleDiscover(req: DHCPMessage): Promise<number> {
        //console.log('Handle Discover', req);
        const lease = this._state[req.chaddr] = this._state[req.chaddr] || new Lease();
        lease.address = this.selectAddress(req.chaddr, req);
        lease.leasePeriod = this.getConfig('leaseTime', req);
        lease.server = this.getConfigServer(req);
        lease.state = 'OFFERED';
        return this.sendOffer(req);
    };

    sendOffer(req: DHCPMessage): Promise<number> {
        //console.log('Send Offer');
        // Formulate the response object
        const siaddr = this.getConfigServer(req); // next server in bootstrap. That's us
        const yiaddr = this.selectAddress(req.chaddr, req); // My offer
        const options = this.getOptions(req, {
            [DHCPOption.dhcpMessageType]: DHCP53Code.DHCPOFFER
        },
            [DHCPOption.netmask, DHCPOption.router, DHCPOption.leaseTime, DHCPOption.server, DHCPOption.dns],
            req.options[DHCPOption.dhcpParameterRequestList]);
        const ans: DHCPMessage = {
            op: BootCode.BOOTREPLY,
            ...ansCommon,
            xid: req.xid, // 'xid' from client DHCPDISCOVER message
            flags: req.flags,
            ciaddr: INADDR_ANY,
            yiaddr,
            siaddr,
            giaddr: req.giaddr,
            chaddr: req.chaddr, // Client mac address
            options
        };
        // Send the actual data
        // INADDR_BROADCAST : 68 <- SERVER_IP : 67
        const broadcast = this.getConfigBroadcast(req);
        return this._send(broadcast, ans);
    };

    handleRequest(req: DHCPMessage): Promise<number> {
        //console.log('Handle Request', req);
        const lease = this._state[req.chaddr] = this._state[req.chaddr] || new Lease();
        lease.address = this.selectAddress(req.chaddr, req);
        lease.leasePeriod = this.getConfig('leaseTime', req);
        lease.server = this.getConfigServer(req);
        lease.state = 'BOUND';
        lease.bindTime = new Date();
        return this.sendAck(req);
    };

    sendAck(req: DHCPMessage): Promise<number> {
        //console.log('Send ACK');
        // Formulate the response object
        const ans: DHCPMessage = {
            op: BootCode.BOOTREPLY,
            ...ansCommon,
            xid: req.xid, // 'xid' from client DHCPREQUEST message
            flags: req.flags, // 'flags' from client DHCPREQUEST message
            ciaddr: req.ciaddr,
            yiaddr: this.selectAddress(req.chaddr, req), // my offer
            siaddr: this.getConfigServer(req), // server ip, that's us
            giaddr: req.giaddr, // 'giaddr' from client DHCPREQUEST message
            chaddr: req.chaddr, // 'chaddr' from client DHCPREQUEST message
            options: this.getOptions(req, {
                [DHCPOption.dhcpMessageType]: DHCP53Code.DHCPACK
            },
                [DHCPOption.netmask, DHCPOption.router, DHCPOption.leaseTime, DHCPOption.server, DHCPOption.dns],
                req.options[DHCPOption.dhcpParameterRequestList])
        };
        this.emit('bound', this._state);
        // Send the actual data
        // INADDR_BROADCAST : 68 <- SERVER_IP : 67
        return this._send(this.getConfigBroadcast(req), ans);
    };

    sendNak(req: DHCPMessage): Promise<number> {
        //console.log('Send NAK');
        // Formulate the response object
        const ans: DHCPMessage = {
            ...ansCommon,
            op: BootCode.BOOTREPLY,
            xid: req.xid, // 'xid' from client DHCPREQUEST message
            flags: req.flags, // 'flags' from client DHCPREQUEST message
            ciaddr: INADDR_ANY,
            yiaddr: INADDR_ANY,
            siaddr: INADDR_ANY,
            giaddr: req.giaddr, // 'giaddr' from client DHCPREQUEST message
            chaddr: req.chaddr, // 'chaddr' from client DHCPREQUEST message
            options: this.getOptions(req, {
                [DHCPOption.dhcpMessageType]: DHCP53Code.DHCPNAK
            },
                [DHCPOption.server])
        };
        // Send the actual data
        return this._send(this.getConfigBroadcast(req), ans);
    };

    handleRelease() {
    };

    handleRenew() {
        // Send ack
    };

    listen(port: number, host: string): Promise<void> {
        const {socket} = this;
        return new Promise(resolve => {
            socket.bind(port || SERVER_PORT, host || INADDR_ANY, () => {
                socket.setBroadcast(true);
                resolve();
            });
        })
    };

    close(): Promise<any> {
        let that = this;
        return new Promise(resolve => that.socket.close(resolve));
    };

    _send(host: string, data: DHCPMessage): Promise<number> {
        const {socket} = this;
        return new Promise((resolve, reject) => {
            const sb = Protocol.format(data);
            socket.send(sb.buffer, 0, sb.w, CLIENT_PORT, host, (err, bytes) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(bytes);
                }
            });
        })
    }
};
