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
}
