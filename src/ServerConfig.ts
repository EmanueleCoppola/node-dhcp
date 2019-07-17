import { DHCPOptions, DHCPOptionsBase } from './DHCPOptions';
import { ASCIIs, IDHCPMessage, IPs, OptionId} from './model';

const extraOption = new Set(['range', 'forceOptions', 'randomIP', 'static']);

export interface IServerConfig extends DHCPOptionsBase {
    randomIP?: boolean; // Get random new IP from pool instead of keeping one ip
    static: { [key: string]: string } | ((mac: string, request: IDHCPMessage) => string | null);
    range: IPs;
    forceOptions?: ASCIIs; // Options that need to be sent, even if they were not requested
}

export type leaseType = (mac: string, request: IDHCPMessage) => string | null;

export class ServerConfig extends DHCPOptions {
    public randomIP: boolean; // Get random new IP from pool instead of keeping one ip
    public static: leaseType;
    private range: IPs;
    private forceOptions: ASCIIs; // Options that need to be sent, even if they were not requested

    constructor(options: IServerConfig) {
        super(options);
        if (options)
            for (const key in options) {
                if (extraOption.has(key))
                    this[key] = options[key];
            }
        if (!options.forceOptions)
            this.forceOptions = ['hostname' ];
        if (!this.get('server'))
            throw Error('server option is mandatoy');
    }

    public get(key: 'static', requested?: IDHCPMessage): { [key: string]: string } | leaseType;

    public get(key: OptionId | string, requested?: IDHCPMessage): any;

    /**
     * @param key the request Key or optionId
     * @param requested the remote Options
     */
    public get(key: OptionId | string, requested?: IDHCPMessage): any {
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
                case 'static': // can be a function
                    return this.static;
            }
            if (typeof val === 'function') {
                return val.call(this, requested || this);
            }
            return val;
        }
        return super.get(key, requested);
    }
}
