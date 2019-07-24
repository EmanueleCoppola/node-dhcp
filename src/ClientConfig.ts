import { NetworkInterfaceInfo, networkInterfaces } from "os";
import { DHCPOptionsFnc, IDHCPMessage, OptionId } from "./model";
import { getDHCPId } from "./options";

const extraOption = new Set(["mac", "features"]);

export interface IClientConfig extends DHCPOptionsFnc {
  mac?: string;
  features?: string[];
}

export class ClientConfig {
  public mac?: string;
  public features?: string[];

  constructor(options?: IClientConfig) {
    // super(options);
    if (!options)
      return;
    for (const key in options) {
      if (extraOption.has(key))
        this[key] = options[key];
    }
  }

  public getMac(): string {
    if (this.mac)
      return this.mac;
    const macs: string[] = [];
    const inets = networkInterfaces();
    Object.values(inets).forEach((inet) => {
      inet.filter((addr: NetworkInterfaceInfo) => addr.family === "IPv4" && !addr.internal)
        .forEach((addr: NetworkInterfaceInfo) => {
          if (addr.mac)
            macs.push(addr.mac);
          });
    });
    if (macs.length > 1)
      throw new Error(`${macs.length} network interfaces detected, set mac address manually from
- ${macs.join("\n - ")}
\tclient = dhcp.createClient({mac: "12:23:34:45:56:67"});`);
    if (macs.length === 1)
      this.mac = macs[0];
    else
      throw new Error('No network interfaces detected, set mac address manually:\n\tclient = dhcp.createClient({mac: "12:23:34:45:56:67"});');
    return this.mac;
  }

  public getFeatures(): number[] {
    // Default list we request
    const defaultFeatures = [
      OptionId.netmask,
      OptionId.router,
      OptionId.leaseTime,
      OptionId.server,
      OptionId.dns,
    ];
    const fSet = new Set(defaultFeatures);
    const configFeatures = this.features;
    if (configFeatures) {
      for (const f of configFeatures) {
        const id: number = getDHCPId(f);
        if (!id)
          throw new Error("Unknown option " + f);
        if (fSet.has(id))
          continue;
        defaultFeatures.push(id);
        fSet.add(id);
      }
    }
    return defaultFeatures;
  }
}
