/* tslint:disable no-bitwise */

import { random } from './prime';

export const parseIp = (str: string | number): number => {
  if (typeof str === 'number')
    return str;
  const octs = str.split('.');
  if (octs.length !== 4) {
    throw new Error(`Invalid IP address ${str}`);
  }
  return octs.reduce((prev, valStr) => {
    const val = parseInt(valStr, 10);
    if (0 <= val && val < 256) {
      return (prev << 8) | val;
    } else {
      throw new Error(`Invalid IP address ${str}`);
    }
  }, 0);
};

export const formatIp = (num: number): string => {
  let ip = '';
  for (let i = 24; i >= 0; i -= 8) {
    if (ip)
      ip += '.';
    ip += ((num >>> i) & 0xFF).toString(10);
  }
  return ip;
};

// Source: http://www.xarg.org/tools/subnet-calculator/
export const netmaskFromCIDR = (cidr: number): number => -1 << (32 - cidr);

export const netmaskFromIP = (ip: string | number): number => {
  // we don't have much information, pick a class related netmask
  ip = parseIp(ip);
  const first = ip >>> 24;
  if (first <= 127) {
    return 0xff000000;
  } else if (first >= 192) {
    return 0xffffff00;
  } else {
    return 0xffff0000;
  }
};

// Source: http://www.xarg.org/tools/subnet-calculator/
export const wildcardFromCIDR = (cidr: number) => ~netmaskFromCIDR(cidr);

// Source: http://www.xarg.org/tools/subnet-calculator/
export const networkFromIpCIDR = (ip: string | number, cidr: number) => netmaskFromCIDR(cidr) & parseIp(ip);

// Source: http://www.xarg.org/tools/subnet-calculator/
export const broadcastFromIpCIDR = (ip: string | number, cidr: number) => networkFromIpCIDR(parseIp(ip), cidr) | wildcardFromCIDR(cidr);

// Source: http://www.xarg.org/tools/subnet-calculator/
export const CIDRFromNetmask = (net: string | number): number => {
  net = parseIp(net);
  let s = 0;
  let d = 0;
  let t = net & 1;
  const wild = t;
  for (let i = 0; i < 32; i++) {
    d += t ^ net & 1;
    t = net & 1;
    net >>>= 1;
    s += t;
  }
  if (d !== 1) {
    throw new Error(`Invalid Netmask ${net}`);
  }
  if (wild)
    s = 32 - s;
  return s;
};

// Source: http://www.xarg.org/tools/subnet-calculator/
export const gatewayFromIpCIDR = (ip: string | number, cidr: number): number => {
  // The gateway is not the first host of the network in general
  // But it's the best guess we can make.
  ip = parseIp(ip);
  if (cidr === 32)
    return ip;
  return networkFromIpCIDR(ip, cidr) + 1;
};

// Source: http://www.xarg.org/tools/subnet-calculator/
export const netmaskFromRange = (ip1: string | number, ip2: string | number): number => {
  ip1 = parseIp(ip1);
  ip2 = parseIp(ip2);
  const cidr = 32 - Math.floor(Math.log2((ip1 ^ (ip2 - 1)) + 2)) - 1;
  return netmaskFromCIDR(cidr);
};

export async function genericGetFreeIP(IP1: string, IP2: string, reservedSet: Array<Set<string>>, used: number, rnd?: boolean): Promise<string> {
  const firstIP = parseIp(IP1);
  const lastIP = parseIp(IP2);
  const total = lastIP - firstIP;

  const leases = used;
  // Check if all IP's are used and delete the oldest
  if (lastIP - firstIP === leases) {
    throw Error('DHCP is full');
  }
  // Exclude our own server IP from pool

  // Select a random IP, using prime number iterator
  if (rnd) {
    const prime = random(1000, 10000);
    let offset = 0;
    loop: for (let i = 0; i < total; i++) {
      offset = (offset + prime) % total;
      const ip = firstIP + offset;
      const strIP = formatIp(ip);
      for (const set of reservedSet)
        if (set.has(strIP))
          continue loop;
    }
  } else {
    // Choose first free IP in subnet
    loop: for (let ip = firstIP; ip <= lastIP; ip++) {
      const strIP = formatIp(ip);
      for (const set of reservedSet)
        if (set.has(strIP))
          continue loop;
      return strIP;
    }
  }
}
