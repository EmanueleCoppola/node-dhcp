import * as dgram from 'dgram';
import { networkInterfaces } from 'os';
// const EventEmitter = require('events').EventEmitter;
import { EventEmitter } from 'events'
// import SeqBuffer from './seqbuffer';
import * as OptionsModel from './options';
import * as Protocol from './protocol';
import * as Tools from './tools';
import { DHCP53Code, BootCode, DHCPMessage, HardwareType, DHCPOption, ClientConfig, DHCPConfig } from './model';
import { Lease } from './Lease';

const SERVER_PORT = 67;
const CLIENT_PORT = 68;

const INADDR_ANY = '0.0.0.0';
const INADDR_BROADCAST = '255.255.255.255';

const ansCommon = {
  op: BootCode.BOOTREQUEST,
  htype: HardwareType.Ethernet,
  hlen: 6, // Mac addresses are 6 byte
  hops: 0,
  secs: 0, // 0 or seconds since DHCP process started
  yiaddr: INADDR_ANY,
  siaddr: INADDR_ANY,
  giaddr: INADDR_ANY,
  sname: '', // unused
  file: '', // unused
}

export class Client extends EventEmitter {
  // Socket handle
  private socket: dgram.Socket;
  // Config (cache) object
  private config: ClientConfig;
  // Current client state
  private lastLease: Lease;

  constructor(config: ClientConfig) {
    super();
    const self = this;
    const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    sock.on('message', function (buf: Buffer): any {
      let req: DHCPMessage;
      try {
        req = Protocol.parse(buf);
      } catch (e) {
        return self.emit('error', e);
      }
      // self._req = req;
      if (req.op !== BootCode.BOOTREPLY) {
        return self.emit('error', new Error('Malformed packet'), req);
      }
      if (!req.options[DHCPOption.dhcpMessageType]) {
        return self.emit('error', new Error('Got message, without valid message type'), req);
      }
      self.emit('message', req);
      // Handle request
      switch (req.options[DHCPOption.dhcpMessageType]) {
        case DHCP53Code.DHCPOFFER:
          self.handleOffer(req);
          break;
        case DHCP53Code.DHCPACK:
        case DHCP53Code.DHCPNAK:
          self.handleAck(req);
          break;
      }
    });
    sock.on('listening', () => self.emit('listening', sock));
    sock.on('close', () => self.emit('close'));
    this.socket = sock;
    this.config = config || {};
    this.lastLease = new Lease();
  }

  private getConfigMac(): string {
    if (this.config.mac === undefined) {
      let macs = [];
      const inets = networkInterfaces();
      Object.values(inets).forEach(inet => {
        inet.filter(add => add.family === 'IPv4' && !add.internal)
          .forEach(add => macs.push(add.mac))
      });

      if (macs.length > 1)
        throw new Error(`${macs.length} network interfaces detected, set mac address manually from\n - ${macs.join('\n - ')}\n\tclient = dhcp.createClient({mac: "12:23:34:45:56:67"});`);
      if (macs.length == 1)
        this.config.mac = macs[0];
      else
        throw new Error(`No network interfaces detected, set mac address manually:\n\tclient = dhcp.createClient({mac: "12:23:34:45:56:67"});`);
    }
    return this.config.mac;
  }

  private getConfigFeatures(): number[] {
    // Default list we request
    const defaultFeatures = [
      DHCPOption.netmask,
      DHCPOption.router,
      DHCPOption.leaseTime,
      DHCPOption.server,
      DHCPOption.dns
    ];
    const fSet = new Set(defaultFeatures);
    const configFeatures = this.config.features;
    if (configFeatures) {
      for (let f of configFeatures) {
        let id: number = OptionsModel.getDHCPId(f);
        if (!id)
          throw new Error('Unknown option ' + f);
        if (fSet.has(id))
          continue;
        defaultFeatures.push(id);
        fSet.add(id);
      }
    }
    return defaultFeatures;
  }

