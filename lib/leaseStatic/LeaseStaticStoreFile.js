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
const fs = __importStar(require("fs"));
const fse = __importStar(require("fs-extra"));
const options_1 = require("../options");
const ILeaseStaticStore_1 = require("./ILeaseStaticStore");
const assign = (target, source) => {
    if (source)
        for (const k in source) {
            const id = options_1.getDHCPId(k);
            if (id && !target[id])
                target[id] = source[k];
        }
};
/**
 * basic static Lease conmfiguration module
 */
class LeaseStaticStoreFile extends ILeaseStaticStore_1.LeaseStaticStoreHelper {
    constructor(file, option) {
        super();
        option = option || {};
        const debounceMs = option.debounceMs || 200;
        this.file = file;
        this.save = debounce_1.debounce(() => this.saveConf(), debounceMs);
        this.reload = debounce_1.debounce(() => this.reloadConf(), debounceMs);
        this.watch = option.watch || false;
        this.prettyPrint = option.prettyPrint || false;
        this.watcher = null;
        this.data = {};
        this.set = new Set();
        this.tags = {};
        let fileData;
        try {
            fileData = fse.readJSONSync(this.file);
        }
        catch (_a) {
            fileData = null;
        }
        fileData = this.fillConf(fileData);
        this.rebuildData(fileData);
        this.watchConf();
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
    getLeaseFromMac(mac, request) {
        const lease = this.data[mac];
        if (!lease)
            return null;
        const options = {};
        assign(options, lease.options);
        if (lease.tag)
            lease.tag.forEach((tag) => assign(options, this.tags[tag]));
        return { address: lease.address, mac: lease.mac, options };
    }
    hasAddress(address) {
        return this.set.has(address);
    }
    getReservedIP() {
        return this.set;
    }
    watchConf() {
        if (!this.watcher && this.watch)
            this.watcher = fs.watch(this.file, {}, (eventType, filename) => this.reload());
    }
    unwatchConf() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
    }
    saveConf() {
        this.unwatchConf();
        const exportData = {
            tags: this.tags,
            leases: Object.values(this.data).sort((lease1, lease2) => lease1.mac.localeCompare(lease2.mac)),
        };
        if (this.prettyPrint) {
            let json = '{\n  "tags": {\n';
            json += Object.keys(this.tags).sort().map((tag) => `    "${tag}": ${JSON.stringify(this.tags[tag])}`).join(",\n");
            json += '\n  },\n  "leases": [\n';
            json += exportData.leases.map((lease) => `    ${JSON.stringify(lease)}`).join(",\n");
            json += "\n  ]\n}\n";
            return fse.writeFile(`${this.file}`, json, { encoding: "utf-8" })
                .then(() => this.watchConf());
        }
        else {
            return fse.writeJSON(`${this.file}`, exportData, { spaces: 2 })
                .then(() => this.watchConf());
        }
    }
    fillConf(fileData) {
        fileData = fileData || {};
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
        return fileData;
    }
    rebuildData(fileData) {
        this.data = {};
        this.set = new Set(); // Object.values(this.data));
        this.tags = fileData.tags;
        fileData.leases.forEach((lease) => this.addStatic(lease));
    }
    async reloadConf() {
        let fileData;
        try {
            fileData = await fse.readJSON(this.file);
        }
        catch (_a) {
            fileData = null;
        }
        // TODO FIX Async reload may lead to non correct data durring the loading
        fileData = this.fillConf(fileData);
        this.rebuildData(fileData);
    }
}
exports.LeaseStaticStoreFile = LeaseStaticStoreFile;
//# sourceMappingURL=LeaseStaticStoreFile.js.map