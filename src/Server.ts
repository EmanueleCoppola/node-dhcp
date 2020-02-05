/* tslint:disable no-console */
import { createSocket, Socket, RemoteInfo } from "dgram";
import { EventEmitter } from "events";
import { ILeaseLive } from "./leaseLive";
import { ILeaseLiveStore, LeaseLiveStoreMemory } from "./leaseLive";
import { ILeaseOfferStore, LeaseOfferStoreMemory } from "./leaseOffer";
import { ILeaseStaticStore, LeaseStaticStoreMemory } from "./leaseStatic";
import { BootCode, DHCP53Code, HardwareType, IDHCPMessage, IOptionsId, OptionId, IpConfiguration } from "./model";
import { getDHCPId, getDHCPName, getOptsMeta, IOptionMetaMap } from "./options";
import { random } from "./prime";
import { format, parse } from "./protocol";
import { IServerConfigValid } from "./ServerConfig";
import Tools from "./tools";
import { IpRange } from "./IpRange";

const INADDR_ANY = "0.0.0.0";
const SERVER_PORT = 67;
const CLIENT_PORT = 68;

// npm install --save @saleae/ffi
// const ffi = require('@saleae/ffi');
// const current = ffi.Library(null, {
//    'setsockopt': ['int', ['int', 'int', 'int', 'string', 'int']]
// });
// npm install --save raw-socket
// const raw = require ("raw-socket");


/**
 * helper to build DHCPresponse
 * prefill responce with common data
 */
function toResponse(request: IDHCPMessage, options: IOptionsId): IDHCPMessage {
    return {
        op: BootCode.BOOTREPLY,
        htype: HardwareType.Ethernet,
        hlen: 6, // Mac addresses are 6 byte
        hops: 0,
        xid: request.xid, // 'xid' from client DHCPDISCOVER message
        secs: 0, // 0 or seconds since DHCP process started
        flags: request.flags,
        // ciaddr
        // yiaddr
        // siaddr
        giaddr: request.giaddr,
        chaddr: request.chaddr, // Client mac address
        sname: "",
        file: "",
        options,
    } as IDHCPMessage;
}

function getParameterRequestList(request: IDHCPMessage): Set<number> | undefined {
    const requested = request.options[OptionId.dhcpParameterRequestList];
    if (!requested)
        return;
    return new Set(requested);
}

export interface IServerEvents {
    on(event: "offer", listener: (request: IDHCPMessage, response: IDHCPMessage) => void): this;
    on(event: "bound", listener: (request: IDHCPMessage, bound: ILeaseLive) => void): this;
    on(event: "error", listener: (error: Error) => void): this;
    on(event: "warning", listener: (error: string) => void): this;
    on(event: "listening", listener: (socket: Socket) => void): this;
    on(event: "message" | "notImplemented", listener: (message: IDHCPMessage) => void): this;
    on(event: "close", listener: () => void): this;

    once(event: "offer", listener: (request: IDHCPMessage, response: IDHCPMessage) => void): this;
    once(event: "bound", listener: (request: IDHCPMessage, bound: ILeaseLive) => void): this;
    once(event: "error", listener: (error: Error) => void): this;
    once(event: "warning", listener: (error: string) => void): this;
    once(event: "listening", listener: (socket: Socket) => void): this;
    once(event: "message" | "notImplemented", listener: (message: IDHCPMessage) => void): this;
    once(event: "close", listener: () => void): this;
}

/**
 * Mains DHCP server class
 */
export class Server extends EventEmitter implements IServerEvents {
    private socketIn: Socket | null;
    // is null by default, but can be enabled by calling listenOut
    private socketOut: Socket | null;
    // Config (cache) object
    private config: IServerConfigValid;
    // actif Lease
    private leaseStatic: ILeaseStaticStore;
    private leaseLive: ILeaseLiveStore;
    private leaseOffer: ILeaseOfferStore;
    private optsMeta: IOptionMetaMap;