  public sendDiscover(): Promise<number> {
    //console.log('Send Discover');
    const mac = this.getConfigMac();
    const features = this.getConfigFeatures();
    // Formulate the response object
    const ans: DHCPMessage = {
      ...ansCommon,
      xid: this.lastLease.xid++, // Selected by client on DHCPDISCOVER
      flags: 0, // 0 or 0x80 (if client requires broadcast reply)
      ciaddr: INADDR_ANY, // 0 for DHCPDISCOVER, other implementations send currently assigned IP - but we follow RFC
      chaddr: <string>mac,
      options: {
        [DHCPOption.maxMessageSize]: 1500, // Max message size
        [DHCPOption.dhcpMessageType]: DHCP53Code.DHCPDISCOVER,
        [DHCPOption.dhcpClientIdentifier]: <string>mac, // MAY
        [DHCPOption.dhcpParameterRequestList]: features // MAY
        // TODO: requested IP optional
      }
    };
    this.lastLease.state = 'SELECTING';
    this.lastLease.tries = 0;
    // TODO: set timeouts
    // Send the actual data
    // INADDR_ANY : 68 -> INADDR_BROADCAST : 67
    return this.send(INADDR_BROADCAST, ans);
  };

  private handleOffer(req: DHCPMessage) {
    //console.log('Handle Offer', req);

    // Select an offer out of all offers
    // We simply take the first one and change the state then

    if (req.options[DHCPOption.server]) {
      // Check if we already sent a request to the first appearing server
      if (this.lastLease.state !== 'REQUESTING') {
        this.sendRequest(req);
      }
    } else {
      this.emit('error', 'Offer does not have a server identifier', req);
    }
  };

  private sendRequest(req: DHCPMessage): Promise<number> {
    //console.log('Send Request');
    // Formulate the response object
    let mac = this.getConfigMac();
    const ans: DHCPMessage = {
      ...ansCommon,
      xid: req.xid, // 'xid' from server DHCPOFFER message
      flags: 0, // 0 or 0x80 (if client requires broadcast reply)
      ciaddr: INADDR_ANY, // 0 for DHCPREQUEST
      chaddr: mac,
      options: {
        [DHCPOption.maxMessageSize]: 1500, // Max message size
        [DHCPOption.dhcpMessageType]: DHCP53Code.DHCPREQUEST,
        [DHCPOption.dhcpClientIdentifier]: mac, // MAY
        [DHCPOption.dhcpParameterRequestList]: this.getConfigFeatures(), // MAY
        [DHCPOption.requestedIpAddress]: this.lastLease.address, // requested IP, TODO: MUST (selecting or INIT REBOOT) MUST NOT (BOUND, RENEW)
        // TODO: server identifier: MUST (after selecting) MUST NOT (INIT REBOOT, BOUND, RENEWING, REBINDING)
      }
    };

    this.lastLease.server = req.options[DHCPOption.server];
    this.lastLease.address = req.yiaddr;
    this.lastLease.state = 'REQUESTING';
    this.lastLease.tries = 0;

    // TODO: retry timeout

    // INADDR_ANY : 68 -> INADDR_BROADCAST : 67
    return this.send(INADDR_BROADCAST, ans);
  };
  public handleAck(req: DHCPMessage): void {
    if (req.options[DHCPOption.dhcpMessageType] === DHCP53Code.DHCPACK) {
      // We now know the IP for sure
      //console.log('Handle ACK', req);
      this.lastLease.bindTime = new Date();
      this.lastLease.state = 'BOUND';
      this.lastLease.address = req.yiaddr;
      this.lastLease.options = <DHCPConfig>{};

      // Lease time is available
      if (req.options[DHCPOption.leaseTime]) {
        this.lastLease.leasePeriod = req.options[DHCPOption.leaseTime];
        this.lastLease.renewPeriod = req.options[DHCPOption.leaseTime] / 2;
        this.lastLease.rebindPeriod = req.options[DHCPOption.leaseTime];
      }

      // Renewal time is available
      if (req.options[DHCPOption.renewalTime]) {
        this.lastLease.renewPeriod = req.options[DHCPOption.renewalTime];
      }

      // Rebinding time is available
      if (req.options[DHCPOption.rebindingTime]) {
        this.lastLease.rebindPeriod = req.options[DHCPOption.rebindingTime];
      }

      // TODO: set renew & rebind timer

      const options = req.options;
      this.lastLease.options = <DHCPConfig>{};

      // Map all options from request
      for (let id in options) {
        let id2 = Number(id);

        if (id2 === DHCPOption.dhcpMessageType || id2 === DHCPOption.leaseTime || id2 === DHCPOption.renewalTime || id2 === DHCPOption.rebindingTime)
          continue;

        const conf = OptionsModel.optsMeta[id];
        const key = conf.config || conf.attr;

        if (conf.enum) {
          this.lastLease.options[key] = conf.enum[options[id]];
        } else {
          this.lastLease.options[key] = options[id];
        }
      }

      // If netmask is not given, set it to a class related mask
      if (!this.lastLease.options[DHCPOption.netmask]) {

        this.lastLease.options[DHCPOption.netmask] = Tools.formatIp(
          Tools.netmaskFromIP(this.lastLease.address));
      }

      const cidr = Tools.CIDRFromNetmask(this.lastLease.options[DHCPOption.netmask]);

      // If router is not given, guess one
      if (!this.lastLease.options[DHCPOption.router]) {
        this.lastLease.options[DHCPOption.router] = Tools.formatIp(
          Tools.gatewayFromIpCIDR(this.lastLease.address, cidr));
      }

      // If broadcast is missing
      if (!this.lastLease.options[DHCPOption.broadcast]) {
        this.lastLease.options[DHCPOption.broadcast] = Tools.formatIp(
          Tools.broadcastFromIpCIDR(this.lastLease.address, cidr));
      }

      this.emit('bound', this.lastLease);

    } else {
      // We're sorry, today we have no IP for you...
    }
  };

