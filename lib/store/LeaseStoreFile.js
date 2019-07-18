"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const debounce_1 = __importDefault(require("debounce"));
const fse = __importStar(require("fs-extra"));
const tools_1 = require("../tools");
class LeaseStoreFile {
    constructor(file) {
        this.cache = {};
        this.address = new Set();
        this.oldest = null;
        this.cnt = 0;
        this.file = file;
        this.save = debounce_1.default(() => this._save(), 300);
        let data;
        try {
            data = fse.readJSONSync(this.file);
        }
        catch (e) {
            data = [];
        }
        this.reIndex(data);
    }
    async getLeaseFromMac(mac) {
        return this.cache[mac] || null;
    }
    async hasAddress(address) {
        return this.address.has(address);
    }
    async size() {
        return this.cnt;
    }
    async add(lease) {
        const out = this._add(lease);
        if (out)
            this.save();
        return out;
    }
    async getOldest() {
        if (this.oldest)
            return this.oldest;
        let oldest = null;
        let oldestTime = Infinity;
        for (const lease of Object.values(this.cache)) {
            if (lease.leaseTime < oldestTime) {
                oldestTime = lease.leaseTime;
                oldest = lease;
            }
        }
        this.oldest = oldest;
        return oldest;
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
        return tools_1.genericGetFreeIP(IP1, IP2, new Set(reserverd), this.address, this.cnt, randomIP);
    }
    _save() {
        return fse.writeJSON(`${this.file}`, Object.values(this.cache), { spaces: 2 });
    }
    reIndex(leases) {
        const index = {};
        this.cache = {};
        this.address = new Set();
        this.oldest = null;
        this.cnt = 0;
        for (const entry of leases) {
            this._add(entry);
        }
    }
    _add(lease) {
        this.cache[lease.mac] = lease;
        this.address.add(lease.address);
        this.cnt++;
        return true;
    }
}
exports.LeaseStoreFile = LeaseStoreFile;
//# sourceMappingURL=LeaseStoreFile.js.map