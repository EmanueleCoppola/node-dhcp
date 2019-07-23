import { DHCPOptions } from "./DHCPOptions";
import { IOptionsTxt } from "./model";

export type LeaseState = "RENEWING" | "RELEASED" | "REBINDING" | "SELECTING" | "REQUESTING" | "BOUND" | "REBOOTING" | "INIT" | "OFFERED";

/**
 * Lease format for static lease
 * mac and address are mandatory
 * every options can be overwride
 */
export interface ILeaseEx {
  mac: string;
  address: string;
  tag?: string[];
  options?: IOptionsTxt;
}
/**
 * a lise from a living Host
 */
export interface ILeaseLive {
  /**
   * Expiration in sec from 1970
   */
  expiration: number;
  /**
   * Mac
   */
  mac: string;
  /**
   * IP
   */
  address: string;
  /**
   * Name use for readability
   */
  name: string;
}

export interface ILease {
  mac: string; // macAddr
  bindTime: Date; // Time when we got an ACK
  leasePeriod: number; // = 86400; // Seconds the lease is allowed to live, next lease in "leasePeriod - (now - bindTime)"
  renewPeriod: number; // = 1440; // Seconds till a renew is due, next renew in "renewPeriod - (now - bindTime)"
  rebindPeriod: number; // = 14400; // Seconds till a rebind is due, next rebind in "rebindPeriod - (now - bindTime)"
  leaseTime: number;
  state?: LeaseState;
  server: string; // The server we got our config from
  address: string; // actual IP address we got
  options: DHCPOptions; // object of all other options we got
  tries: number; // = 0; // number of tries in order to complete a state
  xid: number; // = 1; // unique id, incremented with every request
  router: string;
}
