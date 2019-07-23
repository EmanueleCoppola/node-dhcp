/* tslint:disable no-console */

import { createSocket, Socket } from 'dgram';
import { EventEmitter } from 'events';
import { DHCPOptions } from './DHCPOptions';
import { Lease } from './Lease';
import { ILeaseStore } from './leaseStore/ILeaseStote';
import { LeaseStoreMemory } from './leaseStore/LeaseStoreMemory';
import { BootCode, DHCP53Code, HardwareType, IDHCPMessage, OptionId } from './model';
import { getDHCPId, optsMeta } from './options';
import { random } from './prime';
import { format, parse } from './protocol';
import { ServerConfig } from './ServerConfig';
import { formatIp, parseIp } from './tools';

const INADDR_ANY = '0.0.0.0';
const SERVER_PORT = 67;
const CLIENT_PORT = 68;

const ansCommon = {
    file: '', // unused
    hlen: 6, // Mac addresses are 6 byte
    hops: 0,
    htype: HardwareType.Ethernet,
    secs: 0, // 0 or seconds since DHCP process started
    sname: '', // unused
};

export class Server extends EventEmitter {
    private socket: Socket | null;
    // Config (cache) object
    private config: ServerConfig;
    // actif Lease
    private leaseState: ILeaseStore;

    constructor(config: ServerConfig, listenOnly?: boolean) {
        super();
        const self = this;
        const socket = createSocket({ type: 'udp4', reuseAddr: true });
        this.config = config;
        this.leaseState = config.leaseState || new LeaseStoreMemory();
        this.socket = socket;

        socket.on('message', async (buf: Buffer) => {
            let request: IDHCPMessage;
            try {
                request = parse(buf);
            } catch (e) {
                return self.emit('error', e);
            }
            if (request.op !== BootCode.BOOTREQUEST)
                return self.emit('error', new Error('Malformed packet'), request);
            if (!request.options[OptionId.dhcpMessageType])
                return self.emit('error', new Error('Got message, without valid message type'), request);

            self.emit('message', request);
            if (listenOnly)
                return;
            try {
                // Handle request
                const mode = request.options[OptionId.dhcpMessageType];
                switch (mode) {
                    case DHCP53Code.DHCPDISCOVER: // 1.
                        return await self.handleDiscover(request);
                    case DHCP53Code.DHCPREQUEST: // 3.
                        return await self.handleRequest(request);
                    case DHCP53Code.DHCPINFORM:
                    default:
                        console.error('Not implemented DHCP 53 Type', request.options[53]);
                }
            } catch (e) {
                console.error(e);
            }
        });
        socket.on('listening', () => self.emit('listening', socket));
        socket.on('close', () => self.emit('close'));
        process.on('SIGINT', () => self.close());
    }

    public getServer(request: IDHCPMessage): string {
        const value = this.config.get(OptionId.server, request) as string;
        if (!value)
            throw Error('server is mandatory in server configuration');
        return value;
    }

    public getConfigBroadcast(request: IDHCPMessage): string {
        const value = this.config.get(OptionId.broadcast, request) as string;
        if (!value)
            throw Error('broadcast is mandatory in server configuration');
        return value;
    }

    public getOptions(request: IDHCPMessage, pre: DHCPOptions, requireds: number[], requested?: Array<number | string>): DHCPOptions {
        for (const required of requireds) {
            // Check if option id actually exists
            if (optsMeta[required] !== undefined) {
                // Take the first config value always
                if (pre[required] === undefined)
                    pre[required] = this.config.get(required, request);
                if (!pre[required])
                    throw new Error(`Required option ${optsMeta[required].config} does not have a value set`);
            } else {
                this.emit('error', `Unknown option ${required}`);
            }
        }

        // Add all values, the user wants, which are not already provided:
        if (requested) {
            for (const optionId of requested) {
                // Check if option id actually exists
                if (optsMeta[optionId]) {
                    // Take the first config value always
                    if (pre[optionId]) {
                        const val = this.config.get(optionId, request);
                        // Add value only, if it's meaningful
                        if (val)
                            pre[optionId] = val;
                    }
                } else {
                    this.emit('error', `Unknown option ${optionId}`);
                }
            }
        }

        // Finally Add all missing and forced options
        const forceOptions = this.config.get('forceOptions', request);
        if (forceOptions instanceof Array) {
            for (const option of forceOptions as Array<string | number>) {
                // Add numeric options right away and look up alias names
                const id = getDHCPId(option);
                // Add option if it is valid and not present yet
                if (id && !pre[id]) {
                    pre[id] = this.config.get(option, request);
                }
            }
        }
        return pre;
    }

