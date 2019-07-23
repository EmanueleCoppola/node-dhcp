import * as dgram from "dgram";
import { EventEmitter } from "events";
import { ClientConfig } from "./ClientConfig";
import { DHCPOptions } from "./DHCPOptions";
import { ILease } from "./Lease";
import { BootCode, DHCP53Code, HardwareType, IDHCPMessage, OptionId } from "./model";
import * as OptionsModel from "./options";
import * as Protocol from "./protocol";
import * as Tools from "./tools";

const SERVER_PORT = 67;
const CLIENT_PORT = 68;

const INADDR_ANY = "0.0.0.0";
const INADDR_BROADCAST = "255.255.255.255";

const ansCommon = {
  file: "", // unused
  giaddr: INADDR_ANY,
  hlen: 6, // Mac addresses are 6 byte
  hops: 0,
  htype: HardwareType.Ethernet,
  op: BootCode.BOOTREQUEST,
  secs: 0, // 0 or seconds since DHCP process started
  siaddr: INADDR_ANY,
  sname: "", // unused
  yiaddr: INADDR_ANY,
};

const newLease = (mac: string): ILease => ({
  mac,
  leasePeriod: 86400, // Seconds the lease is allowed to live, next lease in "leasePeriod - (now - bindTime)"
  renewPeriod: 1440, // Seconds till a renew is due, next renew in "renewPeriod - (now - bindTime)"
  rebindPeriod: 14400, // Seconds till a rebind is due, next rebind in "rebindPeriod - (now - bindTime)"
  tries: 0, // number of tries in order to complete a state
  xid: 1, // unique id, incremented with every request
} as ILease);

export class Client extends EventEmitter {
  // Socket handle
  private socket: dgram.Socket;
  // Config (cache) object
  private config: ClientConfig;
  // Current client state
  private lastLease: ILease;

  constructor(config: ClientConfig) {
    super();
    const self = this;
    const sock = dgram.createSocket({ type: "udp4", reuseAddr: true });
    sock.on("message", (buf: Buffer): any => {
      let request: IDHCPMessage;
      try {
        request = Protocol.parse(buf);
      } catch (e) {
        return self.emit("error", e);
      }
      // self._req = req;
      if (request.op !== BootCode.BOOTREPLY) {
        return self.emit("error", new Error("Malformed packet"), request);
      }
      if (!request.options[OptionId.dhcpMessageType]) {
        return self.emit("error", new Error("Got message, without valid message type"), request);
      }
      self.emit("message", request);
      // Handle request
      switch (request.options[OptionId.dhcpMessageType]) {
        case DHCP53Code.DHCPOFFER:
          self.handleOffer(request);
          break;
        case DHCP53Code.DHCPACK:
        case DHCP53Code.DHCPNAK:
          self.handleAck(request);
          break;
      }
    });
    sock.on("listening", () => self.emit("listening", sock));
    sock.on("close", () => self.emit("close"));
    this.socket = sock;
    this.config = config || new ClientConfig();
    this.lastLease = newLease(""); // unknows Local Mac
  }

  public sendDiscover(): Promise<number> {
    // console.log('Send Discover');
    const mac = this.config.getMac();
    const features = this.config.getFeatures();
    // Formulate the response object
    const ans: IDHCPMessage = {
      ...ansCommon,
      chaddr: mac,
      ciaddr: INADDR_ANY, // 0 for DHCPDISCOVER, other implementations send currently assigned IP - but we follow RFC
      flags: 0, // 0 or 0x80 (if client requires broadcast reply)
      options: new DHCPOptions({
        [OptionId.maxMessageSize]: 1500, // Max message size
        [OptionId.dhcpMessageType]: DHCP53Code.DHCPDISCOVER,
        [OptionId.dhcpClientIdentifier]: mac, // MAY
        [OptionId.dhcpParameterRequestList]: features, // MAY
        // TODO: requested IP optional
      }),
      xid: this.lastLease.xid++, // Selected by client on DHCPDISCOVER
    };
    this.lastLease.state = "SELECTING";
    this.lastLease.tries = 0;
    // TODO: set timeouts
    // Send the actual data
    // INADDR_ANY : 68 -> INADDR_BROADCAST : 67
    return this.send(INADDR_BROADCAST, ans);
  }

