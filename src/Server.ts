/* tslint:disable no-console */
import { createSocket, Socket } from "dgram";
import { EventEmitter } from "events";
import { ILeaseLive } from "./leaseLive";
import { ILeaseLiveStore, LeaseLiveStoreMemory } from "./leaseLive";
import { ILeaseOfferStore, LeaseOfferStoreMemory } from "./leaseOffer";
import { ILeaseStaticStore, LeaseStaticStoreMemory } from "./leaseStatic";
import { BootCode, DHCP53Code, HardwareType, IDHCPMessage, IOptionsId, OptionId } from "./model";
import { getDHCPId, getOptsMeta, IOptionMetaMap, getDHCPName } from "./options";
import { random } from "./prime";
import { format, parse } from "./protocol";
import { IServerConfigValid } from "./ServerConfig";
import { formatIp, parseIp } from "./tools";

const INADDR_ANY = "0.0.0.0";
const SERVER_PORT = 67;
const CLIENT_PORT = 68;

/**
 * helper to build DHCPresponse
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

export interface IServerEvents {
    on(event: "bound", listener: (bound: ILeaseLive) => void): this;
    on(event: "error", listener: (error: Error) => void): this;
    on(event: "warning", listener: (error: string) => void): this;
    on(event: "listening", listener: (socket: Socket) => void): this;
    on(event: "message", listener: (message: IDHCPMessage) => void): this;
    on(event: "close", listener: () => void): this;

    once(event: "bound", listener: (bound: ILeaseLive) => void): this;
    once(event: "error", listener: (error: Error) => void): this;
    once(event: "warning", listener: (error: string) => void): this;
    once(event: "listening", listener: (socket: Socket) => void): this;
    once(event: "message", listener: (message: IDHCPMessage) => void): this;
    once(event: "close", listener: () => void): this;
}

/**
 * Mains DHCP server class
 */
export class Server extends EventEmitter implements IServerEvents {
    private socket: Socket | null;
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
        const socket = createSocket({ type: "udp4", reuseAddr: true });
        this.config = config;
        this.leaseLive = config.leaseLive || new LeaseLiveStoreMemory();
        this.leaseOffer = config.leaseOffer || new LeaseOfferStoreMemory();
        this.leaseStatic = config.leaseStatic || new LeaseStaticStoreMemory({});
        this.socket = socket;
        this.optsMeta = getOptsMeta(this);

        socket.on("message", async (buf: Buffer) => {
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
                    case DHCP53Code.DHCPDECLINE: // 4
                        return console.error("Not implemented DHCPDECLINE");
                    case DHCP53Code.DHCPACK: // 5,
                        return; // nothink to do with incomming ACK
                    case DHCP53Code.DHCPNAK: // 6,
                        return; // nothink to do with incomming NAK
                    case DHCP53Code.DHCPRELEASE: // 7
                        return await self.handle_Release(request);
                    case DHCP53Code.DHCPINFORM: // 8
                        return console.error("Not implemented DHCPINFORM");
                    default:
                        console.error("Not implemented DHCP 53 Type", request.options[53]);
                }
            } catch (e) {
                console.error(e);
            }
        });
        socket.on("listening", () => self.emit("listening", socket));
        socket.on("close", () => self.emit("close"));
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

    public getOptions(request: IDHCPMessage, pre: IOptionsId, customOpts: IOptionsId, requireds: number[], requested?: number[]): IOptionsId {
        // Check if option id actually exists
        customOpts = customOpts || {};
        requested = requested || [];
        requireds = requireds.filter((o) => this.validOption(o));
        requested = requested.filter((o) => this.validOption(o));

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
        for (const optionId of requested) {
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

    public async selectAddress(clientMAC: string, request: IDHCPMessage): Promise<string> {
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
        const [firstIPstr, lastIPStr] = this.getRange(request) as string[];
        const myIPStr = this.getServer(request);

        const staticSerserve = this.leaseStatic.getReservedIP();
        if (this.leaseLive.getFreeIP) {
            const strIP = await this.leaseLive.getFreeIP(firstIPstr, lastIPStr, [new Set(myIPStr), staticSerserve], randIP);
            if (strIP)
                return strIP;
            throw Error("DHCP is full");
        }

        const firstIP = parseIp(firstIPstr);
        const lastIP = parseIp(lastIPStr);

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
                if (await this.leaseLive.hasAddress(strIP))
                    continue;
                return strIP;
            }
        } else {
            // Choose first free IP in subnet
            for (let ip = firstIP; ip <= lastIP; ip++) {
                const strIP = formatIp(ip);
                if (!await this.leaseLive.hasAddress(strIP))
                    return strIP;
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
            if (requestedIpAddress)
                lease.address = requestedIpAddress;
            else
                lease.address = await this.selectAddress(request.chaddr, request);
        }
        if (nextLease) {
            this.leaseOffer.add(lease);
        }
        const pre = { [OptionId.dhcpMessageType]: DHCP53Code.DHCPOFFER };
        const requireds = [OptionId.netmask, OptionId.router, OptionId.leaseTime, OptionId.server, OptionId.dns];
        const requested = request.options[OptionId.dhcpParameterRequestList];
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

    public async handle_Request(request: IDHCPMessage): Promise<number> {
        const { chaddr } = request;
        let nextLease: boolean = false;

        let lease = this.leaseOffer.pop(chaddr);
        if (lease) {
            nextLease = true;
        }
        if (!lease) {
            lease = await this.leaseLive.getLeaseFromMac(chaddr);
            // nextLease = true;
        } else if (!lease) {
            this.emit("error", Error("Get request for an non existing lease, you may extend offer timeout"));
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
            this.emit("error", Error("Get request for an non existing lease, you may extend offer timeout"));
            return 0;
        }

        const staticLease = this.leaseStatic.getLeaseFromMac(request.chaddr, request);
        let customOpts: IOptionsId = {};
        if (staticLease) {
            lease.address = staticLease.address;
            customOpts = staticLease.options || {};
        } else {
            lease.address = await this.selectAddress(chaddr, request);
        }
        if (nextLease) {
            this.leaseLive.add(lease);
        }
        const pre = { [OptionId.dhcpMessageType]: DHCP53Code.DHCPACK };
        const requireds = [OptionId.netmask, OptionId.router, OptionId.leaseTime, OptionId.server, OptionId.dns];
        const requested = request.options[OptionId.dhcpParameterRequestList];
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

    public listen(port?: number, host?: string): Promise<void> {
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

    public close(): Promise<any> {
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

    public getRange(requested: IDHCPMessage): string[] {
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
        const { socket } = this;
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
