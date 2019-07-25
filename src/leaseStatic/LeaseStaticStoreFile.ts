/**
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 */
import { debounce } from "debounce";
import * as fs from "fs";
import * as fse from "fs-extra";
import { IDHCPMessage, IOptionsId, IOptionsTxtOrId } from "../model";
import { getDHCPId } from "../options";
import { ILeaseEx, LeaseStaticStoreHelper } from "./ILeaseStaticStore";
import { ILeaseStaticStore } from "./ILeaseStaticStore";

interface IStaticLeaseModel {
    tags: { [key: string]: IOptionsTxtOrId };
    leases: ILeaseExStr[];
}

export interface ILeaseExStr {
    mac: string;
    address: string;
    tag?: string[];
    options?: IOptionsTxtOrId;
}

const assign = (target: IOptionsId, source?: IOptionsTxtOrId) => {
    if (source)
        for (const k in source) {
            const id = getDHCPId(k);
            if (id && !target[id])
                target[id] = source[k];
        }
};

/**
 * basic static Lease conmfiguration module
 */
export class LeaseStaticStoreFile extends LeaseStaticStoreHelper implements ILeaseStaticStore {
    public save: () => void;
    public reload: () => void;

    private file: string;
    private tags: { [key: string]: IOptionsTxtOrId };
    private data: { [key: string]: ILeaseExStr };
    private set: Set<string>;
    private watch: boolean;
    private prettyPrint: boolean;
    private watcher: fs.FSWatcher | null;

    constructor(file: string, option?: { watch?: boolean, debounceMs?: number, prettyPrint?: boolean }) {
        super();
        option = option || {};
        const debounceMs = option.debounceMs || 200;
        this.file = file;
        this.save = debounce(() => this.saveConf(), debounceMs);
        this.reload = debounce(() => this.reloadConf(), debounceMs);
        this.watch = option.watch || false;
        this.prettyPrint = option.prettyPrint || false;
        this.watcher = null;
        this.data = {};
        this.set = new Set();
        this.tags = {};
        let fileData: IStaticLeaseModel | null;
        try {
            fileData = fse.readJSONSync(this.file);
        } catch {
            fileData = null;
        }
        fileData = this.fillConf(fileData);
        this.rebuildData(fileData);
        this.watchConf();
    }

    public addStatic(leases: ILeaseExStr) {
        if (leases.tag)
            leases.tag.filter((tag) => !this.tags[tag]).forEach((tag) => { throw Error(`tag ${tag} is not defined`); });
        this.data[leases.mac] = leases;
        this.set.add(leases.address);
    }

    public delStatic(mac: string) {
        const old = this.data[mac];
        if (old) {
            this.set.delete(old.address);
            delete this.data[mac];
        }
    }

    public getLeaseFromMac(mac: string, request?: IDHCPMessage): ILeaseEx | null {
        const lease = this.data[mac];
        if (!lease)
            return null;
        const options: IOptionsId = {};
        assign(options, lease.options);
        if (lease.tag)
            lease.tag.forEach((tag) => assign(options, this.tags[tag]));
        return { address: lease.address, mac: lease.mac, options };
    }

    public hasAddress(address: string): boolean {
        return this.set.has(address);
    }

    public getReservedIP(): Set<string> {
        return this.set;
    }

    private watchConf() {
        if (!this.watcher && this.watch)
            this.watcher = fs.watch(this.file, {}, (eventType, filename) => this.reload());
    }

    private unwatchConf() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
    }

    private saveConf() {
        this.unwatchConf();
        const exportData: IStaticLeaseModel = {
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

        } else {
            return fse.writeJSON(`${this.file}`, exportData, { spaces: 2 })
                .then(() => this.watchConf());
        }
    }

    private fillConf(fileData?: IStaticLeaseModel | null): IStaticLeaseModel {
        fileData = fileData || {} as IStaticLeaseModel;
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
                        hostname: "Green-1",
                    },
                },
            ];
        return fileData;
    }

    private rebuildData(fileData: IStaticLeaseModel) {
        this.data = {};
        this.set = new Set(); // Object.values(this.data));
        this.tags = fileData.tags;
        fileData.leases.forEach((lease) => this.addStatic(lease));
    }

    private async reloadConf() {
        let fileData: IStaticLeaseModel | null;
        try {
            fileData = await fse.readJSON(this.file);
        } catch {
            fileData = null;
        }
        // TODO FIX Async reload may lead to non correct data durring the loading
        fileData = this.fillConf(fileData);
        this.rebuildData(fileData);
    }
}
