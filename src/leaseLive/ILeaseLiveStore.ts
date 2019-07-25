/**
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 */

/**
 * a lease from a living Host
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

export interface ILeaseLiveStore {
  /**
   * find a free IP address
   */
  getFreeIP?: (firstIPstr: string, lastIPStr: string, reserverd: Array<Set<string>>, randomIP?: boolean) => Promise<string>;
  /**
   * get the existing lease for a mac
   */
  getLeaseFromMac(mac: string): Promise<ILeaseLive | null>;
  /**
   * call to extand a lease expiration
   */
  updateLease(lease: ILeaseLive): Promise<void>;
  /**
   * check if the adresse is used by a static lease
   * if a mac is neaded fork the default storage
   */
  hasAddress(address: string): Promise<boolean>;
  /**
   * add a new Lease
   */
  add(lease: ILeaseLive): Promise<boolean>;
  /**
   * release a lease
   */
  release(mac: string): Promise<ILeaseLive | null>;
}
