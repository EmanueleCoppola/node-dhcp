import Tools from "./tools";
import { IpConfiguration } from "./model";

export interface RangeBlock {
    ip1: string;
    ip2: string;
    netmask: string;
    broadcast: string;
    router: string;
}

interface RangeBlockInternal {
    size: number;
    ip1: number;
    ip2: number;
    netmask: string;
    broadcast: string;
    router: string;
}

export interface IIPRange {
    size(): number;
    getIP(position: number): IpConfiguration | null;
    getIPNum(position: number): number;
    getIPStr(position: number): string;
    fill(conf: IpConfiguration| string): IpConfiguration;
}

/**
 * borne are included
 */
export class IpRange implements IIPRange {
    private count = 0;
    private ranges = [] as Array<RangeBlockInternal>;
    constructor() {
    }
    addRange(block: RangeBlock) {
        const from = Tools.parseIp(block.ip1);
        let to = Tools.parseIp(block.ip2);
        if (to < from)
            throw Error(`invalid IP Range IP:${block.ip2} must be higer then ${block.ip1}`);
        // to++;
        const { netmask, broadcast, router } = block;
        const size = (to - from) + 1;
        this.ranges.push({ size, ip1: from, ip2: to, netmask, broadcast, router });
        this.count += size;
    }

    size(): number {
        return this.count;
    }

    getIP(position: number): IpConfiguration | null {
        const { ranges } = this;
        for (let i = 0; i < ranges.length; i++) {
            const { ip1, size } = ranges[i];
            if (position >= size) {
                position -= size;
            } else {
                const ipId = ip1 + position;
                const ip = Tools.formatIp(ipId);
                const { netmask, broadcast, router } = ranges[i];
                return { ip, netmask, broadcast, router };
            }
        }
        return null;
    }

    getIPNum(position: number): number {
        const { ranges } = this;
        for (let i = 0; i < ranges.length; i++) {
            const { ip1, size } = ranges[i];
            if (position >= size) {
                position -= size;
            } else {
                return ip1 + position;
            }
        }
        return 0;
    }

    getIPStr(position: number): string {
        const ipId = this.getIPNum(position);
        return Tools.formatIp(ipId);
    }

    fill(conf: IpConfiguration| string): IpConfiguration {
        if (typeof conf === 'string'){
            conf = {
                ip: conf,
                netmask: '',
                broadcast: '',
                router: '',
            }
        }
        const ipId = Tools.parseIp(conf.ip);
        const { ranges } = this;
        for (let i = 0; i < ranges.length; i++) {
            const { ip1, ip2 } = ranges[i];
            if (ip1 >= ipId && ip2<= ipId) {
                conf.netmask = ranges[i].netmask;
                conf.broadcast = ranges[i].broadcast;
                conf.router = ranges[i].router;
                return conf;
            }
        }
        return conf;
    }
}