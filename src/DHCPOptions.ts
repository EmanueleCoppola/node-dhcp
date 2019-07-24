/* tslint:disable max-classes-per-file */
import { DHCPOptionsFnc, IDHCPMessage, OptionId } from "./model";
import { getDHCPId } from "./options";

/**
 * hold a DHCPOtioms map that support funtion value
 *
 * Only used in DHCP server configuragion
 */
export class DHCPOptions extends DHCPOptionsFnc {
  constructor(data?: any | DHCPOptionsFnc) {
    super();
    if (data)
      for (const key in data) {
        const n = getDHCPId(key);
        if (n)
          this[n] = data[key];
      }
  }
/*
  public get(key: OptionId | string, requested?: IDHCPMessage): any {
    const n = getDHCPId(key);
    let val = this[n];
    if (val === undefined) {
      const meta = optsMeta[n];
      if (meta.default)
        val = meta.default;
      else
        return null;
    }
    if (typeof val === "function") {
      val = val(requested);
    }
    return val;
  }*/
}
