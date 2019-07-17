/* tslint:disable object-literal-shorthand */
/**
 * Format:
 * name: A string description of the option
 * type: A type, which is used by SeqBuffer to parse the option
 * config: The name of the configuration option
 * attr: When a client sends data and an option has no configuration, this is the attribute name for the option
 * default: Gets passed if no configuration is supplied for the option (can be a value or a function)
 * enum: Represents a map of possible enum for this option
 */

import { DHCPOptions } from './DHCPOptions';
import { IDHCPMessage } from './model';
import * as Tools from './tools';

// RFC 1533: https://tools.ietf.org/html/rfc1533
// RFC 2132: https://www.ietf.org/rfc/rfc2132.txt
// RFC 3011: https://tools.ietf.org/html/rfc3011
export interface IOptionMeta {
  name: string;
  type: 'IP' | 'Int32' | 'UInt32' | 'UInt16' | 'UInt8' | 'IPs' | 'IP' | 'ASCII' | 'Bool' | 'UInt16s' | 'UInt8s' | 'any';
  attr?: string;
  enum?: { [key: number]: string };
  config?: string;
  default?: any; // Function | string | boolean | number | string[];
}

export const optsMeta: { [key: number]: IOptionMeta } = { // id -> config
  1: {// RFC 2132
    config: 'netmask',
    default: function(requested: IDHCPMessage) {
      // Default is the minimal CIDR for the given range
      const range = (this as DHCPOptions).get('range', requested);
      const net = Tools.netmaskFromRange(range[0], range[1]);
      return Tools.formatIp(net);
    },
    name: 'Subnet Mask',
    type: 'IP',
  },
  2: {// RFC 2132
    config: 'timeOffset',
    name: 'Time Offset',
    type: 'Int32',
  },
  3: {// RFC 2132
    config: 'router',
    default: function(requested: IDHCPMessage) {
      // Let's assume the router is the first host of the range if we don't know better
      // Maybe we should calculate the actual host of the subnet instead of assuming the user made it right
      const range = (this as DHCPOptions).get('range', requested);
      return range[0];
    },
    name: 'Router',
    type: 'IPs',
  },
  4: {// RFC 2132
    config: 'timeServer',
    name: 'Time Server',
    type: 'IPs',
  },
  5: {
    config: 'nameServer',
    name: 'Name Server',
    type: 'IPs',
  },
  6: {// RFC 2132
    config: 'dns',
    default: ['8.8.8.8', '8.8.4.4'], // Use Google DNS server as default
    name: 'Domain Name Server',
    type: 'IPs',
  },
  7: {// RFC 2132
    config: 'logServer',
    name: 'Log Server',
    type: 'IPs',
  },
  8: {
    config: 'cookieServer',
    name: 'Cookie Server',
    type: 'IPs',
  },
  9: {
    config: 'lprServer',
    name: 'LPR Server',
    type: 'IPs',
  },
  10: {
    config: 'impressServer',
    name: 'Impress Server',
    type: 'IPs',
  },
  11: {
    config: 'rscServer',
    name: 'Resource Location Server',
    type: 'IPs',
  },
  12: {// RFC 2132
    config: 'hostname',
    name: 'Host Name',
    type: 'ASCII',
  },
  13: {
    config: 'bootFileSize',
    name: 'Boot File Size',
    type: 'UInt16',
  },
  14: {
    config: 'dumpFile',
    name: 'Merit Dump File',
    type: 'ASCII',
  },
  15: {// RFC 2132
    config: 'domainName',
    name: 'Domain Name',
    type: 'ASCII',
  },
  16: {
    config: 'swapServer',
    name: 'Swap Server',
    type: 'IP',
  },
  17: {
    config: 'rootPath',
    name: 'Root Path',
    type: 'ASCII',
  },
  18: {
    config: 'extensionPath',
    name: 'Extension Path',
    type: 'ASCII',
  },
  19: {
    config: 'ipForwarding',
    enum: {
      0: 'Disabled',
      1: 'Enabled',
    },
    name: 'IP Forwarding', // Force client to enable ip forwarding
    type: 'UInt8',
  },
  20: {
    config: 'nonLocalSourceRouting',
    name: 'Non-Local Source Routing',
    type: 'Bool',
  },
  21: {
    config: 'policyFilter',
    name: 'Policy Filter',
    type: 'IPs',
  },
  22: {
    config: 'maxDatagramSize',
    name: 'Maximum Datagram Reassembly Size',
    type: 'UInt16',
  },
  23: {
    config: 'datagramTTL',
    name: 'Default IP Time-to-live',
    type: 'UInt8',
  },
  24: {
    config: 'mtuTimeout',
    name: 'Path MTU Aging Timeout',
    type: 'UInt32',
  },
  25: {
    config: 'mtuSizes',
    name: 'Path MTU Plateau Table',
    type: 'UInt16s',
  },
  26: {
    config: 'mtuInterface',
    name: 'Interface MTU',
    type: 'UInt16',
  },
  27: {
    config: 'subnetsAreLocal',
    enum: {
      0: 'Disabled',
      1: 'Enabled',
    },
    name: 'All Subnets are Local',
    type: 'UInt8',
  },
  28: {
    config: 'broadcast',
    default: function(requested: IDHCPMessage) {
      const range = (this as DHCPOptions).get('range', requested);
      const netmask = (this as DHCPOptions).get('netmask', requested);
      const ip = range[0]; // range begin is obviously a valid ip
      const cidr = Tools.CIDRFromNetmask(netmask);
      return Tools.formatIp(Tools.broadcastFromIpCIDR(ip, cidr));
    },
    name: 'Broadcast Address',
    type: 'IP',
  },
  29: {
    config: 'maskDiscovery',
    enum: {
      0: 'Disabled',
      1: 'Enabled',
    },
    name: 'Perform Mask Discovery',
    type: 'UInt8',
  },
  30: {
    config: 'maskSupplier',
    enum: {
      0: 'Disabled',
      1: 'Enabled',
    },
    name: 'Mask Supplier',
    type: 'UInt8',
  },
  31: {
    config: 'routerDiscovery',
    enum: {
      0: 'Disabled',
      1: 'Enabled',
    },
    name: 'Perform Router Discovery',
    type: 'UInt8',
  },
  32: {
    config: 'routerSolicitation',
    name: 'Router Solicitation Address',
    type: 'IP',
  },
  33: {
    config: 'staticRoutes',
    name: 'Static Route',
    type: 'IPs', // Always pairs of two must be provided, [destination1, route1, destination2, route2, ...]
  },
  34: {
    config: 'trailerEncapsulation',
    name: 'Trailer Encapsulation',
    type: 'Bool',
  },
  35: {
    config: 'arpCacheTimeout',
    name: 'ARP Cache Timeout',
    type: 'UInt32',
  },
  36: {
    config: 'ethernetEncapsulation',
    name: 'Ethernet Encapsulation',
    type: 'Bool',
  },
  37: {
    config: 'tcpTTL',
    name: 'TCP Default TTL',
    type: 'UInt8',
  },
  38: {
    config: 'tcpKeepalive',
    name: 'TCP Keepalive Interval',
    type: 'UInt32',
  },
  39: {
    config: 'tcpKeepaliveGarbage',
    name: 'TCP Keepalive Garbage',
    type: 'Bool',
  },
  40: {
    config: 'nisDomain',
    name: 'Network Information Service Domain',
    type: 'ASCII',
  },
  41: {
    config: 'nisServer',
    name: 'Network Information Servers',
    type: 'IPs',
  },
  42: {
    config: 'ntpServer',
    name: 'Network Time Protocol Servers',
    type: 'IPs',
  },
  43: {// RFC 2132
    config: 'vendor',
    name: 'Vendor Specific Information',
    type: 'UInt8s',
  },
  44: {
    config: 'nbnsServer',
    name: 'NetBIOS over TCP/IP Name Server',
    type: 'IPs',
  },
  45: {
    config: 'nbddServer',
    name: 'NetBIOS over TCP/IP Datagram Distribution Server',
    type: 'IP',
  },
  46: {
    config: 'nbNodeType',
    enum: {
      0x1: 'B-node',
      0x2: 'P-node',
      0x4: 'M-node',
      0x8: 'H-node',
    },
    name: 'NetBIOS over TCP/IP Node Type',
    type: 'UInt8',
  },
  47: {
    config: 'nbScope',
    name: 'NetBIOS over TCP/IP Scope',
    type: 'ASCII',
  },
  48: {
    config: 'xFontServer',
    name: 'X Window System Font Server',
    type: 'IPs',
  },
  49: {
    config: 'xDisplayManager',
    name: 'X Window System Display Manager',
    type: 'IPs',
  },
  50: {// IP wish of client in DHCPDISCOVER
    attr: 'requestedIpAddress',
    name: 'Requested IP Address',
    type: 'IP',
  },
  51: {// RFC 2132
    config: 'leaseTime',
    default: 86400,
    name: 'IP Address Lease Time',
    type: 'UInt32',
  },
  52: {
    config: 'dhcpOptionOverload',
    enum: {
      1: 'file',
      2: 'sname',
      3: 'both',
    },
    name: 'Option Overload',
    type: 'UInt8',
  },
  53: {
    config: 'dhcpMessageType',
    enum: {
      1: 'DHCPDISCOVER',
      2: 'DHCPOFFER',
      3: 'DHCPREQUEST',
      4: 'DHCPDECLINE',
      5: 'DHCPACK',
      6: 'DHCPNAK',
      7: 'DHCPRELEASE',
      8: 'DHCPINFORM',
    },
    name: 'DHCP Message Type',
    type: 'UInt8',
  },
  54: {
    config: 'server',
    name: 'Server Identifier',
    type: 'IP',
  },
  55: {// Sent by client to show all things the client wants
    attr: 'requestParameter',
    config: 'dhcpParameterRequestList',
    name: 'Parameter Request List',
    type: 'UInt8s',
  },
  56: {// Error message sent in DHCPNAK on failure
    config: 'dhcpMessage',
    name: 'Message',
    type: 'ASCII',
  },
  57: {
    config: 'maxMessageSize',
    default: 1500,
    name: 'Maximum DHCP Message Size',
    type: 'UInt16',
  },
  58: {
    config: 'renewalTime',
    default: 3600,
    name: 'Renewal (T1) Time Value',
    type: 'UInt32',
  },
  59: {
    config: 'rebindingTime',
    default: 14400,
    name: 'Rebinding (T2) Time Value',
    type: 'UInt32',
  },
  60: {// RFC 2132: Sent by client to identify type of a client
    attr: 'vendorClassId', // 'MSFT' (win98, Me, 2000), 'MSFT 98' (win 98, me), 'MSFT 5.0' (win 2000 and up), 'alcatel.noe.0' (alcatel IP touch phone), ...
    config: 'vendorClassIdentifier',
    name: 'Vendor Class-Identifier',
    type: 'ASCII',
  },
  61: {// Sent by client to specify their unique identifier, to be used to disambiguate the lease on the server
    attr: 'clientId',
    config: 'smtpServer',
    name: 'Client-Identifier',
    type: 'ASCII',
  },
  64: {
    config: 'smtpServer',
    name: 'Network Information Service+ Domain',
    type: 'ASCII',
  },
  65: {
    config: 'smtpServer',
    name: 'Network Information Service+ Servers',
    type: 'IPs',
  },
  66: {// RFC 2132: PXE option
    config: 'smtpServer',
    name: 'TFTP server name',
    type: 'ASCII',
  },
  67: {// RFC 2132: PXE option
    config: 'smtpServer',
    name: 'Bootfile name',
    type: 'ASCII',
  },
  68: {
    config: 'smtpServer',
    name: 'Mobile IP Home Agent',
    type: 'ASCII',
  },
  69: {
    config: 'smtpServer',
    name: 'Simple Mail Transport Protocol (SMTP) Server',
    type: 'IPs',
  },
  70: {
    config: 'pop3Server',
    name: 'Post Office Protocol (POP3) Server',
    type: 'IPs',
  },
  71: {
    config: 'nntpServer',
    name: 'Network News Transport Protocol (NNTP) Server',
    type: 'IPs',
  },
  72: {
    config: 'wwwServer',
    name: 'Default World Wide Web (WWW) Server',
    type: 'IPs',
  },
  73: {
    config: 'fingerServer',
    name: 'Default Finger Server',
    type: 'IPs',
  },
  74: {
    config: 'ircServer',
    name: 'Default Internet Relay Chat (IRC) Server',
    type: 'IPs',
  },
  75: {
    config: 'streetTalkServer',
    name: 'StreetTalk Server',
    type: 'IPs',
  },
  76: {
    config: 'streetTalkDAServer',
    name: 'StreetTalk Directory Assistance (STDA) Server',
    type: 'IPs',
  },
  80: {// RFC 4039: http://www.networksorcery.com/enp/rfc/rfc4039.txt
    attr: 'rapidCommit',
    name: 'Rapid Commit',
    type: 'Bool',
    // config: 'rapidCommit', // may need removal
  },
  // 81: {
  //  attr: 'fqdn',
  //  name: 'fqdn option space',
  //  type: 'ASCII',
  // },
  /*
   82: { // RFC 3046, relayAgentInformation

   },*/
  112: {
    config: 'netinfoServerAddress',
    name: 'Netinfo Address',
    type: 'ASCII',
  },
  113: {
    config: 'netinfoServerTag',
    name: 'Netinfo Tag',
    type: 'ASCII',
  },
  116: {// RFC 2563: https://tools.ietf.org/html/rfc2563
    attr: 'autoConfigure',
    enum: {
      0: 'DoNotAutoConfigure',
      1: 'AutoConfigure',
    },
    // config: 'autoConfig', // may need removal
    name: 'Auto-Configure',
    type: 'UInt8',
  },
  118: {// RFC 301
    config: 'subnetSelection',
    name: 'Subnet Selection',
    type: 'IP',
  },
  119: {// dns search list
    config: 'domainSearchList',
    name: 'Domain Search List',
    type: 'ASCII',
  },
  121: {// rfc 3442
    config: 'classlessRoute',
    name: 'Classless Route Option Format',
    type: 'IPs',
  },
  125: {
    config: 'vivso',
    name: 'Vendor Identified Vendor-Specific Information',
    type: 'ASCII',

  },
  145: {// RFC 6704: https://tools.ietf.org/html/rfc6704
    attr: 'renewNonce',
    config: 'renewNonce',
    name: 'Forcerenew Nonce',
    type: 'UInt8s',
  },
  208: {// https://tools.ietf.org/html/rfc5071
    config: 'pxeMagicOption',
    default: 0xF100747E,
    name: 'PXE Magic Option',
    type: 'UInt32',
  },
  209: {// https://tools.ietf.org/html/rfc5071
    config: 'pxeConfigFile',
    name: 'PXE Config File',
    type: 'ASCII',
  },
  210: {// https://tools.ietf.org/html/rfc5071
    config: 'pxePathPrefix',
    name: 'PXE Path Prefix',
    type: 'ASCII',
  },
  211: {// https://tools.ietf.org/html/rfc5071
    config: 'pxeRebootTime',
    name: 'PXE Reboot Time',
    type: 'UInt32',
  },
  252: {// https://en.wikipedia.org/wiki/Web_Proxy_Auto-Discovery_Protocol
    config: 'wpad',
    name: 'Web Proxy Auto-Discovery',
    type: 'ASCII',
  },
  // 1001: {// TODO: Fix my number!
  //  config: 'static',
  //  name: 'Static',
  //  type: 'any',
  // },
  // 1002: {// TODO: Fix my number!
  //  config: 'randomIP',
  //  default: true,
  //  name: 'Random IP',
  //  type: 'Bool',
  // },
};

// Create inverse config/attr lookup map
const confMapping: { [key: string]: number } = {}; // conf option -> id
export const attrMapping: { [key: string]: number } = {}; // attr name -> id

export function addOption(code: string, opt: IOptionMeta): void {
  optsMeta[code] = opt;
  if (opt.config) {
    confMapping[opt.config] = parseInt(code, 10);
  } else if (opt.attr) {
    confMapping[opt.attr] = parseInt(code, 10);
  }
}

export function getDHCPId(key: string | number): number {
  if (typeof (key) === 'number')
    return key;
  const AsId = Number(key);
  if (isNaN(AsId))
    return confMapping[key];
  return AsId;
}

for (const i in optsMeta) {
  addOption(i, optsMeta[i]);
}
