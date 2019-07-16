import { DHCPOptions } from './DHCPOptions';

export type IP = string | ((option: DHCPOptions) => string);
export type IPs = string[] | ((option: DHCPOptions) => string[]);
export type Int32 = number | ((option: DHCPOptions) => number);
export type UInt16 = number | ((option: DHCPOptions) => number);
export type UInt32 = number | ((option: DHCPOptions) => number);
export type UInt8 = number | ((option: DHCPOptions) => number);
export type ASCII = string | ((option: DHCPOptions) => string);
export type ASCIIs = string[] | ((option: DHCPOptions) => string[]);

export interface IDHCPMessage {
  op: BootCode;
  htype: number; // UInt8 hardware addr type: 1 for 10mb ethernet
  hlen: number; // UInt8hardware addr length: 6 for 10mb ethernet
  hops: number; // UInt8relay hop count
  xid: number; // UInt32 session id, initialized by client
  secs: number; // UInt16 seconds since client began address acquistion
  flags: number; // UInt16
  ciaddr: string; // IP client IP when BOUND, RENEW, REBINDING state
  yiaddr: string; // IP 'your' client IP
  siaddr: string; // IP next server to use in boostrap, returned in OFFER & ACK
  giaddr: string; // IP gateway/relay agent IP
  chaddr: string; // client hardware address
  sname: string; // server host name
  file: string; // boot file name
  magicCookie?: number; // UInt32 contains 99, 130, 83, 99
  options: DHCPOptions;
}

// RFC1700, hardware
export enum HardwareType {
  Ethernet = 1,
  Experimental = 2,
  AX25 = 3,
  ProNETTokenRing = 4,
  Chaos = 5,
  Tokenring = 6,
  Arcnet = 7,
  FDDI = 8,
  Lanstar = 9,
}

export enum BootCode {
  BOOTREQUEST = 1,
  BOOTREPLY = 2,
}

export enum DHCP53Code {
  DHCPDISCOVER = 1,
  DHCPOFFER = 2,
  DHCPREQUEST = 3,
  DHCPDECLINE = 4,
  DHCPACK = 5,
  DHCPNAK = 6,
  DHCPRELEASE = 7,
  DHCPINFORM = 8, //  RFC 2131
}

export enum DHCP46Code {
  'B-node' = 0x1,
  'P-node' = 0x2,
  'M-node' = 0x4,
  'H-node' = 0x8,
}

export enum DHCP52Code {
  file = 1,
  sname = 2,
  both = 3,
}

export enum DHCP116Code {
  DoNotAutoConfigure = 0,
  AutoConfigure = 1,
}

export enum OptionId {
  netmask = 1,
  timeOffset = 2,
  router = 3,
  timeServer = 4,
  nameServer = 5,
  dns = 6,
  logServer = 7,
  cookieServer = 8,
  lprServer = 9,
  impressServer = 10,
  rscServer = 11,
  hostname = 12,
  bootFileSize = 13,
  dumpFile = 14,
  domainName = 15,
  swapServer = 16,
  rootPath = 17,
  extensionPath = 18,
  ipForwarding = 19,
  nonLocalSourceRouting = 20,
  policyFilter = 21,
  maxDatagramSize = 22,
  datagramTTL = 23,
  mtuTimeout = 24,
  mtuSizes = 25,
  mtuInterface = 26,
  subnetsAreLocal = 27,
  broadcast = 28,
  maskDiscovery = 29,
  maskSupplier = 30,
  routerDiscovery = 31,
  routerSolicitation = 32,
  staticRoutes = 33,
  trailerEncapsulation = 34,
  arpCacheTimeout = 35,
  ethernetEncapsulation = 36,
  tcpTTL = 37,
  nisDomain = 40,
  nisServer = 41,
  ntpServer = 42,
  vendor = 43,
  nbnsServer = 44,
  nbddServer = 45,
  nbNodeType = 46,
  nbScope = 47,
  xFontServer = 48,
  xDisplayManager = 49,
  requestedIpAddress = 50, // attr
  leaseTime = 51, // RFC 2132
  dhcpOptionOverload = 52,
  dhcpMessageType = 53,
  server = 54,
  dhcpParameterRequestList = 55, // Sent by client to show all things the client wants
  dhcpMessage = 56, // Error message sent in DHCPNAK on failure
  maxMessageSize = 57,
  renewalTime = 58,
  rebindingTime = 59,
  vendorClassIdentifier = 60, // RFC 2132: Sent by client to identify type of a client
  dhcpClientIdentifier = 61, // Sent by client to specify their unique identifier, to be used to disambiguate the lease on the server
  nisPlusDomain = 64,
  nisPlusServer = 65,
  tftpServer = 66,
  bootFile = 67,
  homeAgentAddresses = 68,
  smtpServer = 69,
  pop3Server = 70,
  nntpServer = 71,
  wwwServer = 72,
  fingerServer = 73,
  ircServer = 74,
  streetTalkServer = 75,
  streetTalkDAServer = 76,
  rapidCommit = 80, // RFC 4039: http://www.networksorcery.com/enp/rfc/rfc4039.txt
  autoConfig = 116, // RFC 2563: https://tools.ietf.org/html/rfc2563
  subnetSelection = 118,
  domainSearchList = 119,
  classlessRoute = 121,
  renewNonce = 145, // RFC 6704: https://tools.ietf.org/html/rfc6704
  pxeMagicOption = 208,
  pxeConfigFile = 209,
  pxePathPrefix = 210,
  pxeRebootTime = 211,
  wpad = 252,
}

export enum DHCPEnabled {
  Disabled = 0,
  Enabled = 1,
}
