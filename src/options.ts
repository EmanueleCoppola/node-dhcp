/**
 * Format:
 * name: A string description of the option
 * type: A type, which is used by SeqBuffer to parse the option
 * config: The name of the configuration option
 * attr: When a client sends data and an option has no configuration, this is the attribute name for the option
 * default: Gets passed if no configuration is supplied for the option (can be a value or a function)
 * enum: Represents a map of possible enum for this option
 */

import { IDHCPMessage, IOptionsTxt, OptionId } from "./model";
import { Server } from "./Server";
import * as Tools from "./tools";

// RFC 1533: https://tools.ietf.org/html/rfc1533
// RFC 2132: https://tools.ietf.org/html/rfc2132
// RFC 3011: https://tools.ietf.org/html/rfc3011

// Added on 24/07/2019 by uriel
// RFC 3361: https://tools.ietf.org/html/rfc3361
// RFC 4833: https://tools.ietf.org/html/rfc4833
// RFC 3004: https://tools.ietf.org/html/rfc3004
// RFC 2610: https://tools.ietf.org/html/rfc2610

export interface IOptionMeta {
  name: string;
  type: "IP" | "Int32" | "UInt32" | "UInt16" | "UInt8" | "IPs" | "IP" | "ASCII" | "Bool" | "UInt16s" | "UInt8s" | "IPv4orDNS";
  attr?: string;
  enum?: { [key: number]: string };
  config?: keyof IOptionsTxt;
  default?: any; // Function | string | boolean | number | string[];
}

export interface IOptionMetaMap { [key: number]: IOptionMeta; }