    constructor(config: IServerConfigValid, listenOnly?: boolean) {
        super();
        const self = this;
        // const socket = createSocket({ type: "udp4", reuseAddr: true });
        this.config = config;
        this.leaseLive = config.leaseLive || new LeaseLiveStoreMemory();
        this.leaseOffer = config.leaseOffer || new LeaseOfferStoreMemory();
        this.leaseStatic = config.leaseStatic || new LeaseStaticStoreMemory({});
        // enable SO_REUSEADDR and SO_REUSEPORT
        this.socketIn = createSocket({ type: "udp4", reuseAddr: true });
        this.socketOut = null;
        //createSocket({ type: "udp4", reuseAddr: true });
        //this.socketIn = raw.createSocket({
        //    addressFamily: raw.AddressFamily.IPv4,
        //    protocol: raw.Protocol.UDP,
        //    bufferSize: 4096,
        //    generateChecksums: false,
        //    checksumOffset: 0});
        //if (!this.socketIn)
        //    throw Error('Failed to Create socket');
        //this.socketOut = raw.createSocket({type: "udp4", reuseAddr: true});

        this.optsMeta = getOptsMeta(this);

        this.socketIn.on("message", async (buf: Buffer) => {
            let request: IDHCPMessage;
            try {
                request = parse(buf);
            } catch (e) {
                return self.emit("error", e);
            }
            if (request.op !== BootCode.BOOTREQUEST)
                return self.emit("error", new Error("Malformed packet"), request);
            if (!request.options[OptionId.dhcpMessageType])
                return self.emit("error", new Error("Got message, without valid message type"), request);
            self.emit("message", request);
            if (listenOnly)
                return;
            try {
                // Handle request
                const mode = request.options[OptionId.dhcpMessageType];
                switch (mode) {
                    case DHCP53Code.DHCPDISCOVER: // 1
                        return await self.handle_Discover(request);
                    case DHCP53Code.DHCPOFFER: // 2,
                        return; // nothink to do with incomming offer
                    case DHCP53Code.DHCPREQUEST: // 3
                        return await self.handle_Request(request);
                    case DHCP53Code.DHCPACK: // 5,
                        return; // nothink to do with incomming ACK
                    case DHCP53Code.DHCPNAK: // 6,
                        return; // nothink to do with incomming NAK
                    case DHCP53Code.DHCPRELEASE: // 7
                        return await self.handle_Release(request);
                    case DHCP53Code.DHCPINFORM: // 8
                        this.emit("notImplemented", "DHCPINFORM");
                        return;
                    case DHCP53Code.DHCPDECLINE: // 4
                        this.emit("notImplemented", "DHCPDECLINE");
                        return;
                    default:
                        this.emit("error", request);
                }
            } catch (e) {
                this.emit("error", e);
            }
        });
        this.socketIn.on("listening", () => {
            /*const iface = 'intel3';
            if (iface) {
                const SOL_SOCKET = 1;
                const SO_BINDTODEVICE = 25;
                console.dir(this.socketIn);
                let fd = (this.socketIn as any)._handle.fd;
                var r = current.setsockopt(fd, SOL_SOCKET, SO_BINDTODEVICE, iface, 4);
                if (r === -1)
                    throw new Error("getsockopt(SO_BINDTODEVICE) error " + r);
            }
            */
            self.emit("listening", this.socketIn)
        });
        this.socketIn.on("close", () => self.emit("close"));
        // process.on("SIGINT", () => self.close());
    }

    public getServer(request: IDHCPMessage): string {
        const value = this.getC(OptionId.server, request) as string;
        if (!value)
            throw Error("server is mandatory in server configuration");
        return value;
    }

    public getConfigBroadcast(request: IDHCPMessage): string {
        const value = this.getC(OptionId.broadcast, request) as string;
        if (!value)
            throw Error("broadcast is mandatory in server configuration");
        return value;
    }

    public validOption(optionId: number) {
        if (this.optsMeta[optionId])
            return true;
        this.emit("warning", `Unknown Type for option ${optionId}, add this type in options.ts`);
        return false;
    }

