"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 */
const tools_1 = require("../tools");
class LeaseLiveStoreMemory {
    constructor() {
        this.cache = {};
        this.address = new Set();
    }
    async getLeaseFromMac(mac) {
        return this.cache[mac] || null;
    }
    async hasAddress(address) {
        return this.address.has(address);
    }
    async release(mac) {
        const old = this.cache[mac];
        if (old) {
            delete this.cache[old.mac];
            this.address.delete(old.address);
        }
        return old;
    }
    async add(lease) {
        this.cache[lease.mac] = lease;
        this.address.add(lease.address);
        return true;
    }
    async getLeases() {
        return Object.values(this.cache);
    }
    async getAddresses() {
        return [...this.address];
    }
    async getMacs() {
        return Object.keys(this.cache);
    }
    getLeases2() {
        return Object.values(this.cache);
    }
    getAddresses2() {
        return [...this.address];
    }
    getMacs2() {
        return Object.keys(this.cache);
    }
    async getFreeIP(IP1, IP2, reserverd, randomIP) {
        return tools_1.genericGetFreeIP(IP1, IP2, [...reserverd, this.address], randomIP);
    }
}
exports.LeaseLiveStoreMemory = LeaseLiveStoreMemory;
//# sourceMappingURL=LeaseLiveStoreMemory.js.map