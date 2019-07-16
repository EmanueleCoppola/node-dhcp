import { ASCIIs, DHCPOptions, IPs, OptionId} from './model';

const extraOption = new Set(['range', 'forceOptions', 'randomIP', 'static']);

export class ServerConfig extends DHCPOptions {
    public randomIP: boolean; // Get random new IP from pool instead of keeping one ip
    public static: { [key: string]: string };
    private range: IPs;
    private forceOptions: ASCIIs; // Options that need to be sent, even if they were not requested

    constructor(options: any) {
        super(options);
        for (const key of options) {
            if (extraOption.has(key))
                this[key] = options[key];
        }
    }

    public get(key: OptionId | string): any {
        if (extraOption.has(key as any)) {
            let val: any = null;
            switch (key) {
                case 'range':
                    val = this.range;
                    break;
                case 'forceOptions':
                    val = this.forceOptions;
                    break;
                case 'randomIP':
                    val = this.randomIP;
                    break;
                case 'static':
                    val = this.static;
                    break;
            }
            if (typeof val === 'function') {
                return val(this);
            }
            return val;
        }
        return super.get(key);
    }

    // Option settings
    // netmask: ASCII; // 1
    // router: IPs; // 3
    // timeServer: string[]; // 4
    // nameServer: ASCII; // 5
    // dns: IPs; // 6
    // hostname: ASCII; // 12
    // domainName: ASCII; // 15
    // broadcast: IP; // 28
    // server: IP; // 54 This is us
    // maxMessageSize: UInt16; //57
    // leaseTime: UInt32; // 51
    // renewalTime: UInt32; // 58
    // rebindingTime: UInt32; // 59
    // bootFile: (req: any, res: any) => string; // 67
}
