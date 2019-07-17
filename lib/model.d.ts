import { DHCPOptions } from './DHCPOptions';
export declare type IP = string | ((option: IDHCPMessage) => string);
export declare type IPs = string[] | ((option: IDHCPMessage) => string[]);
export declare type Int32 = number | ((option: IDHCPMessage) => number);
export declare type UInt16 = number | ((option: IDHCPMessage) => number);
export declare type UInt32 = number | ((option: IDHCPMessage) => number);
export declare type UInt8 = number | ((option: IDHCPMessage) => number);
export declare type ASCII = string | ((option: IDHCPMessage) => string);
export declare type ASCIIs = string[] | ((option: IDHCPMessage) => string[]);
export interface IDHCPMessage {
    op: BootCode;
    htype: number;
    hlen: number;
    hops: number;
    xid: number;
    secs: number;
    flags: number;
    ciaddr: string;
    yiaddr: string;
    siaddr: string;
    giaddr: string;
    chaddr: string;
    sname: string;
    file: string;
    magicCookie?: number;
    options: DHCPOptions;
}
export declare enum HardwareType {
    Ethernet = 1,
    Experimental = 2,
    AX25 = 3,
    ProNETTokenRing = 4,
    Chaos = 5,
    Tokenring = 6,
    Arcnet = 7,
    FDDI = 8,
    Lanstar = 9
}
export declare enum BootCode {
    BOOTREQUEST = 1,
    BOOTREPLY = 2
}
export declare enum DHCP53Code {
    DHCPDISCOVER = 1,
    DHCPOFFER = 2,
    DHCPREQUEST = 3,
    DHCPDECLINE = 4,
    DHCPACK = 5,
    DHCPNAK = 6,
    DHCPRELEASE = 7,
    DHCPINFORM = 8
}
export declare enum DHCP46Code {
    'B-node' = 1,
    'P-node' = 2,
    'M-node' = 4,
    'H-node' = 8
}
export declare enum DHCP52Code {
    file = 1,
    sname = 2,
    both = 3
}
export declare enum DHCP116Code {
    DoNotAutoConfigure = 0,
    AutoConfigure = 1
}
export declare enum OptionId {
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
    requestedIpAddress = 50,
    leaseTime = 51,
    dhcpOptionOverload = 52,
    dhcpMessageType = 53,
    server = 54,
    dhcpParameterRequestList = 55,
    dhcpMessage = 56,
    maxMessageSize = 57,
    renewalTime = 58,
    rebindingTime = 59,
    vendorClassIdentifier = 60,
    dhcpClientIdentifier = 61,
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
    rapidCommit = 80,
    autoConfig = 116,
    subnetSelection = 118,
    domainSearchList = 119,
    classlessRoute = 121,
    renewNonce = 145,
    pxeMagicOption = 208,
    pxeConfigFile = 209,
    pxePathPrefix = 210,
    pxeRebootTime = 211,
    wpad = 252
}
export declare enum DHCPEnabled {
    Disabled = 0,
    Enabled = 1
}