export const getOptsMeta = (server?: Server): IOptionMetaMap => {
  return { // id -> config
    1: {// RFC 2132 Sec 3.3
      config: "netmask",
      default(requested?: IDHCPMessage) {
        // Default is the minimal CIDR for the given range
        if (!server || !requested)
          return "";
        const range = server.getRange(requested);
        const net = Tools.netmaskFromRange(range[0], range[1]);
        return Tools.formatIp(net);
      },
      name: "Subnet Mask",
      type: "IP",
    },
    2: { // RFC 2132 Sec 3.4
      config: "timeOffset",
      name: "Time Offset",
      type: "Int32",
    },
    3: { // RFC 2132 Sec 3.5
      config: "router",
      default(requested?: IDHCPMessage) {
        if (!server || !requested)
          return "";
        // Let's assume the router is the first host of the range if we don't know better
        // Maybe we should calculate the actual host of the subnet instead of assuming the user made it right
        const range = server.getRange(requested);
        return range[0];
      },
      name: "Router",
      type: "IPs",
    },
    4: { // RFC 2132 Sec 3.6
      config: "timeServer",
      name: "Time Server",
      type: "IPs",
    },
    5: { // RFC 2132 Sec 3.7
      config: "nameServer",
      name: "Name Server",
      type: "IPs",
    },
    6: { // RFC 2132 Sec 3.8
      config: "dns",
      default: ["8.8.8.8", "8.8.4.4"], // Use Google DNS server as default
      name: "Domain Name Server",
      type: "IPs",
    },
    7: { // RFC 2132 Sec 3.9
      config: "logServer",
      name: "Log Server",
      type: "IPs",
    },
    8: { // RFC 2132 Sec 3.10
      config: "cookieServer",
      name: "Cookie Server",
      type: "IPs",
    },
    9: { // RFC 2132 Sec 3.11
      config: "lprServer",
      name: "LPR Server",
      type: "IPs",
    },
    10: { // RFC 2132 Sec 3.12
      config: "impressServer",
      name: "Impress Server",
      type: "IPs",
    },
    11: { // RFC 2132 Sec 3.13
      config: "rscServer",
      name: "Resource Location Server",
      type: "IPs",
    },
    12: { // RFC 2132 Sec 3.14
      config: "hostname",
      name: "Host Name",
      type: "ASCII",
    },
    13: { // RFC 2132 Sec 3.15
      config: "bootFileSize",
      name: "Boot File Size",
      type: "UInt16",
    },
    14: { // RFC 2132 Sec 3.16
      config: "dumpFile",
      name: "Merit Dump File",
      type: "ASCII",
    },
    15: { // RFC 2132 Sec 3.17
      config: "domainName",
      name: "Domain Name",
      type: "ASCII",
    },
    16: { // RFC 2132 Sec 3.18
      config: "swapServer",
      name: "Swap Server",
      type: "IP",
    },
    17: { // RFC 2132 Sec 3.19
      config: "rootPath",
      name: "Root Path",
      type: "ASCII",
    },
    18: { // RFC 2132 Sec 3.20
      config: "extensionPath",
      name: "Extension Path",
      type: "ASCII",
    },
    19: { // RFC 2132 Sec 4.1
      config: "ipForwarding",
      name: "IP Forwarding", // Force client to enable ip forwarding
      type: "Bool",
    },
    20: { // RFC 2132 Sec 4.2
      config: "nonLocalSourceRouting",
      name: "Non-Local Source Routing",
      type: "Bool",
    },
    21: { // RFC 2132 Sec 4.3
      config: "policyFilter",
      name: "Policy Filter",
      type: "IPs", // list of IP/MASK
    },
    22: { // RFC 2132 Sec 4.4
      config: "maxDatagramSize",
      name: "Maximum Datagram Reassembly Size",
      type: "UInt16",
    },
    23: { // RFC 2132 Sec 4.5
      config: "datagramTTL",
      name: "Default IP Time-to-live",
      type: "UInt8",
    },
    24: { // RFC 2132 Sec 4.6
      config: "mtuTimeout",
      name: "Path MTU Aging Timeout",
      type: "UInt32",
    },
    25: { // RFC 2132 Sec 4.7
      config: "mtuSizes",
      name: "Path MTU Plateau Table",
      type: "UInt16s",
    },
    26: { // RFC 2132 Sec 5.1
      config: "mtuInterface",
      name: "Interface MTU",
      type: "UInt16",
    },
    27: { // RFC 2132 Sec 5.2
      config: "subnetsAreLocal",
      name: "All Subnets are Local",
      type: "Bool",
    },
    28: { // RFC 2132 Sec 5.3
      config: "broadcast",
      default(requested?: IDHCPMessage) {
        if (!server || !requested)
          return "";
        const range = server.getRange(requested);
        const netmask = server.getC(OptionId.netmask, requested);
        const ip = range[0]; // range begin is obviously a valid ip
        const cidr = Tools.CIDRFromNetmask(netmask);
        return Tools.formatIp(Tools.broadcastFromIpCIDR(ip, cidr));
      },
      name: "Broadcast Address",
      type: "IP",
    },
    29: { // RFC 2132 Sec 5.4
      config: "maskDiscovery",
      name: "Perform Mask Discovery",
      type: "Bool",
    },
    30: { // RFC 2132 Sec 5.5
      config: "maskSupplier",
      name: "Mask Supplier",
      type: "Bool",
    },
    31: { // RFC 2132 Sec 5.6
      config: "routerDiscovery",
      name: "Perform Router Discovery",
      type: "Bool",
    },
    32: { // RFC 2132 Sec 5.7
      config: "routerSolicitation",
      name: "Router Solicitation Address",
      type: "IP",
    },
    33: { // RFC 2132 Sec 5.8
      config: "staticRoutes",
      name: "Static Route",
      type: "IPs", // Always pairs of two must be provided, [destination1, route1, destination2, route2, ...]
    },
    34: { // RFC 2132 Sec 6.1
      config: "trailerEncapsulation",
      name: "Trailer Encapsulation",
      type: "Bool",
    },
    35: { // RFC 2132 Sec 6.2
      config: "arpCacheTimeout",
      name: "ARP Cache Timeout",
      type: "UInt32",
    },
    36: { // RFC 2132 Sec 6.3
      config: "ethernetEncapsulation",
      name: "Ethernet Encapsulation",
      type: "Bool",
    },
    37: { // RFC 2132 Sec 7.1
      config: "tcpTTL",
      name: "TCP Default TTL",
      type: "UInt8",
    },
    38: { // RFC 2132 Sec 7.2
      config: "tcpKeepalive",
      name: "TCP Keepalive Interval",
      type: "UInt32",
    },
    39: { // RFC 2132 Sec 7.3
      config: "tcpKeepaliveGarbage",
      name: "TCP Keepalive Garbage",
      type: "Bool",
    },
    40: { // RFC 2132 Sec 8.1
      config: "nisDomain",
      name: "Network Information Service Domain",
      type: "ASCII",
    },
    41: { // RFC 2132 Sec 8.2
      config: "nisServer",
      name: "Network Information Servers",
      type: "IPs",
    },
    42: { // RFC 2132 Sec 8.3
      config: "ntpServer",
      name: "Network Time Protocol Servers",
      type: "IPs",
    },
    43: { // RFC 2132 Sec 8.4
      config: "vendor",
      name: "Vendor Specific Information",
      type: "UInt8s",
    },
    44: { // RFC 2132 Sec 8.5
      config: "nbnsServer",
      name: "NetBIOS over TCP/IP Name Server",
      type: "IPs",
    },
    45: { // RFC 2132 Sec 8.6
      config: "nbddServer",
      name: "NetBIOS over TCP/IP Datagram Distribution Server",
      type: "IP",
    },
    46: { // RFC 2132 Sec 8.7
      config: "nbNodeType",
      enum: {
        0x1: "B-node",
        0x2: "P-node",
        0x4: "M-node",
        0x8: "H-node",
      },
      name: "NetBIOS over TCP/IP Node Type",
      type: "UInt8",
    },
    47: { // RFC 2132 Sec 8.8
      config: "nbScope",
      name: "NetBIOS over TCP/IP Scope",
      type: "ASCII",
    },
    48: { // RFC 2132 Sec 8.9
      config: "xFontServer",
      name: "X Window System Font Server",
      type: "IPs",
    },
    49: { // RFC 2132 Sec 8.10
      config: "xDisplayManager",
      name: "X Window System Display Manager",
      type: "IPs",
    },
    50: {  // RFC 2132 Sec 9.1
      // IP wish of client in DHCPDISCOVER
      config: "requestedIpAddress",
      attr: "requestedIpAddress",
      name: "Requested IP Address",
      type: "IP",
    },
    51: { // RFC 2132 Sec 9.2
      config: "leaseTime",
      default: 86400,
      name: "IP Address Lease Time",
      type: "UInt32",
    },
    52: { // RFC 2132 Sec 9.3
      config: "dhcpOptionOverload",
      enum: {
        1: "file",
        2: "sname",
        3: "both",
      },
      name: "Option Overload",
      type: "UInt8",
    },
    53: { // RFC 2132 Sec 9.6
      config: "dhcpMessageType",
      enum: {
        1: "DHCPDISCOVER",
        2: "DHCPOFFER",
        3: "DHCPREQUEST",
        4: "DHCPDECLINE",
        5: "DHCPACK",
        6: "DHCPNAK",
        7: "DHCPRELEASE",
        8: "DHCPINFORM",
      },
      name: "DHCP Message Type",
      type: "UInt8",
    },
    54: { // RFC 2132 Sec 9.7
      config: "server",
      name: "Server Identifier",
      type: "IP",
    },
    55: { // RFC 2132 Sec 9.8
      // Sent by client to show all things the client wants
      attr: "requestParameter",
      config: "dhcpParameterRequestList",
      name: "Parameter Request List",
      type: "UInt8s",
    },
    56: { // RFC 2132 Sec 9.9
      // Error message sent in DHCPNAK on failure
      config: "dhcpMessage",
      name: "Message",
      type: "ASCII",
    },
    57: { // RFC 2132 Sec 9.10
      config: "maxMessageSize",
      default: 1500,
      name: "Maximum DHCP Message Size",
      type: "UInt16",
    },
    58: { // RFC 2132 Sec 9.11
      config: "renewalTime",
      default: 3600,
      name: "Renewal (T1) Time Value",
      type: "UInt32",
    },
    59: { // RFC 2132 Sec 9.12
      config: "rebindingTime",
      default: 14400,
      name: "Rebinding (T2) Time Value",
      type: "UInt32",
    },
    60: { // RFC 2132 Sec 9.13
      // RFC 2132: Sent by client to identify type of a client
      // attr: "vendorClassId", // 'MSFT' (win98, Me, 2000), 'MSFT 98' (win 98, me), 'MSFT 5.0' (win 2000 and up), 'alcatel.noe.0' (alcatel IP touch phone), ...
      config: "vendorClassIdentifier",
      name: "Vendor Class-Identifier",
      type: "UInt8s",
    },
    61: { // RFC 2132 Sec 9.14
      // Sent by client to specify their unique identifier, to be used to disambiguate the lease on the server
      config: "dhcpClientIdentifier",
      name: "Client-Identifier",
      type: "ASCII", //  should be "UInt8s",
    },
    62: { // RFC 2242 Sec 2
      config: "netwareIPDomainName",
      name: "The NetWare/IP Domain Name",
      type: "ASCII", // TODO LEN == 11
    },
    63: { // RFC 2242 Sec 2
      config: "netwareIPDomainInfp",
      name: "The NetWare/IP Information ",
      type: "UInt8s", // TODO LEN == 11
    },
    64: { // RFC 2132 Sec 8.11
      config: "NIS+Domain",
      name: "Network Information Service+ Domain",
      type: "ASCII",
    },
    65: { // RFC 2132 Sec 8.12
      config: "NIS+Server",
      name: "Network Information Service+ Servers",
      type: "IPs",
    },
    66: { // RFC 2132 Sec 9.4
      config: "tftpServer",
      name: "TFTP server name",
      type: "ASCII",
    },
    67: { // RFC 2132 Sec 9.5
      config: "bootfileName",
      name: "Bootfile name",
      type: "ASCII",
    },
    68: { // RFC 2132 Sec 8.13
      config: "mobileIPHomeAgent",
      name: "Mobile IP Home Agent",
      type: "IPs",
    },
    69: { // RFC 2132 Sec 8.14
      config: "smtpServer",
      name: "Simple Mail Transport Protocol (SMTP) Server",
      type: "IPs",
    },
    70: { // RFC 2132 Sec 8.15
      config: "pop3Server",
      name: "Post Office Protocol (POP3) Server",
      type: "IPs",
    },
    71: { // RFC 2132 Sec 8.16
      config: "nntpServer",
      name: "Network News Transport Protocol (NNTP) Server",
      type: "IPs",
    },
    72: { // RFC 2132 Sec 8.17
      config: "wwwServer",
      name: "Default World Wide Web (WWW) Server",
      type: "IPs",
    },
    73: { // RFC 2132 Sec 8.18
      config: "fingerServer",
      name: "Default Finger Server",
      type: "IPs",
    },
    74: { // RFC 2132 Sec 8.19
      config: "ircServer",
      name: "Default Internet Relay Chat (IRC) Server",
      type: "IPs",
    },
    75: { // RFC 2132 Sec 8.20
      config: "streetTalkServer",
      name: "StreetTalk Server",
      type: "IPs",
    },
    76: { // RFC 2132 Sec 8.21
      config: "streetTalkDAServer",
      name: "StreetTalk Directory Assistance (STDA) Server",
      type: "IPs",
    },
    77: { // RFC 3004 Sec 4
      config: "userClass",
      name: "User Class",
      type: "UInt8s",
    },
    78: { // RFC 2610 Sec 3
      config: "SLPDirectoryAgent",
      name: "SLP Directory Agent",
      type: "UInt8s",
    },
    79: { // RFC 2610 Sec 4
      config: "SLPServiceScope",
      name: "SLP Service Scope",
      type: "UInt8s",
    },
    80: { // RFC 4039 Sec 4
      attr: "rapidCommit",
      name: "Rapid Commit",
      type: "Bool",
      // config: 'rapidCommit', // may need removal
    },
    81: { // RFC 4702 Sec 2 TODO
      attr: "fqdn", // TODO
      name: "fqdn option space",
      type: "UInt8s",
    },
    82: { // RFC 3046 Sec 2 TODO
      attr: "relayAgentInformation", // TODO
      name: "Agent Information",
      type: "UInt8s",
    },
    // 93: { // RFC 4578 Sec 2.1},
    // 94: { // RFC 4578 Sec 2.2},
    // 97: { // RFC 4578 Sec 2.3},
    100: { // RFC 4833 Sec 2
      config: "PCode",
      name: "IEEE 1003.1 TZ String",
      type: "ASCII",
    },
    101: { // RFC 4833 Sec 2
      config: "TCode",
      name: "Reference to the TZ Database",
      type: "ASCII",
    },
    112: {
      config: "netinfoServerAddress",
      name: "Netinfo Address",
      type: "ASCII",
    },
    113: {
      config: "netinfoServerTag",
      name: "Netinfo Tag",
      type: "ASCII",
    },
    116: {// RFC 2563: https://tools.ietf.org/html/rfc2563
      attr: "autoConfigure",
      enum: {
        0: "DoNotAutoConfigure",
        1: "AutoConfigure",
      },
      // config: 'autoConfig', // may need removal
      name: "Auto-Configure",
      type: "UInt8",
    },
    118: {// RFC 301
      config: "subnetSelection",
      name: "Subnet Selection",
      type: "IP",
    },
    119: {// dns search list
      config: "domainSearchList",
      name: "Domain Search List",
      type: "ASCII",
    },
    120: { // rfc3361
      config: "SIPServerDHCPOption",
      name: "SIP Server DHCP Option",
      type: "IPv4orDNS",
    },
    121: {// rfc 3442
      config: "classlessRoute",
      name: "Classless Route Option Format",
      type: "IPs",
    },
    125: {
      config: "vivso",
      name: "Vendor Identified Vendor-Specific Information",
      type: "ASCII",
    },
    145: {// RFC 6704: https://tools.ietf.org/html/rfc6704
      attr: "renewNonce",
      config: "renewNonce",
      name: "Forcerenew Nonce",
      type: "UInt8s",
    },
    208: {// https://tools.ietf.org/html/rfc5071
      config: "pxeMagicOption",
      default: 0xF100747E,
      name: "PXE Magic Option",
      type: "UInt32",
    },
    209: {// https://tools.ietf.org/html/rfc5071
      config: "pxeConfigFile",
      name: "PXE Config File",
      type: "ASCII",
    },
    210: {// https://tools.ietf.org/html/rfc5071
      config: "pxePathPrefix",
      name: "PXE Path Prefix",
      type: "ASCII",
    },
    211: {// https://tools.ietf.org/html/rfc5071
      config: "pxeRebootTime",
      name: "PXE Reboot Time",
      type: "UInt32",
    },
    252: {// https://en.wikipedia.org/wiki/Web_Proxy_Auto-Discovery_Protocol
      config: "wpad",
      name: "Web Proxy Auto-Discovery",
      type: "ASCII",
    },
  };
};

export const optsMetaDefault = getOptsMeta();

export function getDHCPId(key: string | number): number {
  if (typeof (key) === "number")
    return key;
  const AsId = Number(key);
  if (isNaN(AsId))
    return confMapping[key];
  return AsId;
}

export function getDHCPName(key: string | number): keyof IOptionsTxt | null {
  const id = getDHCPId(key);
  const meta = optsMetaDefault[id];
  if (meta)
    return meta.config || null;
  return null;
}

// Create inverse config/attr lookup map
const confMapping: { [key: string]: number } = {}; // conf option -> id
// export const attrMapping: { [key: string]: number } = {}; // attr name -> id

function indexOption(code: string, opt: IOptionMeta): void {
  if (opt.config) {
    confMapping[opt.config] = parseInt(code, 10);
  } else if (opt.attr) {
    confMapping[opt.attr] = parseInt(code, 10);
  }
}

for (const i in optsMetaDefault) {
  indexOption(i, optsMetaDefault[i]);
}