    public async selectAddress(clientMAC: string, request: IDHCPMessage): Promise<string> {
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
        const statik = this.config.getStatic();
        const staticResult = statik.getIP(clientMAC, request);
        if (staticResult)
            return staticResult;

        const randIP = this.config.get('randomIP', request);
        const [firstIPstr, lastIPStr] = this.config.get('range', request) as string[];
        const myIPStr = this.getServer(request) as string;

        const staticSerserve = statik.getReservedIP();
        if (this.leaseState.getFreeIP) {
            const strIP = await this.leaseState.getFreeIP(firstIPstr, lastIPStr, [new Set(myIPStr), staticSerserve], randIP);
            if (strIP)
                return strIP;
            throw Error('DHCP is full');
        }

        const firstIP = parseIp(firstIPstr);
        const lastIP = parseIp(lastIPStr);

        const leases = await this.leaseState.size();
        // Check if all IP's are used and delete the oldest
        if (lastIP - firstIP === leases) {
            throw Error('DHCP is full');
        }
        // Exclude our own server IP from pool
        const myIP: number = parseIp(myIPStr);
        // Select a random IP, using prime number iterator
        if (randIP) {
            let total = lastIP - firstIP;
            const p = random(1000, 10000);
            let offset = 0;
            while (total--) {
                offset = (offset + p) % total;
                const ip = firstIP + offset;
                if (ip === myIP)
                    continue;
                const strIP = formatIp(ip);
                if (staticSerserve.has(strIP))
                    continue;
                if (await this.leaseState.hasAddress(strIP))
                    continue;
                return strIP;
            }
        } else {
            // Choose first free IP in subnet
            for (let ip = firstIP; ip <= lastIP; ip++) {
                const strIP = formatIp(ip);
                if (!await this.leaseState.hasAddress(strIP))
                    return strIP;
            }
        }
        throw Error('DHCP is full');
    }

    public async handleDiscover(request: IDHCPMessage): Promise<number> {
        const { chaddr } = request;
        let newLease: boolean = false;
        let lease = await this.leaseState.getLeaseFromMac(chaddr);
        if (!lease) {
            lease = new Lease(chaddr);
            newLease = true;
        }
        lease.address = await this.selectAddress(request.chaddr, request);
        lease.leasePeriod = this.config.get(OptionId.leaseTime, request);
        lease.server = this.getServer(request);
        lease.state = 'OFFERED';
        if (newLease) {
            this.leaseState.add(lease);
        }
        return this.sendOffer(request);
    }

    public async sendOffer(request: IDHCPMessage): Promise<number> {
        // Formulate the response object
        const siaddr = this.getServer(request); // next server in bootstrap. That's us
        const yiaddr = await this.selectAddress(request.chaddr, request); // My offer
        const pre = new DHCPOptions({
            [OptionId.dhcpMessageType]: DHCP53Code.DHCPOFFER,
        });
        const requireds = [OptionId.netmask, OptionId.router, OptionId.leaseTime, OptionId.server, OptionId.dns];
        const requested = request.options[OptionId.dhcpParameterRequestList] as Array<string | number>;

        const options = this.getOptions(request, pre, requireds, requested);
        const ans: IDHCPMessage = {
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

    public async handleRequest(request: IDHCPMessage): Promise<number> {
        const { chaddr } = request;
        let newLease: boolean = false;
        let lease = await this.leaseState.getLeaseFromMac(chaddr);
        if (!lease) {
            lease = new Lease(chaddr);
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

    public async sendAck(request: IDHCPMessage): Promise<number> {
        // console.log('Send ACK');
        // Formulate the response object
        const pre = new DHCPOptions({
            [OptionId.dhcpMessageType]: DHCP53Code.DHCPACK,
        });
        const requireds = [OptionId.netmask, OptionId.router, OptionId.leaseTime, OptionId.server, OptionId.dns];
        const requested = request.options[OptionId.dhcpParameterRequestList] as Array<string | number>;
        const options = this.getOptions(request, pre, requireds, requested);

        const address = await this.selectAddress(request.chaddr, request);

        const ans: IDHCPMessage = {
            op: BootCode.BOOTREPLY,
            ...ansCommon,
            chaddr: request.chaddr, // 'chaddr' from client DHCPREQUEST message
            ciaddr: request.ciaddr,
            flags: request.flags, // 'flags' from client DHCPREQUEST message
            giaddr: request.giaddr, // 'giaddr' from client DHCPREQUEST message
            options,
            siaddr: this.getServer(request), // server ip, that's us
            xid: request.xid, // 'xid' from client DHCPREQUEST message
            yiaddr: address, // my offer
        };
        // this.emit('bound', this.leaseState);
        // Send the actual data
        // INADDR_BROADCAST : 68 <- SERVER_IP : 67
        return this._send(this.getConfigBroadcast(request), ans);
    }

    public sendNak(request: IDHCPMessage): Promise<number> {
        // console.log('Send NAK');
        // Formulate the response object
        const pre = new DHCPOptions({
            [OptionId.dhcpMessageType]: DHCP53Code.DHCPNAK,
        });
        const requireds = [OptionId.server];
        const options = this.getOptions(request, pre, requireds);
        const ans: IDHCPMessage = {
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

    public listen(port?: number, host?: string): Promise<void> {
        const { socket } = this;
        return new Promise((resolve) => {
            socket.bind({ port: port || SERVER_PORT, address: host || INADDR_ANY }, () => {
                socket.setBroadcast(true);
                resolve();
            });
        });
    }

    public close(): Promise<any> {
        const { socket } = this;
        if (!socket)
            return Promise.resolve();
        this.socket = null;
        return new Promise((resolve) => socket.close(resolve));
    }

    private handleRelease() {
        /** TODO */
    }

    private handleRenew() {
        // Send ack
    }

    private _send(host: string, data: IDHCPMessage): Promise<number> {
        const { socket } = this;
        if (!socket)
            throw Error('Socket had bee closed');
        return new Promise((resolve, reject) => {
            const sb = format(data);
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
