import * as dgram from 'dgram';
import { networkInterfaces } from 'os';
// const EventEmitter = require('events').EventEmitter;
import { EventEmitter } from 'events'
// import SeqBuffer from './seqbuffer';
import * as OptionsModel from './options';
import * as Protocol from './protocol';
import * as Tools from './tools';
import { DHCP53Code, BootCode, DHCPMessage, HardwareType, ServerConfig, IP, DHCPOption, ClientConfig, DHCPConfig } from './model';
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
  _sock: dgram.Socket;
  // Config (cache) object
  _conf: ClientConfig;
  // Current client state
  _state: Lease;
  // Incoming request
  // _req: DHCPMessage;

  constructor(config: ClientConfig) {
    super();
    const self = this;
    const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    sock.on('message', function (buf) {
      let req: DHCPMessage;
      try {
        req = Protocol.parse(buf);
      } catch (e) {
        self.emit('error', e);
        return;
      }
      // self._req = req;
      if (req.op !== BootCode.BOOTREPLY) {
        self.emit('error', new Error('Malformed packet'), req);
        return;
      }
      if (!req.options[DHCPOption.dhcpMessageType]) {
        self.emit('error', new Error('Got message, without valid message type'), req);
        return;
      }
      self.emit('message', req);
      // Handle request
      switch (req.options[DHCPOption.dhcpMessageType]) {
        case DHCP53Code.DHCPOFFER: // 2.
          self.handleOffer(req);
          break;
        case DHCP53Code.DHCPACK: // 4.
        case DHCP53Code.DHCPNAK: // 4.
          self.handleAck(req);
          break;
      }
    });
    sock.on('listening', () => self.emit('listening', sock));
    sock.on('close', () => self.emit('close'));
    this._sock = sock;
    this._conf = config || {};
    this._state = new Lease();
  }


  config(key: string): string | number | boolean | number[] | string[] | Function {
    if (key === 'mac') {
      if (this._conf.mac === undefined) {
        let macs = [];
        const inets = networkInterfaces();
        Object.values(inets).forEach(inet => {
          inet.filter(add => add.family === 'IPv4' && !add.internal)
            .forEach(add => macs.push(add.mac))
        });

        if (macs.length > 1)
          throw new Error(`${macs.length} network interfaces detected, set mac address manually from\n - ${macs.join('\n - ')}\n\tclient = dhcp.createClient({mac: "12:23:34:45:56:67"});`);
        if (macs.length == 1)
          this._conf.mac = macs[0];
        else
          throw new Error(`No network interfaces detected, set mac address manually:\n\tclient = dhcp.createClient({mac: "12:23:34:45:56:67"});`);
      }

      return this._conf.mac;
    } else if (key === 'features') {
      // Default list we request
      const defaultFeatures = [
        DHCPOption.netmask,
        DHCPOption.router,
        DHCPOption.leaseTime,
        DHCPOption.server,
        DHCPOption.dns
      ];
      const fSet = new Set(defaultFeatures);
      const configFeatures = this._conf.features;
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
    } else {
      throw new Error('Unknown config key ' + key);
    }
  };

  sendDiscover(): Promise<number> {
    //console.log('Send Discover');
    const mac = <string>this.config('mac');
    const features = <number[]>this.config('features');
    // Formulate the response object
    const ans: DHCPMessage = {
      ...ansCommon,
      xid: this._state.xid++, // Selected by client on DHCPDISCOVER
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
    this._state.state = 'SELECTING';
    this._state.tries = 0;
    // TODO: set timeouts
    // Send the actual data
    // INADDR_ANY : 68 -> INADDR_BROADCAST : 67
    return this._send(INADDR_BROADCAST, ans);
  };
  handleOffer(req: DHCPMessage) {
    //console.log('Handle Offer', req);

    // Select an offer out of all offers
    // We simply take the first one and change the state then

    if (req.options[DHCPOption.server]) {
      // Check if we already sent a request to the first appearing server
      if (this._state.state !== 'REQUESTING') {
        this.sendRequest(req);
      }
    } else {
      this.emit('error', 'Offer does not have a server identifier', req);
    }
  };

  sendRequest(req): Promise<number> {
    //console.log('Send Request');
    // Formulate the response object
    const ans: DHCPMessage = {
      ...ansCommon,
      xid: req.xid, // 'xid' from server DHCPOFFER message
      flags: 0, // 0 or 0x80 (if client requires broadcast reply)
      ciaddr: INADDR_ANY, // 0 for DHCPREQUEST
      chaddr: <string>this.config('mac'),
      options: {
        [DHCPOption.maxMessageSize]: 1500, // Max message size
        [DHCPOption.dhcpMessageType]: DHCP53Code.DHCPREQUEST,
        [DHCPOption.dhcpClientIdentifier]: <string>this.config('mac'), // MAY
        [DHCPOption.dhcpParameterRequestList]: <number[]>this.config('features'), // MAY
        [DHCPOption.requestedIpAddress]: this._state.address, // requested IP, TODO: MUST (selecting or INIT REBOOT) MUST NOT (BOUND, RENEW)
        // TODO: server identifier: MUST (after selecting) MUST NOT (INIT REBOOT, BOUND, RENEWING, REBINDING)
      }
    };

    this._state.server = req.options[DHCPOption.server];
    this._state.address = req.yiaddr;
    this._state.state = 'REQUESTING';
    this._state.tries = 0;

    // TODO: retry timeout

    // INADDR_ANY : 68 -> INADDR_BROADCAST : 67
    return this._send(INADDR_BROADCAST, ans);
  };
  handleAck(req: DHCPMessage): void {
    if (req.options[DHCPOption.dhcpMessageType] === DHCP53Code.DHCPACK) {
      // We now know the IP for sure
      //console.log('Handle ACK', req);
      this._state.bindTime = new Date();
      this._state.state = 'BOUND';
      this._state.address = req.yiaddr;
      this._state.options = <DHCPConfig>{};

      // Lease time is available
      if (req.options[DHCPOption.leaseTime]) {
        this._state.leasePeriod = req.options[DHCPOption.leaseTime];
        this._state.renewPeriod = req.options[DHCPOption.leaseTime] / 2;
        this._state.rebindPeriod = req.options[DHCPOption.leaseTime];
      }

      // Renewal time is available
      if (req.options[DHCPOption.renewalTime]) {
        this._state.renewPeriod = req.options[DHCPOption.renewalTime];
      }

      // Rebinding time is available
      if (req.options[DHCPOption.rebindingTime]) {
        this._state.rebindPeriod = req.options[DHCPOption.rebindingTime];
      }

      // TODO: set renew & rebind timer

      const options = req.options;
      this._state.options = <DHCPConfig>{};

      // Map all options from request
      for (let id in options) {
        let id2 = Number(id);

        if (id2 === DHCPOption.dhcpMessageType || id2 === DHCPOption.leaseTime || id2 === DHCPOption.renewalTime || id2 === DHCPOption.rebindingTime)
          continue;

        const conf = OptionsModel.optsMeta[id];
        const key = conf.config || conf.attr;

        if (conf.enum) {
          this._state.options[key] = conf.enum[options[id]];
        } else {
          this._state.options[key] = options[id];
        }
      }

      // If netmask is not given, set it to a class related mask
      if (!this._state.options[DHCPOption.netmask]) {

        this._state.options[DHCPOption.netmask] = Tools.formatIp(
          Tools.netmaskFromIP(this._state.address));
      }

      const cidr = Tools.CIDRFromNetmask(this._state.options[DHCPOption.netmask]);

      // If router is not given, guess one
      if (!this._state.options[DHCPOption.router]) {
        this._state.options[DHCPOption.router] = Tools.formatIp(
          Tools.gatewayFromIpCIDR(this._state.address, cidr));
      }

      // If broadcast is missing
      if (!this._state.options[DHCPOption.broadcast]) {
        this._state.options[DHCPOption.broadcast] = Tools.formatIp(
          Tools.broadcastFromIpCIDR(this._state.address, cidr));
      }

      this.emit('bound', this._state);

    } else {
      // We're sorry, today we have no IP for you...
    }
  };

  sendRelease(req: DHCPMessage): Promise<number> {
    //console.log('Send Release');
    // Formulate the response object
    const ans: DHCPMessage = {
      ...ansCommon,
      xid: this._state.xid++, // Selected by client on DHCPRELEASE
      flags: 0,
      ciaddr: <string>this.config('server'),
      chaddr: <string>this.config('mac'),
      options: {
        [DHCPOption.dhcpMessageType]: DHCP53Code.DHCPRELEASE,
        // TODO: MAY clientID
        [DHCPOption.server]: this._state.server // MUST server identifier
      }
    };
    this._state.bindTime = null;
    this._state.state = 'RELEASED';
    this._state.tries = 0;
    this.emit('released');
    // Send the actual data
    return this._send(this._state.server, ans); // Send release directly to server
  };

  sendRenew(): Promise<number> {
    //console.log('Send Renew');
    // TODO: check ans against rfc
    // Formulate the response object
    const ans = <DHCPMessage>{
      ...ansCommon,
      xid: this._state.xid++, // Selected by client on DHCPRELEASE
      flags: 0,
      ciaddr: this.config('server'),
      chaddr: this.config('mac'),
      options: {
        [DHCPOption.dhcpMessageType]: DHCP53Code.DHCPREQUEST,
        [DHCPOption.requestedIpAddress]: this._state.address,
        // TODO: MAY clientID
        [DHCPOption.server]: this._state.server // MUST server identifier
      }
    };
    this._state.state = 'RENEWING';
    this._state.tries = 0;
    // Send the actual data
    return this._send(this._state.server, ans); // Send release directly to server
  };

  sendRebind(): Promise<number> {
    //console.log('Send Rebind');
    // TODO: check ans against rfc
    // Formulate the response object
    const ans: DHCPMessage = {
      ...ansCommon,
      xid: this._state.xid++, // Selected by client on DHCPRELEASE
      flags: 0,
      ciaddr: <string>this.config('server'),
      chaddr: <string>this.config('mac'),
      options: {
        [DHCPOption.dhcpMessageType]: DHCP53Code.DHCPREQUEST,
        [DHCPOption.requestedIpAddress]: this._state.address,
        // TODO: MAY clientID
        [DHCPOption.server]: this._state.server // MUST server identifier
      }
    };
    this._state.state = 'REBINDING';
    this._state.tries = 0;
    // TODO: timeout
    // Send the actual data
    return this._send(INADDR_BROADCAST, ans); // Send release directly to server
  };

  listen(port: number, host: string): Promise<void> {
    return new Promise(resolve => {
      const sock = this._sock;
      sock.bind(port || CLIENT_PORT, host || INADDR_ANY, function () {
        sock.setBroadcast(true);
        resolve()
      })
    });
  };

  close(): Promise<any> {
    let that = this;
    return new Promise(resolve => that._sock.close(resolve));
  };

  _send(host: string, data: DHCPMessage): Promise<number> {
    return new Promise((resolve, reject) => {
      const sb = Protocol.format(data);
      this._sock.send(sb._data, 0, sb._w, SERVER_PORT, host, function (err, bytes) {
        if (err) {
          reject(err);
        } else {
          resolve(bytes);
        }
      });
    })
  }
};