  public handleOffer(req: IDHCPMessage) {
    // console.log('Handle Offer', req);

    // Select an offer out of all offers
    // We simply take the first one and change the state then

    if (req.options[OptionId.server]) {
      // Check if we already sent a request to the first appearing server
      if (this.lastLease.state !== "REQUESTING") {
        this.sendRequest(req);
      }
    } else {
      this.emit("error", "Offer does not have a server identifier", req);
    }
  }

  public sendRequest(req: IDHCPMessage): Promise<number> {
    // console.log('Send Request');
    // Formulate the response object
    const mac = this.config.getMac();
    const ans: IDHCPMessage = {
      ...ansCommon,
      chaddr: mac,
      ciaddr: INADDR_ANY, // 0 for DHCPREQUEST
      flags: 0, // 0 or 0x80 (if client requires broadcast reply)
      options: new DHCPOptions({
        [OptionId.maxMessageSize]: 1500, // Max message size
        [OptionId.dhcpMessageType]: DHCP53Code.DHCPREQUEST,
        [OptionId.dhcpClientIdentifier]: mac, // MAY
        [OptionId.dhcpParameterRequestList]: this.config.getFeatures(), // MAY
        [OptionId.requestedIpAddress]: this.lastLease.address, // requested IP, TODO: MUST (selecting or INIT REBOOT) MUST NOT (BOUND, RENEW)
        // TODO: server identifier: MUST (after selecting) MUST NOT (INIT REBOOT, BOUND, RENEWING, REBINDING)
      }),
      xid: req.xid, // 'xid' from server DHCPOFFER message
    };

    this.lastLease.server = req.options.get(OptionId.server, req) as string;
    this.lastLease.address = req.yiaddr;
    this.lastLease.state = "REQUESTING";
    this.lastLease.tries = 0;

    // TODO: retry timeout

    // INADDR_ANY : 68 -> INADDR_BROADCAST : 67
    return this.send(INADDR_BROADCAST, ans);
  }

  public handleAck(req: IDHCPMessage): void {
    if (req.options[OptionId.dhcpMessageType] === DHCP53Code.DHCPACK) {
      const { lastLease } = this;
      // We now know the IP for sure
      // console.log('Handle ACK', req);
      lastLease.bindTime = new Date();
      lastLease.state = "BOUND";
      lastLease.address = req.yiaddr;
      lastLease.options = new DHCPOptions();

      // Lease time is available
      if (req.options[OptionId.leaseTime]) {
        const leaseTime = req.options.get(OptionId.leaseTime, req) as number;
        lastLease.leasePeriod = leaseTime;
        lastLease.renewPeriod = leaseTime / 2;
        lastLease.rebindPeriod = leaseTime;
      }

      // Renewal time is available
      if (req.options[OptionId.renewalTime]) {
        lastLease.renewPeriod = req.options.get(OptionId.renewalTime, req) as number;
      }

      // Rebinding time is available
      if (req.options[OptionId.rebindingTime]) {
        lastLease.rebindPeriod = req.options.get(OptionId.rebindingTime, req) as number;
      }

      // TODO: set renew & rebind timer

      const options = req.options;
      lastLease.options = new DHCPOptions();

      // Map all options from request
      for (const id in options) {
        const id2 = Number(id);

        if (id2 === OptionId.dhcpMessageType || id2 === OptionId.leaseTime || id2 === OptionId.renewalTime || id2 === OptionId.rebindingTime)
          continue;

        const conf = OptionsModel.optsMeta[id];
        const key = conf.config || conf.attr;

        if (conf.enum) {
          lastLease.options[key] = conf.enum[options[id]];
        } else {
          lastLease.options[key] = options[id];
        }
      }

      // If netmask is not given, set it to a class related mask
      if (!lastLease.options[OptionId.netmask]) {
        lastLease.options[OptionId.netmask] = Tools.formatIp(
          Tools.netmaskFromIP(lastLease.address));
      }

      const cidr = Tools.CIDRFromNetmask(lastLease.options.get(OptionId.netmask, req) as string);

      // If router is not given, guess one
      if (!lastLease.options[OptionId.router]) {
        const router = Tools.formatIp(Tools.gatewayFromIpCIDR(lastLease.address, cidr));
        lastLease.options[OptionId.router] = [router];
      }

      // If broadcast is missing
      if (!lastLease.options[OptionId.broadcast]) {
        lastLease.options[OptionId.broadcast] = Tools.formatIp(
          Tools.broadcastFromIpCIDR(lastLease.address, cidr));
      }

      this.emit("bound", lastLease);

    } else {
      // We're sorry, today we have no IP for you...
    }
  }

