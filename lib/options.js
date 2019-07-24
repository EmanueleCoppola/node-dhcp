"use strict";
/**
 * Format:
 * name: A string description of the option
 * type: A type, which is used by SeqBuffer to parse the option
 * config: The name of the configuration option
 * attr: When a client sends data and an option has no configuration, this is the attribute name for the option
 * default: Gets passed if no configuration is supplied for the option (can be a value or a function)
 * enum: Represents a map of possible enum for this option
 */
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const Tools = __importStar(require("./tools"));
exports.getOptsMeta = (server) => {
    return {
        1: {
            config: "netmask",
            default(requested) {
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
        2: {
            config: "timeOffset",
            name: "Time Offset",
            type: "Int32",
        },
        3: {
            config: "router",
            default(requested) {
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
        4: {
            config: "timeServer",
            name: "Time Server",
            type: "IPs",
        },
        5: {
            config: "nameServer",
            name: "Name Server",
            type: "IPs",
        },
        6: {
            config: "dns",
            default: ["8.8.8.8", "8.8.4.4"],
            name: "Domain Name Server",
            type: "IPs",
        },
        7: {
            config: "logServer",
            name: "Log Server",
            type: "IPs",
        },
        8: {
            config: "cookieServer",
            name: "Cookie Server",
            type: "IPs",
        },
        9: {
            config: "lprServer",
            name: "LPR Server",
            type: "IPs",
        },
        10: {
            config: "impressServer",
            name: "Impress Server",
            type: "IPs",
        },
        11: {
            config: "rscServer",
            name: "Resource Location Server",
            type: "IPs",
        },
        12: {
            config: "hostname",
            name: "Host Name",
            type: "ASCII",
        },
        13: {
            config: "bootFileSize",
            name: "Boot File Size",
            type: "UInt16",
        },
        14: {
            config: "dumpFile",
            name: "Merit Dump File",
            type: "ASCII",
        },
        15: {
            config: "domainName",
            name: "Domain Name",
            type: "ASCII",
        },
        16: {
            config: "swapServer",
            name: "Swap Server",
            type: "IP",
        },
        17: {
            config: "rootPath",
            name: "Root Path",
            type: "ASCII",
        },
        18: {
            config: "extensionPath",
            name: "Extension Path",
            type: "ASCII",
        },
        19: {
            config: "ipForwarding",
            enum: {
                0: "Disabled",
                1: "Enabled",
            },
            name: "IP Forwarding",
            type: "UInt8",
        },
        20: {
            config: "nonLocalSourceRouting",
            name: "Non-Local Source Routing",
            type: "Bool",
        },
        21: {
            config: "policyFilter",
            name: "Policy Filter",
            type: "IPs",
        },
        22: {
            config: "maxDatagramSize",
            name: "Maximum Datagram Reassembly Size",
            type: "UInt16",
        },
        23: {
            config: "datagramTTL",
            name: "Default IP Time-to-live",
            type: "UInt8",
        },
        24: {
            config: "mtuTimeout",
            name: "Path MTU Aging Timeout",
            type: "UInt32",
        },
        25: {
            config: "mtuSizes",
            name: "Path MTU Plateau Table",
            type: "UInt16s",
        },
        26: {
            config: "mtuInterface",
            name: "Interface MTU",
            type: "UInt16",
        },
        27: {
            config: "subnetsAreLocal",
            enum: {
                0: "Disabled",
                1: "Enabled",
            },
            name: "All Subnets are Local",
            type: "UInt8",
        },
        28: {
            config: "broadcast",
            default(requested) {
                if (!server || !requested)
                    return "";
                const range = server.getRange(requested);
                const netmask = server.getC(model_1.OptionId.netmask, requested);
                const ip = range[0]; // range begin is obviously a valid ip
                const cidr = Tools.CIDRFromNetmask(netmask);
                return Tools.formatIp(Tools.broadcastFromIpCIDR(ip, cidr));
            },
            name: "Broadcast Address",
            type: "IP",
        },
        29: {
            config: "maskDiscovery",
            enum: {
                0: "Disabled",
                1: "Enabled",
            },
            name: "Perform Mask Discovery",
            type: "UInt8",
        },
        30: {
            config: "maskSupplier",
            enum: {
                0: "Disabled",
                1: "Enabled",
            },
            name: "Mask Supplier",
            type: "UInt8",
        },
        31: {
            config: "routerDiscovery",
            enum: {
                0: "Disabled",
                1: "Enabled",
            },
            name: "Perform Router Discovery",
            type: "UInt8",
        },
        32: {
            config: "routerSolicitation",
            name: "Router Solicitation Address",
            type: "IP",
        },
        33: {
            config: "staticRoutes",
            name: "Static Route",
            type: "IPs",
        },
        34: {
            config: "trailerEncapsulation",
            name: "Trailer Encapsulation",
            type: "Bool",
        },
        35: {
            config: "arpCacheTimeout",
            name: "ARP Cache Timeout",
            type: "UInt32",
        },
        36: {
            config: "ethernetEncapsulation",
            name: "Ethernet Encapsulation",
            type: "Bool",
        },
        37: {
            config: "tcpTTL",
            name: "TCP Default TTL",
            type: "UInt8",
        },
        38: {
            config: "tcpKeepalive",
            name: "TCP Keepalive Interval",
            type: "UInt32",
        },
        39: {
            config: "tcpKeepaliveGarbage",
            name: "TCP Keepalive Garbage",
            type: "Bool",
        },
        40: {
            config: "nisDomain",
            name: "Network Information Service Domain",
            type: "ASCII",
        },
        41: {
            config: "nisServer",
            name: "Network Information Servers",
            type: "IPs",
        },
        42: {
            config: "ntpServer",
            name: "Network Time Protocol Servers",
            type: "IPs",
        },
        43: {
            config: "vendor",
            name: "Vendor Specific Information",
            type: "UInt8s",
        },
        44: {
            config: "nbnsServer",
            name: "NetBIOS over TCP/IP Name Server",
            type: "IPs",
        },
        45: {
            config: "nbddServer",
            name: "NetBIOS over TCP/IP Datagram Distribution Server",
            type: "IP",
        },
        46: {
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
        47: {
            config: "nbScope",
            name: "NetBIOS over TCP/IP Scope",
            type: "ASCII",
        },
        48: {
            config: "xFontServer",
            name: "X Window System Font Server",
            type: "IPs",
        },
        49: {
            config: "xDisplayManager",
            name: "X Window System Display Manager",
            type: "IPs",
        },
        50: {
            attr: "requestedIpAddress",
            name: "Requested IP Address",
            type: "IP",
        },
        51: {
            config: "leaseTime",
            default: 86400,
            name: "IP Address Lease Time",
            type: "UInt32",
        },
        52: {
            config: "dhcpOptionOverload",
            enum: {
                1: "file",
                2: "sname",
                3: "both",
            },
            name: "Option Overload",
            type: "UInt8",
        },
        53: {
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
        54: {
            config: "server",
            name: "Server Identifier",
            type: "IP",
        },
        55: {
            attr: "requestParameter",
            config: "dhcpParameterRequestList",
            name: "Parameter Request List",
            type: "UInt8s",
        },
        56: {
            config: "dhcpMessage",
            name: "Message",
            type: "ASCII",
        },
        57: {
            config: "maxMessageSize",
            default: 1500,
            name: "Maximum DHCP Message Size",
            type: "UInt16",
        },
        58: {
            config: "renewalTime",
            default: 3600,
            name: "Renewal (T1) Time Value",
            type: "UInt32",
        },
        59: {
            config: "rebindingTime",
            default: 14400,
            name: "Rebinding (T2) Time Value",
            type: "UInt32",
        },
        60: {
            attr: "vendorClassId",
            config: "vendorClassIdentifier",
            name: "Vendor Class-Identifier",
            type: "ASCII",
        },
        61: {
            attr: "clientId",
            config: "smtpServer",
            name: "Client-Identifier",
            type: "ASCII",
        },
        64: {
            config: "smtpServer",
            name: "Network Information Service+ Domain",
            type: "ASCII",
        },
        65: {
            config: "smtpServer",
            name: "Network Information Service+ Servers",
            type: "IPs",
        },
        66: {
            config: "smtpServer",
            name: "TFTP server name",
            type: "ASCII",
        },
        67: {
            config: "smtpServer",
            name: "Bootfile name",
            type: "ASCII",
        },
        68: {
            config: "smtpServer",
            name: "Mobile IP Home Agent",
            type: "ASCII",
        },
        69: {
            config: "smtpServer",
            name: "Simple Mail Transport Protocol (SMTP) Server",
            type: "IPs",
        },
        70: {
            config: "pop3Server",
            name: "Post Office Protocol (POP3) Server",
            type: "IPs",
        },
        71: {
            config: "nntpServer",
            name: "Network News Transport Protocol (NNTP) Server",
            type: "IPs",
        },
        72: {
            config: "wwwServer",
            name: "Default World Wide Web (WWW) Server",
            type: "IPs",
        },
        73: {
            config: "fingerServer",
            name: "Default Finger Server",
            type: "IPs",
        },
        74: {
            config: "ircServer",
            name: "Default Internet Relay Chat (IRC) Server",
            type: "IPs",
        },
        75: {
            config: "streetTalkServer",
            name: "StreetTalk Server",
            type: "IPs",
        },
        76: {
            config: "streetTalkDAServer",
            name: "StreetTalk Directory Assistance (STDA) Server",
            type: "IPs",
        },
        80: {
            attr: "rapidCommit",
            name: "Rapid Commit",
            type: "Bool",
        },
        100: {
            config: "PCode",
            name: "IEEE 1003.1 TZ String",
            type: "ASCII",
        },
        101: {
            config: "TCode",
            name: "Reference to the TZ Database",
            type: "ASCII",
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
            config: "netinfoServerAddress",
            name: "Netinfo Address",
            type: "ASCII",
        },
        113: {
            config: "netinfoServerTag",
            name: "Netinfo Tag",
            type: "ASCII",
        },
        116: {
            attr: "autoConfigure",
            enum: {
                0: "DoNotAutoConfigure",
                1: "AutoConfigure",
            },
            // config: 'autoConfig', // may need removal
            name: "Auto-Configure",
            type: "UInt8",
        },
        118: {
            config: "subnetSelection",
            name: "Subnet Selection",
            type: "IP",
        },
        119: {
            config: "domainSearchList",
            name: "Domain Search List",
            type: "ASCII",
        },
        120: {
            config: "SIPServerDHCPOption",
            name: "SIP Server DHCP Option",
            type: "IPv4orDNS",
        },
        121: {
            config: "classlessRoute",
            name: "Classless Route Option Format",
            type: "IPs",
        },
        125: {
            config: "vivso",
            name: "Vendor Identified Vendor-Specific Information",
            type: "ASCII",
        },
        145: {
            attr: "renewNonce",
            config: "renewNonce",
            name: "Forcerenew Nonce",
            type: "UInt8s",
        },
        208: {
            config: "pxeMagicOption",
            default: 0xF100747E,
            name: "PXE Magic Option",
            type: "UInt32",
        },
        209: {
            config: "pxeConfigFile",
            name: "PXE Config File",
            type: "ASCII",
        },
        210: {
            config: "pxePathPrefix",
            name: "PXE Path Prefix",
            type: "ASCII",
        },
        211: {
            config: "pxeRebootTime",
            name: "PXE Reboot Time",
            type: "UInt32",
        },
        252: {
            config: "wpad",
            name: "Web Proxy Auto-Discovery",
            type: "ASCII",
        },
    };
};
exports.optsMetaDefault = exports.getOptsMeta();
function getDHCPId(key) {
    if (typeof (key) === "number")
        return key;
    const AsId = Number(key);
    if (isNaN(AsId))
        return confMapping[key];
    return AsId;
}
exports.getDHCPId = getDHCPId;
// Create inverse config/attr lookup map
const confMapping = {}; // conf option -> id
// export const attrMapping: { [key: string]: number } = {}; // attr name -> id
function indexOption(code, opt) {
    if (opt.config) {
        confMapping[opt.config] = parseInt(code, 10);
    }
    else if (opt.attr) {
        confMapping[opt.attr] = parseInt(code, 10);
    }
}
for (const i in exports.optsMetaDefault) {
    indexOption(i, exports.optsMetaDefault[i]);
}
//# sourceMappingURL=options.js.map