import { DHCPOptions } from './DHCPOptions';
import { IOptionsTxt } from './model';

export type LeaseState = 'RENEWING' | 'RELEASED' | 'REBINDING' | 'SELECTING' | 'REQUESTING' | 'BOUND' | 'REBOOTING' | 'INIT' | 'OFFERED';

/**
 * Lease format for static lease
 * mac and address are mandatory
 * every options can be overwride
 */
export interface ILeaseLT {
  mac: string;
  address: string;
  tag?: string[];
  options?: IOptionsTxt;
}

export class Lease {
  public mac: string; // macAddr
  public bindTime: Date; // Time when we got an ACK
  public leasePeriod: number = 86400; // Seconds the lease is allowed to live, next lease in "leasePeriod - (now - bindTime)"
  public renewPeriod: number = 1440; // Seconds till a renew is due, next renew in "renewPeriod - (now - bindTime)"
  public rebindPeriod: number = 14400; // Seconds till a rebind is due, next rebind in "rebindPeriod - (now - bindTime)"
  public leaseTime: number;
  public state?: LeaseState;
  public server: string; // The server we got our config from
  public address: string; // actual IP address we got
  public options: DHCPOptions; // object of all other options we got
  public tries: number = 0; // number of tries in order to complete a state
  public xid: number = 1; // unique id, incremented with every request
  public router: string;

  constructor(mac: string) {
    this.mac = mac;
  }
}
