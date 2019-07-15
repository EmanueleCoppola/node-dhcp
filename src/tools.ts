

export const parseIp = function (str: string): number {
  const octs = str.split(".");

  if (octs.length !== 4) {
    throw new Error('Invalid IP address ' + str);
  }

  return octs.reduce(function (prev, valStr) {
    let val = parseInt(valStr, 10);
    if (0 <= val && val < 256) {
      return (prev << 8) | val;
    } else {
      throw new Error('Invalid IP address ' + str);
    }
  }, 0);
}
export const formatIp = function (num: number): string {
  let ip = "";

  for (let i = 24; i >= 0; i -= 8) {

    if (ip)
      ip += ".";

    ip += ((num >>> i) & 0xFF).toString(10);
  }
  return ip;
}
// Source: http://www.xarg.org/tools/subnet-calculator/
export const netmaskFromCIDR = function (cidr: number): number {
  return -1 << (32 - cidr);
}

export const netmaskFromIP = function (ip: string | number): number {
  // we don't have much information, pick a class related netmask
  if (typeof ip === "string")
    ip = parseIp(ip);

  const first = ip >>> 24;

  if (first <= 127) {
    return 0xff000000;
  } else if (first >= 192) {
    return 0xffffff00;
  } else {
    return 0xffff0000;
  }
}

// Source: http://www.xarg.org/tools/subnet-calculator/
export const wildcardFromCIDR = function (cidr) {
  return ~netmaskFromCIDR(cidr);
}

// Source: http://www.xarg.org/tools/subnet-calculator/
export const networkFromIpCIDR = function (ip, cidr) {

  if (typeof ip === "string")
    ip = parseIp(ip);

  return netmaskFromCIDR(cidr) & ip;
}

// Source: http://www.xarg.org/tools/subnet-calculator/
export const broadcastFromIpCIDR = function (ip, cidr) {
  if (typeof ip === "string")
    ip = parseIp(ip);
  return networkFromIpCIDR(ip, cidr) | wildcardFromCIDR(cidr);
}

// Source: http://www.xarg.org/tools/subnet-calculator/
export const CIDRFromNetmask = function (net: string | number): number {
  if (typeof net === "string")
    net = parseIp(net);

  let s = 0;
  let d = 0;
  let t = net & 1;
  let wild = t;
  for (let i = 0; i < 32; i++) {
    d += t ^ net & 1;
    t = net & 1;
    net >>>= 1;
    s += t;
  }
  if (d !== 1) {
    throw new Error('Invalid Netmask ' + net);
  }
  if (wild)
    s = 32 - s;
  return s;
}
// Source: http://www.xarg.org/tools/subnet-calculator/
export const gatewayFromIpCIDR = function (ip: string | number, cidr: number): number {

  // The gateway is not the first host of the network in general
  // But it's the best guess we can make.

  if (typeof ip === "string")
    ip = parseIp(ip);

  if (cidr === 32)
    return ip;

  return networkFromIpCIDR(ip, cidr) + 1;
}

// Source: http://www.xarg.org/tools/subnet-calculator/
export const netmaskFromRange = function (ip1: string | number, ip2: string | number): number {
  if (typeof ip1 === "string")
    ip1 = parseIp(ip1);

  if (typeof ip2 === "string")
    ip2 = parseIp(ip2);

  const cidr = 32 - Math.floor(Math.log2((ip1 ^ (ip2 - 1)) + 2)) - 1;

  return netmaskFromCIDR(cidr);
}
