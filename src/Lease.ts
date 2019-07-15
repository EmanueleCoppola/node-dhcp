import { DHCPOption, DHCPConfig } from "./model";

export type LeaseState = 'RENEWING' | 'RELEASED' | 'REBINDING' | 'SELECTING' | 'REQUESTING' | 'BOUND' | 'REBOOTING' | 'INIT';

export type IP = string;

export class Lease {
  //constructor(init?: { state?: LeaseState }) {
  //  this.state = init.state;
  //}
  bindTime: Date; // Time when we got an ACK
  leasePeriod: number = 86400; // Seconds the lease is allowed to live, next lease in "leasePeriod - (now - bindTime)"
  renewPeriod: number = 1440; // Seconds till a renew is due, next renew in "renewPeriod - (now - bindTime)"
  rebindPeriod: number = 14400; // Seconds till a rebind is due, next rebind in "rebindPeriod - (now - bindTime)"
  state?: LeaseState;
  server: string; // The server we got our config from
  address: IP; // actual IP address we got
  options: DHCPConfig; // object of all other options we got
  tries: number = 0; // number of tries in order to complete a state
  xid: number = 1; // unique id, incremented with every request
  router: string;
};