    public getOptions(request: IDHCPMessage, pre: IOptionsId, customOpts: IOptionsId, requireds: number[], requested?: Set<number>): IOptionsId {
        // Check if option id actually exists
        customOpts = customOpts || {};
        // requested = requested || [];
        // drop non exiting options
        for (const optionId of requireds) {
            if (pre[optionId] !== undefined)
                continue;
            let val = customOpts[optionId];
            if (!val)
                val = this.getC(optionId, request);
            if (val)
                pre[optionId] = val;
            else
                throw new Error(`Required option ${this.optsMeta[optionId].config} does not have a value set`);
        }

        // Add all values, the user wants, which are not already provided:
        if (requested)
        for (const optionId of requested) {
            if (this.validOption(optionId))
                continue;
            if (pre[optionId] !== undefined)
                continue;
            let val = customOpts[optionId];
            if (!val)
                val = this.getC(optionId, request);
            if (val)
                pre[optionId] = val;
            else {
                if (this.listenerCount("warning")) {
                    const name = getDHCPName(optionId);
                    if (name)
                        this.emit("warning", `No value for option ${name} (${optionId}) in config for ${request.chaddr}`);
                    else
                        this.emit("warning", `No value for option ${optionId} in config for ${request.chaddr}`);
                }
            }
        }

        // Finally Add all missing and forced options
        const forceOptions = this.getForceOptions(request);
        for (const optionId of forceOptions) {
            if (pre[optionId] !== undefined)
                continue;
            let val = customOpts[optionId];
            if (!val)
                val = this.getC(optionId, request);
            if (val)
                (pre as any)[optionId] = val;
            // if (!pre[optionId])
            //    pre[optionId] = this.getC(optionId, request);
        }
        return pre;
    }

    public async selectAddress(clientMAC: string, request: IDHCPMessage): Promise<IpConfiguration> {
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
            return this.getRange(request).fill(l1.address);
        }

        /**
         * find a free IP
         */
        const randIP = this.getRandomIP(request);
        const ranges = this.getRange(request);
        const myIPStr = this.getServer(request);

        const staticSerserve = this.leaseStatic.getReservedIP();
        if (this.leaseLive.getFreeIP) {
            const strIP = await this.leaseLive.getFreeIP(ranges, [new Set(myIPStr), staticSerserve], randIP);
            if (strIP)
                return strIP;
            throw Error("DHCP is full");
        }

        //const firstIP = Tools.parseIp(firstIPstr);
        //const lastIP = Tools.parseIp(lastIPStr);

