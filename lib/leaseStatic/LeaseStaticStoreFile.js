"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 */
const debounce_1 = require("debounce");
const fse = __importStar(require("fs-extra"));
const options_1 = require("../options");
const apply = (src, dest) => {
    if (src)
        for (const k in src) {
            const id = options_1.getDHCPId(k);
            if (id && !dest[id])
                dest[id] = src[k];
        }
};
/**
 * basic static Lease conmfiguration module
 */
class LeaseStaticStoreFile {
    constructor(file) {
        this.file = file;
        this.save = debounce_1.debounce(() => this._save(), 200);
        let fileData;
        try {
            fileData = fse.readJSONSync(file);
        }
        catch (_a) {
            fileData = {};
        }
        if (!fileData.tags)
            fileData.tags = {
                green: { dns: ["1.1.1.1"] },
            };
        if (!fileData.leases)
            fileData.leases = [
                {
                    mac: "00-11-22-33-44-55-66",
                    address: "1.2.3.4",
                    tag: ["green"],
                    options: {
                        hostname: "pc-Green-1",
                    },
                },
            ];
        this.data = {};
        this.set = new Set(); // Object.values(this.data));
        this.tags = fileData.tags;
        fileData.leases.forEach((lease) => this.addStatic(lease));
    }
    addStatic(leases) {
        if (leases.tag)
            leases.tag.filter((tag) => !this.tags[tag]).forEach((tag) => { throw Error(`tag ${tag} is not defined`); });
        this.data[leases.mac] = leases;
        this.set.add(leases.address);
    }
    delStatic(mac) {
        const old = this.data[mac];
        if (old) {
            this.set.delete(old.address);
            delete this.data[mac];
        }
    }
    getLease(mac, request) {
        const lease = this.data[mac];
        if (!lease)
            return;
        const out = { address: lease.address, mac: lease.mac, options: {} };
        apply(lease.options, out.options);
        if (lease.tag)
            lease.tag.forEach((tag) => apply(this.tags[tag], out.options));
        return out;
    }
    getReservedIP() {
        return this.set;
    }
    _save() {
        const exportData = {
            tags: this.tags,
            leases: Object.values(this.data),
        };
        return fse.writeJSON(`${this.file}`, exportData, { spaces: 2 });
    }
}
exports.LeaseStaticStoreFile = LeaseStaticStoreFile;
//# sourceMappingURL=LeaseStaticStoreFile.js.map