import { EventEmitter } from "events";

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
  on(event: "expire", listener: (bound: ILeaseLive) => void): this;
  once(event: "expire", listener: (bound: ILeaseLive) => void): this;
}

export abstract class LeaseLiveStoreHelper extends EventEmitter implements ILeaseLiveStore {
  public cache: { [key: string]: ILeaseLive } = {};
  public address: Set<string> = new Set();

  /**
   * find a free IP address
   */
  public abstract getFreeIP?: (firstIPstr: string, lastIPStr: string, reserverd: Array<Set<string>>, randomIP?: boolean) => Promise<string>;
  private oldest: ILeaseLive | null;
  private timer: NodeJS.Timeout | null;

  constructor() {
    super();
    this.oldest = null;
    this.timer = null;
  }
  /**
   * get the existing lease for a mac
   */
  public abstract getLeaseFromMac(mac: string): Promise<ILeaseLive | null>;
  /**
   * call to extand a lease expiration
   */
  public abstract updateLease(lease: ILeaseLive): Promise<void>;
  /**
   * check if the adresse is used by a static lease
   * if a mac is neaded fork the default storage
   */
  public abstract hasAddress(address: string): Promise<boolean>;
  /**
   * add a new Lease
   */
  public abstract add(lease: ILeaseLive): Promise<boolean>;
  /**
   * release a lease
   */
  public abstract release(mac: string): Promise<ILeaseLive | null>;

  public checkAge(lease: ILeaseLive): void {
    let update = false;
    if (this.oldest != null) {
      if (this.oldest.mac === lease.mac) { // lease extention;
        const oldest = this.findOldest();
        if (oldest) {
          lease = oldest;
          update = true;
        }
      } else if (lease.expiration < this.oldest.expiration) {
        this.oldest = lease;
        update = true;
      }
    } else {
      update = true;
    }
    if (update) {
      this.oldest = lease;
      let time = (this.oldest.expiration * 1000) - new Date().getTime();
      if (time < 0)
        time = 1;
      this.timer = setTimeout(() => this.discardOldest(), time);
    }
  }

  private findOldest(): ILeaseLive | null {
    const now = Math.round(new Date().getTime() / 1000);
    let oldest: ILeaseLive | null = null;
    for (const lease of Object.values(this.cache)) {
      if (lease.expiration < now) {
        this.emit("expire", lease);
        this.release(lease.mac);
      } else {
        if (!oldest)
          oldest = lease;
        else if (oldest.expiration > lease.expiration)
          oldest = lease;
      }
    }
    return oldest;
  }

  private discardOldest(): void {
    this.timer = null;
    const now = Math.round(new Date().getTime() / 1000);
    if (this.oldest && this.oldest.expiration < now) {
      this.emit("expire", this.oldest);
      this.release(this.oldest.mac);
    }
    this.oldest = null;
    const oldest = this.findOldest();
    if (oldest) {
      this.checkAge(oldest);
    }
  }
}