        // Exclude our own server IP from pool
        const myIP: number = Tools.parseIp(myIPStr);
        // Select a random IP, using prime number iterator
        let total = ranges.size();
        if (randIP) {
            const p = random(1000, 10000);
            let offset = 0;
            while (total--) {
                offset = (offset + p) % total;
                const ip = ranges.getIPNum(offset);
                if (ip === myIP)
                    continue;
                const strIP = Tools.formatIp(ip);
                if (staticSerserve.has(strIP))
                    continue;
                if (await this.leaseLive.hasAddress(strIP))
                    continue;
                return this.getRange(request).fill(strIP);
            }
        } else {
            // Choose first free IP in subnet
            for (let offset = 0; offset < total; offset++) {
                const strIP = ranges.getIPStr(offset);
                if (!await this.leaseLive.hasAddress(strIP))
                    return this.getRange(request).fill(strIP);
            }
        }
        throw Error("DHCP is full");
    }

    public async handle_Discover(request: IDHCPMessage): Promise<number> {
        const { chaddr } = request;
        const myIPStr = this.getServer(request);
        let nextLease: boolean = false;
        let lease = await this.leaseLive.getLeaseFromMac(chaddr);
        if (lease) {
            // extand lease time
            lease.expiration = this.genExpiration(request);
            await this.leaseLive.updateLease(lease);
        } else {
            lease = this.newLease(request);
            nextLease = true;
        }
        const staticLease = this.leaseStatic.getLeaseFromMac(request.chaddr, request);
        let customOpts: IOptionsId = {};

        let ipConf: IpConfiguration | undefined;
        if (staticLease) {
            lease.address = staticLease.address;
            customOpts = staticLease.options || {};
        } else {
            let requestedIpAddress = request.options[OptionId.requestedIpAddress];
            if (requestedIpAddress) {
                const usedLive = await this.leaseLive.hasAddress(requestedIpAddress);
                const usedStatic = this.leaseStatic.hasAddress(requestedIpAddress);
                const usedMe = myIPStr === requestedIpAddress;
                if (usedMe || usedStatic || usedLive)
                    requestedIpAddress = undefined;
            }
            if (requestedIpAddress) {
                lease.address = requestedIpAddress;
            } else {
                ipConf = await this.selectAddress(request.chaddr, request);
                lease.address = ipConf.ip;
            }
        }
        if (nextLease) {
            this.leaseOffer.add(lease);
        }

        const requireds = [OptionId.netmask, OptionId.router, OptionId.leaseTime, OptionId.server, OptionId.dns];
        const requested = getParameterRequestList(request);

        let broadcast = this.getConfigBroadcast(request);

        const pre = { [OptionId.dhcpMessageType]: DHCP53Code.DHCPOFFER };
        if (ipConf) {
            if (ipConf.broadcast) {
                broadcast = ipConf.broadcast;
                if (requested?.has(OptionId.broadcast))
                    pre[OptionId.broadcast] = ipConf.broadcast;
            }
            if (ipConf.netmask)
                pre[OptionId.netmask] = ipConf.netmask;
            if (ipConf.router)
                pre[OptionId.router] = ipConf.router;
        }

        const options = this.getOptions(request, pre, customOpts, requireds, requested);
        const ans = toResponse(request, options);
        ans.ciaddr = INADDR_ANY;
        ans.yiaddr = lease.address;
        ans.siaddr = this.getServer(request); // next server in bootstrap. That's us;
        // Send the actual data
        // INADDR_BROADCAST : 68 <- SERVER_IP : 67
        this.emit("offer", request, ans);
        // console.log(`${chaddr} offering ${lease.address} ${debug} GW: ${ans.options[54]} for ${ans.options[OptionId.leaseTime]} sec`); // debug
        return this._send(broadcast, ans);
    }

    public async handle_Request(request: IDHCPMessage): Promise<number> {
        const { chaddr } = request;
        let nextLease: boolean = false;
        // from currently offered lease

        let lease = this.leaseOffer.pop(chaddr);
        if (lease) {
            nextLease = true;
        }
        if (!lease) {
            lease = await this.leaseLive.getLeaseFromMac(chaddr);
            // nextLease = true;
        } else if (!lease) {
            const hn = request.options[OptionId.hostname];
            const to = this.leaseOffer.getTimeOut();
            this.emit("error", Error(`Get request from ${chaddr} (${hn}) for an non existing lease, you may extend offer timeout (${to})`));
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
            const hn = request.options[OptionId.hostname];
            const to = this.leaseOffer.getTimeOut();
            this.emit("error", Error(`Get request from ${chaddr} (${hn}) for an non existing lease, you may extend offer timeout (${to})`));
            return 0;
        }

        let ipConf: IpConfiguration | undefined;
        const staticLease = this.leaseStatic.getLeaseFromMac(request.chaddr, request);
        let customOpts: IOptionsId = {};
        if (staticLease) {
            lease.address = staticLease.address;
            customOpts = staticLease.options || {};
        } else {
            ipConf = await this.selectAddress(chaddr, request);
            lease.address = ipConf.ip;
        }
        if (nextLease) {
            this.leaseLive.add(lease);
        }
        const pre = { [OptionId.dhcpMessageType]: DHCP53Code.DHCPACK };
        const requireds = [OptionId.netmask, OptionId.router, OptionId.leaseTime, OptionId.server, OptionId.dns];
        const requested = getParameterRequestList(request);

        if (ipConf) {
            if (ipConf.broadcast) {
                if (requested?.has(OptionId.broadcast))
                    pre[OptionId.broadcast] = ipConf.broadcast;
            }
            if (ipConf.netmask) // mandatory
                pre[OptionId.netmask] = ipConf.netmask;
            if (ipConf.router) // mandatory
                pre[OptionId.router] = ipConf.router;
        }

        const options = this.getOptions(request, pre, customOpts, requireds, requested);
        const ans = toResponse(request, options);
        ans.ciaddr = request.ciaddr;
        ans.yiaddr = lease.address;
        ans.siaddr = this.getServer(request); // server ip, that's us
        this.emit("bound", request, lease);
        // Send the actual data
        // INADDR_BROADCAST : 68 <- SERVER_IP : 67
        console.log(`Request ${ans.yiaddr} to ${chaddr} GW: ${ans.options[54]}`); // debug

        return this._send(this.getConfigBroadcast(request), ans);
    }

    public async handle_Release(request: IDHCPMessage): Promise<number> {
        const { chaddr } = request;
        this.leaseOffer.pop(chaddr);
        this.leaseLive.release(chaddr);
        const pre = { [OptionId.dhcpMessageType]: DHCP53Code.DHCPACK };
        const requireds = [OptionId.server];
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
    public sendNak(request: IDHCPMessage): Promise<number> {
        const pre = { [OptionId.dhcpMessageType]: DHCP53Code.DHCPNAK };
        const requireds = [OptionId.server];
        const options = this.getOptions(request, pre, {}, requireds);
        const ans = toResponse(request, options);
        ans.ciaddr = INADDR_ANY;
        ans.yiaddr = INADDR_ANY;
        ans.siaddr = INADDR_ANY;
        // Send the actual data
        return this._send(this.getConfigBroadcast(request), ans);
    }

    public async listen(port?: number, host?: string, iface?: string): Promise<void> {
        // await this.listenOut(port, host);
        await this.listenIn(port, host, iface);
    }
    /**
     * https://github.com/infusion/node-dhcp/issues/37
     * see void  bindtodevice(char *device, int fd) from dnsmask
     */
    public async listenIn(port?: number, host?: string, iface?: string): Promise<void> {
        const { socketIn } = this;
        if (!socketIn)
            throw Error("Socket had been destry!");
        await new Promise((resolve) => {
            socketIn.bind({ port: port || SERVER_PORT, address: host || INADDR_ANY }, () => {
                socketIn.setBroadcast(true);
                resolve();
            });
        });
    }

    public async listenOut(port?: number, host?: string): Promise<void> {
        if (!this.socketOut) {
            this.socketOut = createSocket({ type: "udp4", reuseAddr: true });
        }
        const { socketOut } = this;
        if (!socketOut)
            throw Error("Socket had been destry!");
        await new Promise((resolve) => {
            socketOut.bind({ port: port || SERVER_PORT, address: host || INADDR_ANY }, () => {
                socketOut.setBroadcast(true);
                resolve();
            });
        });
    }

    public async close(): Promise<any> {
        const { socketIn } = this;
        this.socketIn = null;
        if (socketIn)
            await new Promise((resolve) => socketIn.close(resolve));
        const { socketOut } = this;
        this.socketOut = null;
        if (socketOut)
            await new Promise((resolve) => socketOut.close(resolve));
    }

    /**
     * @param key the request Key or optionId
     * @param requested the remote Options
     */
    public getC(key: OptionId, requested?: IDHCPMessage): any {
        const n = getDHCPId(key);
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

    public getRange(requested: IDHCPMessage): IpRange {
        const val = this.config.range;
        if (typeof val === "function")
            return val(requested);
        return val;
    }

    public getForceOptions(requested: IDHCPMessage): OptionId[] {
        return this.config.forceOptions || [];
    }

    public getRandomIP(requested: IDHCPMessage): boolean {
        const val = this.config.randomIP;
        if (typeof val === "function")
            return val(requested);
        return val;
    }

    private newLease(request: IDHCPMessage): ILeaseLive {
        const { chaddr } = request;
        const name = request.options[OptionId.hostname] || "";
        const expiration = this.genExpiration(request);
        return { address: "", mac: chaddr, name: name as string, expiration };
    }

    private genExpiration(request: IDHCPMessage): number {
        return this.getC(OptionId.leaseTime, request) + Math.round(new Date().getTime() / 1000);
    }

    private _send(host: string, data: IDHCPMessage): Promise<number> {
        const socket = this.socketOut || this.socketIn;
        if (!socket)
            throw Error("Socket had bee closed");
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