  public sendRelease(req: DHCPMessage): Promise<number> {
    //console.log('Send Release');
    // Formulate the response object
    const ans: DHCPMessage = {
      ...ansCommon,
      xid: this.lastLease.xid++, // Selected by client on DHCPRELEASE
      flags: 0,
      ciaddr: this.lastLease.server, // this.getConfig('server'),
      chaddr: this.getConfigMac(),
      options: {
        [DHCPOption.dhcpMessageType]: DHCP53Code.DHCPRELEASE,
        // TODO: MAY clientID
        [DHCPOption.server]: this.lastLease.server // MUST server identifier
      }
    };
    this.lastLease.bindTime = null;
    this.lastLease.state = 'RELEASED';
    this.lastLease.tries = 0;
    this.emit('released');
    // Send the actual data
    return this.send(this.lastLease.server, ans); // Send release directly to server
  };

  public sendRenew(): Promise<number> {
    //console.log('Send Renew');
    // TODO: check ans against rfc
    // Formulate the response object
    const ans = <DHCPMessage>{
      ...ansCommon,
      xid: this.lastLease.xid++, // Selected by client on DHCPRELEASE
      flags: 0,
      ciaddr: this.lastLease.server, //this.getConfig('server'),
      chaddr: this.getConfigMac(),
      options: {
        [DHCPOption.dhcpMessageType]: DHCP53Code.DHCPREQUEST,
        [DHCPOption.requestedIpAddress]: this.lastLease.address,
        // TODO: MAY clientID
        [DHCPOption.server]: this.lastLease.server // MUST server identifier
      }
    };
    this.lastLease.state = 'RENEWING';
    this.lastLease.tries = 0;
    // Send the actual data
    return this.send(this.lastLease.server, ans); // Send release directly to server
  };


  public sendRebind(): Promise<number> {
    //console.log('Send Rebind');
    // TODO: check ans against rfc
    // Formulate the response object
    const ans: DHCPMessage = {
      ...ansCommon,
      xid: this.lastLease.xid++, // Selected by client on DHCPRELEASE
      flags: 0,
      ciaddr: this.lastLease.server, //<string>this.getConfig('server'),
      chaddr: this.getConfigMac(),
      options: {
        [DHCPOption.dhcpMessageType]: DHCP53Code.DHCPREQUEST,
        [DHCPOption.requestedIpAddress]: this.lastLease.address,
        // TODO: MAY clientID
        [DHCPOption.server]: this.lastLease.server // MUST server identifier
      }
    };
    this.lastLease.state = 'REBINDING';
    this.lastLease.tries = 0;
    // TODO: timeout
    // Send the actual data
    return this.send(INADDR_BROADCAST, ans); // Send release directly to server
  };

  public listen(port: number, host: string): Promise<void> {
    const { socket } = this;
    return new Promise(resolve => {
      socket.bind(port || CLIENT_PORT, host || INADDR_ANY, function () {
        socket.setBroadcast(true);
        resolve()
      })
    });
  };

  public close(): Promise<any> {
    let that = this;
    return new Promise(resolve => that.socket.close(resolve));
  };

  private send(host: string, data: DHCPMessage): Promise<number> {
    const { socket } = this;
    return new Promise((resolve, reject) => {
      const sb = Protocol.format(data);
      socket.send(sb.buffer, 0, sb.w, SERVER_PORT, host, function (err, bytes) {
        if (err) {
          reject(err);
        } else {
          resolve(bytes);
        }
      });
    })
  }
};
