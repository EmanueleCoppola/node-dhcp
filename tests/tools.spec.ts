import { expect } from "chai";
import Tools from "../src/tools";

// # console.log(Tools.formatIp(1))

describe("Tools", () => {
  it("parse Big/Litle", () => {
    let result = Tools.parseIp("10.0.0.1");
    expect(result).equal(167772161);
    result++;
    const ip = Tools.formatIp(result);
    expect(ip).equal("10.0.0.2");
  });

  it("netMask", () => {
    const cidr = Tools.CIDRFromNetmask("255.255.128.0");
    expect(cidr).equal(17);
    const ip0 = Tools.networkFromIpCIDR("10.0.5.1", 17);
    expect(Tools.formatIp(ip0)).equal("10.0.0.0");
    const bcast = Tools.broadcastFromIpCIDR(ip0, cidr)
    expect(Tools.formatIp(bcast)).equal("10.0.127.255");
  });

})
