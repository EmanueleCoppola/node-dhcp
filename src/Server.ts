import * as dgram from 'dgram';
import { EventEmitter } from 'events';
import { Lease } from './Lease';
import { BootCode, DHCP53Code, DHCPConfig, DHCPMessage, DHCPOption, HardwareType, ServerConfig } from './model';
import * as OptionsModel from './options';
import { random } from './prime';
import * as Protocol from './protocol';
import { formatIp, parseIp } from './tools';

const INADDR_ANY = '0.0.0.0';
const SERVER_PORT = 67;
const CLIENT_PORT = 68;

export type IP = string;

const ansCommon = {
    file: '', // unused
    hlen: 6, // Mac addresses are 6 byte
    hops: 0,
    htype: HardwareType.Ethernet,
    secs: 0, // 0 or seconds since DHCP process started
    sname: '', // unused
};

export class Server extends EventEmitter {
    // Socket handle
    private socket: dgram.Socket;
    // Config (cache) object
    private config: ServerConfig;
    // All mac -> IP mappings, we currently have assigned or blacklisted
    private leaseState: { [key: string]: Lease };

    constructor(config: ServerConfig, listenOnly?: boolean) {
        super();
        const self = this;
        const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        socket.on('message', (buf: Buffer) => {
            let request: DHCPMessage;
            try {
                request = Protocol.parse(buf);
            } catch (e) {
                return self.emit('error', e);
            }
            if (request.op !== BootCode.BOOTREQUEST) {
                return self.emit('error', new Error('Malformed packet'), request);
            }
            if (!request.options[DHCPOption.dhcpMessageType]) {
                return self.emit('error', new Error('Got message, without valid message type'), request);
            }
            self.emit('message', request);
            if (!listenOnly) {
                // Handle request
                const mode = request.options[DHCPOption.dhcpMessageType];
                switch (mode) {
                    case DHCP53Code.DHCPDISCOVER: // 1.
                        self.handleDiscover(request);
                        break;
                    case DHCP53Code.DHCPREQUEST: // 3.
                        self.handleRequest(request);
                        break;
                    default:
                        console.error('Not implemented method', request.options[53]);
                }
            }
        });
        socket.on('listening', () => self.emit('listening', socket));
        socket.on('close', () => self.emit('close'));
        this.socket = socket;
        this.config = config;
        this.leaseState = {};
    }

    public getConfigServer(request: DHCPMessage): string {
        return this.getConfig('server', request) as string;
    }

    public getConfigBroadcast(request: DHCPMessage): string {
        return this.getConfig('broadcast', request) as string;
    }

