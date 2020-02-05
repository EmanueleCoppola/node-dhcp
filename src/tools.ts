/* tslint:disable no-bitwise */

import { random } from "./prime";
import { IpRange } from "./IpRange";
import { IpConfiguration } from "./model";

export class Tools {
  public static parseIp(str: string | number): number {
    if (typeof str === "number") return str;
    const octs = str.split(".");
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
  }

  public static formatIp(num: number): string {
    let ip = "";
    for (let i = 24; i >= 0; i -= 8) {
      if (ip) ip += ".";
      ip += ((num >>> i) & 0xff).toString(10);
    }
    return ip;
  }

  // Source: http://www.xarg.org/tools/subnet-calculator/
  public static netmaskFromCIDR(cidr: number): number {
    return -1 << (32 - cidr);
  }

  public static netmaskFromIP(ip: string | number): number {
    // we don't have much information, pick a class related netmask
    ip = Tools.parseIp(ip);
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
  public static wildcardFromCIDR(cidr: number) {
    return ~Tools.netmaskFromCIDR(cidr);
  }

  // Source: http://www.xarg.org/tools/subnet-calculator/
  public static networkFromIpCIDR(ip: string | number, cidr: number) {
    return Tools.netmaskFromCIDR(cidr) & Tools.parseIp(ip);
  }

  // Source: http://www.xarg.org/tools/subnet-calculator/
  public static broadcastFromIpCIDR(ip: string | number, cidr: number) {
    return (
      Tools.networkFromIpCIDR(Tools.parseIp(ip), cidr) |
      Tools.wildcardFromCIDR(cidr)
    );
  }

  // Source: http://www.xarg.org/tools/subnet-calculator/
  public static CIDRFromNetmask(net: string | number): number {
    net = Tools.parseIp(net);
    let s = 0;
    let d = 0;
    let t = net & 1;
    const wild = t;
    for (let i = 0; i < 32; i++) {
      d += t ^ (net & 1);
      t = net & 1;
      net >>>= 1;
      s += t;
    }
    if (d !== 1) {
      throw new Error(`Invalid Netmask ${net}`);
    }
    if (wild) s = 32 - s;
    return s;
  }

  // Source: http://www.xarg.org/tools/subnet-calculator/
  public static gatewayFromIpCIDR(ip: string | number, cidr: number): number {
    // The gateway is not the first host of the network in general
    // But it's the best guess we can make.
    ip = Tools.parseIp(ip);
    if (cidr === 32) return ip;
    return Tools.networkFromIpCIDR(ip, cidr) + 1;
  }

  // Source: http://www.xarg.org/tools/subnet-calculator/
  public static netmaskFromRange(
    ip1: string | number,
    ip2: string | number,
  ): number {
    ip1 = Tools.parseIp(ip1);
    ip2 = Tools.parseIp(ip2);
    const cidr = 32 - Math.floor(Math.log2((ip1 ^ (ip2 - 1)) + 2)) - 1;
    return Tools.netmaskFromCIDR(cidr);
  }

  public static async genericGetFreeIP(
    ranges: IpRange,
    reservedSet: Array<Set<string>>,
    rnd?: boolean,
  ): Promise<IpConfiguration> {
    //const firstIP = Tools.parseIp(IP1);
    //const lastIP = Tools.parseIp(IP2);
    const total = ranges.size();
    // Select a random IP, using prime number iterator
    if (rnd) {
      const prime = random(1000, 10000);
      let offset = 0;
      loop: for (let i = 0; i < total; i++) {
        offset = (offset + prime) % total;
        //const ip = firstIP + offset;
        const strIP = ranges.getIPStr(offset);
        // Tools.formatIp(ip);
        for (const set of reservedSet) if (set.has(strIP)) continue loop;
        return ranges.getIP(offset) as IpConfiguration;
      }
    } else {
      // Choose first free IP in subnet
      loop: for (let offset = 0; offset < total; offset++) {
        const strIP = ranges.getIPStr(offset);
        for (const set of reservedSet) if (set.has(strIP)) continue loop;
        return ranges.getIP(offset) as IpConfiguration;
      }
    }
    let inUsed = 0;
    for (const set of reservedSet) inUsed += set.size;
    throw Error(`${total} DHCP lease are full (${inUsed} reserved)`);
  }
}

export default Tools;
