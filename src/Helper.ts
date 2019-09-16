import { ILeaseEx, ILeaseExTxt } from "./leaseStatic";
import { IDHCPMessage, IDHCPMessageTxt, IOptionsId, IOptionsTxtOrId, OptionId } from "./model";
import { getDHCPName } from "./options";

const DHCP53Mapping = {
    1: "DHCPDISCOVER",
    2: "DHCPOFFER",
    3: "DHCPREQUEST",
    4: "DHCPDECLINE",
    5: "DHCPACK",
    6: "DHCPNAK",
    7: "DHCPRELEASE",
    8: "DHCPINFORM",
};

export class Helper {

    public static toLeaseExTxt(lease?: ILeaseEx | null): ILeaseExTxt | null {
        if (!lease)
            return null;
        const out: ILeaseExTxt = {
            mac: lease.mac,
            address: lease.address,
            options: {},
        };
        if (lease.options) {
            for (const k of Object.keys(lease.options)) {
                const name = getDHCPName(k);
                if (name)
                    out.options[name] = lease.options[k];
            }
        }
        return out;
    }

    public static toIOptionsTxt(options: IOptionsId | null, depth?: boolean): IOptionsTxtOrId | null {
        if (!options)
            return null;
        const optionsTxt: IOptionsTxtOrId = {};
        for (const optionId of Object.keys(options)) {
            const name = getDHCPName(optionId);
            let value = options[optionId];
            if (depth) {
                if (optionId === "55" || optionId === "60") {
                    if (value instanceof Array) {
                        value = value.map((id) => {
                            const txt = getDHCPName(id);
                            return txt || id;
                        });
                    }
                }
                if (optionId === "53") {
                    if (DHCP53Mapping[value])
                        optionsTxt[optionId] = DHCP53Mapping[value];
                }
            }
            if (name)
                optionsTxt[name] = value;
            else
                optionsTxt[optionId] = value;
        }
        return optionsTxt;
    }

    public static toIDHCPMessageTxt(msg: IDHCPMessage | null, depth?: boolean): IDHCPMessageTxt | null {
        if (!msg)
            return null;
        return {
            op: msg.op,
            htype: msg.htype,
            hlen: msg.hlen,
            hops: msg.hops,
            xid: msg.xid,
            secs: msg.secs,
            flags: msg.flags,
            ciaddr: msg.ciaddr,
            yiaddr: msg.yiaddr,
            siaddr: msg.siaddr,
            giaddr: msg.giaddr,
            chaddr: msg.chaddr,
            sname: msg.sname,
            file: msg.file,
            magicCookie: msg.magicCookie,
            options: Helper.toIOptionsTxt(msg.options, depth) as IOptionsTxtOrId,
        };
    }
}