    public getConfig(key: string, request: DHCPMessage): any {
        const optId: number = OptionsModel.getDHCPId(key);
        // If config setting is set by user
        let val = this.config[key];
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
            const reqOpt = {};
            for (const i in request.options) {
                const opt = OptionsModel.optsMeta[i];
                if (opt.enum) {
                    reqOpt[opt.attr || i] = opt.enum[request.options[i]];
                } else {
                    reqOpt[opt.attr || i] = request.options[i];
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
            for (const i in values)
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
    }

    public getOptions(request: DHCPMessage, pre: DHCPConfig, requireds: number[], requested?: any): DHCPConfig {
        for (const required of requireds) {
            // Check if option id actually exists
            if (OptionsModel.optsMeta[required] !== undefined) {
                // Take the first config value always
                if (pre[required] === undefined)
                    pre[required] = this.getConfig(OptionsModel.optsMeta[required].config, request);
                if (!pre[required])
                    throw new Error(`Required option ${OptionsModel.optsMeta[required].config} does not have a value set`);
            } else {
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
        const forceOptions = this.config.forceOptions;
        if (forceOptions instanceof Array) {
            for (const option of forceOptions) {
                // Add numeric options right away and look up alias names
                const id = OptionsModel.getDHCPId(option);
                // Add option if it is valid and not present yet
                if (id !== undefined && pre[id] === undefined) {
                    pre[id] = this.getConfig(option, request);
                }
            }
        }
        return pre;
    }

    public selectAddress(clientMAC: string, request: DHCPMessage): string {
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
        const staticLeases = this.getConfig('static', request) as { [key: string]: string } | Function;

        if (typeof staticLeases === 'function') {
            const staticResult = staticLeases(clientMAC, request);
            if (staticResult)
                return staticResult;
        } else if (staticLeases[clientMAC]) {
            return staticLeases[clientMAC];
        }

        const randIP = this.getConfig('randomIP', request);
        const [firstIPstr, lastIPStr] = this.getConfig('range', request) as string[];
        const firstIP = parseIp(firstIPstr);
        const lastIP = parseIp(lastIPStr);

        // Add all known addresses and save the oldest lease
        const ipSet: Set<number> = new Set();
        // Exclude our own server IP from pool
        ipSet.add(parseIp(this.getConfigServer(request)));
        let oldestMac: string = null;
        let oldestTime = Infinity;
        let leases = 0;
        for (const mac in this.leaseState) {
            if (this.leaseState[mac].address)
                ipSet.add(parseIp(this.leaseState[mac].address));
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
            const p = random(100, 10000);
            let offset = 0;
            while (total--) {
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
    }

    public handleDiscover(request: DHCPMessage): Promise<number> {
        // console.log('Handle Discover', req);
        const lease = this.leaseState[request.chaddr] = this.leaseState[request.chaddr] || new Lease();
        lease.address = this.selectAddress(request.chaddr, request);
        lease.leasePeriod = this.getConfig('leaseTime', request);
        lease.server = this.getConfigServer(request);
        lease.state = 'OFFERED';
        return this.sendOffer(request);
    }

    public sendOffer(request: DHCPMessage): Promise<number> {
        // console.log('Send Offer');
        // Formulate the response object
        const siaddr = this.getConfigServer(request); // next server in bootstrap. That's us
        const yiaddr = this.selectAddress(request.chaddr, request); // My offer
        const options = this.getOptions(request, {
            [DHCPOption.dhcpMessageType]: DHCP53Code.DHCPOFFER,
        },
            [DHCPOption.netmask, DHCPOption.router, DHCPOption.leaseTime, DHCPOption.server, DHCPOption.dns],
            request.options[DHCPOption.dhcpParameterRequestList]);
        const ans: DHCPMessage = {
            op: BootCode.BOOTREPLY,
            ...ansCommon,
            chaddr: request.chaddr, // Client mac address
            ciaddr: INADDR_ANY,
            flags: request.flags,
            giaddr: request.giaddr,
            options,
            siaddr,
            xid: request.xid, // 'xid' from client DHCPDISCOVER message
            yiaddr,
        };
        // Send the actual data
        // INADDR_BROADCAST : 68 <- SERVER_IP : 67
        const broadcast = this.getConfigBroadcast(request);
        return this._send(broadcast, ans);
    }

    public handleRequest(request: DHCPMessage): Promise<number> {
        // console.log('Handle Request', req);
        const lease = this.leaseState[request.chaddr] = this.leaseState[request.chaddr] || new Lease();
        lease.address = this.selectAddress(request.chaddr, request);
        lease.leasePeriod = this.getConfig('leaseTime', request);
        lease.server = this.getConfigServer(request);
        lease.state = 'BOUND';
        lease.bindTime = new Date();
        return this.sendAck(request);
    }

    public sendAck(request: DHCPMessage): Promise<number> {
        // console.log('Send ACK');
        // Formulate the response object
        const options = this.getOptions(request, {
            [DHCPOption.dhcpMessageType]: DHCP53Code.DHCPACK,
        },
            [DHCPOption.netmask, DHCPOption.router, DHCPOption.leaseTime, DHCPOption.server, DHCPOption.dns],
            request.options[DHCPOption.dhcpParameterRequestList]);
        const ans: DHCPMessage = {
            op: BootCode.BOOTREPLY,
            ...ansCommon,
            chaddr: request.chaddr, // 'chaddr' from client DHCPREQUEST message
            ciaddr: request.ciaddr,
            flags: request.flags, // 'flags' from client DHCPREQUEST message
            giaddr: request.giaddr, // 'giaddr' from client DHCPREQUEST message
            options,
            siaddr: this.getConfigServer(request), // server ip, that's us
            xid: request.xid, // 'xid' from client DHCPREQUEST message
            yiaddr: this.selectAddress(request.chaddr, request), // my offer
        };
        this.emit('bound', this.leaseState);
        // Send the actual data
        // INADDR_BROADCAST : 68 <- SERVER_IP : 67
        return this._send(this.getConfigBroadcast(request), ans);
    }

    public sendNak(request: DHCPMessage): Promise<number> {
        // console.log('Send NAK');
        // Formulate the response object
        const options = this.getOptions(request, {
            [DHCPOption.dhcpMessageType]: DHCP53Code.DHCPNAK,
        },
            [DHCPOption.server]);
        const ans: DHCPMessage = {
            ...ansCommon,
            chaddr: request.chaddr, // 'chaddr' from client DHCPREQUEST message
            ciaddr: INADDR_ANY,
            flags: request.flags, // 'flags' from client DHCPREQUEST message
            giaddr: request.giaddr, // 'giaddr' from client DHCPREQUEST message
            op: BootCode.BOOTREPLY,
            options,
            siaddr: INADDR_ANY,
            xid: request.xid, // 'xid' from client DHCPREQUEST message
            yiaddr: INADDR_ANY,
        };
        // Send the actual data
        return this._send(this.getConfigBroadcast(request), ans);
    }

    public listen(port: number, host: string): Promise<void> {
        const { socket } = this;
        return new Promise((resolve) => {
            socket.bind(port || SERVER_PORT, host || INADDR_ANY, () => {
                socket.setBroadcast(true);
                resolve();
            });
        });
    }

    public close(): Promise<any> {
        const that = this;
        return new Promise((resolve) => that.socket.close(resolve));
    }

    private handleRelease() {
        /** TODO */
    }

    private handleRenew() {
        // Send ack
    }

    private _send(host: string, data: DHCPMessage): Promise<number> {
        const { socket } = this;
        return new Promise((resolve, reject) => {
            const sb = Protocol.format(data);
            socket.send(sb.buffer, 0, sb.w, CLIENT_PORT, host, (err, bytes) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(bytes);
                }
            });
        });
    }
}