  public sendRelease(req: IDHCPMessage): Promise<number> {
    // console.log('Send Release');
    // Formulate the response object
    const ans: IDHCPMessage = {
      ...ansCommon,
      chaddr: this.config.getMac(),
      ciaddr: this.lastLease.server, // this.getConfig('server'),
      flags: 0,
      options: new DHCPOptions({
        [OptionId.dhcpMessageType]: DHCP53Code.DHCPRELEASE,
        // TODO: MAY clientID
        [OptionId.server]: this.lastLease.server, // MUST server identifier
      }),
      xid: this.lastLease.xid++, // Selected by client on DHCPRELEASE
    };
    this.lastLease.bindTime = null;
    this.lastLease.state = "RELEASED";
    this.lastLease.tries = 0;
    this.emit("released");
    // Send the actual data
    return this.send(this.lastLease.server, ans); // Send release directly to server
  }

  public sendRenew(): Promise<number> {
    // console.log('Send Renew');
    // TODO: check ans against rfc
    // Formulate the response object
    const ans = {
      ...ansCommon,
      chaddr: this.config.getMac(),
      ciaddr: this.lastLease.server, // this.getConfig('server'),
      flags: 0,
      options: {
        [OptionId.dhcpMessageType]: DHCP53Code.DHCPREQUEST,
        [OptionId.requestedIpAddress]: this.lastLease.address,
        // TODO: MAY clientID
        [OptionId.server]: this.lastLease.server, // MUST server identifier
      },
      xid: this.lastLease.xid++, // Selected by client on DHCPRELEASE
    } as IDHCPMessage;
    this.lastLease.state = "RENEWING";
    this.lastLease.tries = 0;
    // Send the actual data
    return this.send(this.lastLease.server, ans); // Send release directly to server
  }

  public sendRebind(): Promise<number> {
    // console.log('Send Rebind');
    // TODO: check ans against rfc
    // Formulate the response object
    const ans: IDHCPMessage = {
      ...ansCommon,
      chaddr: this.config.getMac(),
      ciaddr: this.lastLease.server, // <string>this.getConfig('server'),
      flags: 0,
      options: new DHCPOptions({
        [OptionId.dhcpMessageType]: DHCP53Code.DHCPREQUEST,
        [OptionId.requestedIpAddress]: this.lastLease.address,
        // TODO: MAY clientID
        [OptionId.server]: this.lastLease.server, // MUST server identifier
      }),
      xid: this.lastLease.xid++, // Selected by client on DHCPRELEASE
    };
    this.lastLease.state = "REBINDING";
    this.lastLease.tries = 0;
    // TODO: timeout
    // Send the actual data
    return this.send(INADDR_BROADCAST, ans); // Send release directly to server
  }

  public listen(port: number, host: string): Promise<void> {
    const { socket } = this;
    return new Promise((resolve) => {
      socket.bind(port || CLIENT_PORT, host || INADDR_ANY, () => {
        socket.setBroadcast(true);
        resolve();
      });
    });
  }

  public close(): Promise<any> {
    const that = this;
    return new Promise((resolve) => that.socket.close(resolve));
  }

  private send(host: string, data: IDHCPMessage): Promise<number> {
    const { socket } = this;
    return new Promise((resolve, reject) => {
      const sb = Protocol.format(data);
      socket.send(sb.buffer, 0, sb.w, SERVER_PORT, host, (err, bytes) => {
        if (err) {
          reject(err);
        } else {
          resolve(bytes);
        }
      });
    });
  }
}
