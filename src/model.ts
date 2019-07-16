type IP = string;
type Int32 = number;
type UInt16 = number;
type UInt32 = number;
type UInt8 = number;

export interface ClientConfig {
  mac?: string;
  features?: string[];
}

export interface ServerConfig {
  range: IP[];
  forceOptions: string[]; // Options that need to be sent, even if they were not requested
  randomIP: boolean; // Get random new IP from pool instead of keeping one ip
  static: { [key: string]: IP };
  // Option settings
  netmask: string;
  router: IP[];
  timeServer: any;
  nameServer: string;
  dns: IP[];
  hostname: string;
  domainName: string;
  broadcast: IP;
  server: IP; // This is us
  maxMessageSize: number;
  leaseTime: number;
  renewalTime: number;
  rebindingTime: number;
  bootFile: (req: any, res: any) => string;
}

export interface DHCPMessage {
  op: BootCode;
  htype: UInt8;// number;(htype = sb.getUInt8()), // hardware addr type: 1 for 10mb ethernet
  hlen: UInt8; // hardware addr length: 6 for 10mb ethernet
  hops: UInt8; // relay hop count
  xid: UInt32; // session id, initialized by client
  secs: UInt16; // seconds since client began address acquistion
  flags: UInt16;// 
  ciaddr: IP; // client IP when BOUND, RENEW, REBINDING state
  yiaddr: IP; // 'your' client IP
  siaddr: IP; // next server to use in boostrap, returned in OFFER & ACK
  giaddr: IP; // gateway/relay agent IP
  chaddr: string; // client hardware address
  sname: string; // server host name
  file: string; // boot file name
  magicCookie?: UInt32; // contains 99, 130, 83, 99
  options: DHCPConfig;
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
  DHCPINFORM = 8,
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

export enum DHCPOption {
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
  vendorClassIdentifier = 60,// RFC 2132: Sent by client to identify type of a client
  dhcpClientIdentifier = 61,// Sent by client to specify their unique identifier, to be used to disambiguate the lease on the server
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
  autoConfig = 116,// RFC 2563: https://tools.ietf.org/html/rfc2563
  subnetSelection = 118,
  domainSearchList = 119,
  classlessRoute = 121,
  renewNonce = 145, // RFC 6704: https://tools.ietf.org/html/rfc6704
  pxeMagicOption = 208,
  pxeConfigFile = 209,
  pxePathPrefix = 210,
  pxeRebootTime = 211,
  wpad = 252,
  // static = 1001,
  // randomIP = 1002,
}

export enum DHCPEnabled {
  Disabled = 0,
  Enabled = 1,
}

export interface DHCPConfig {
  1?: IP;
  2?: Int32;
  3?: IP;
  4?: IP[];
  5?: IP[];
  6?: IP[];
  7?: IP[];
  8?: IP[];
  9?: IP[];
  10?: IP[];
  11?: IP[];
  12?: string;
  13?: UInt16;
  14?: string;
  15?: string;
  16?: IP;
  17?: string;
  18?: string;
  19?: DHCPEnabled;
  20?: Boolean;
  21?: IP[];
  22?: UInt16;
  23?: UInt8;
  24?: UInt32;
  25?: UInt16[];
  26?: UInt16;
  27?: DHCPEnabled;
  28?: IP;
  29?: DHCPEnabled;
  30?: DHCPEnabled;
  31?: DHCPEnabled;
  32?: IP;
  33?: IP[];
  34?: Boolean;
  35?: UInt32;
  36?: Boolean;
  37?: UInt8;
  38?: UInt32
  39?: Boolean;
  40?: string;
  41?: IP[];
  42?: IP[];
  43?: UInt8[];
  44?: IP[];
  45?: IP;
  46?: DHCP46Code;
  47?: string;
  48?: IP[];
  49?: IP[];
  50?: IP;
  51?: UInt32;
  52?: DHCP52Code;
  53?: DHCP53Code;
  54?: IP
  55?: UInt8[],
  56?: string;
  57?: UInt16;
  58?: UInt32;
  59?: UInt32;
  60?: string;
  61?: string;
  64?: string;
  65?: IP[],
  66?: string;
  67?: string;
  68?: string;
  69?: IP[];
  70?: IP[];
  71?: IP[];
  72?: IP[];
  73?: IP[];
  74?: IP[];
  75?: IP[];
  76?: IP[];
  80?: boolean;
  //82?: { // RFC 3046, relayAgentInformation
  116?: DHCP116Code;
  118?: IP;
  119?: string;
  121?: IP[]
  145?: UInt8[];
  208?: UInt32;
  209?: string;
  210?: string
  211?: UInt32;
  252?: string;
  //1001: {// TODO: Fix my number!
  //  name: 'Static',
  //  config: 'static'
  //},
  1002?: boolean;
};