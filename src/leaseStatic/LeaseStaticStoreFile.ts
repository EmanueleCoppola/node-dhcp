import { debounce } from "debounce";
import * as fse from "fs-extra";
import { ILeaseEx } from "../Lease";
import { IDHCPMessage, IOptionsId, IOptionsTxt, OptionId } from "../model";
import { getDHCPId } from "../options";
import { ILeaseStaticStore } from "./ILeaseStaticStore";

interface IStaticLeaseModel {
    tags: { [key: string]: IOptionsTxt };
    leases: ILeaseExStr[];
}

export interface ILeaseExStr {
    mac: string;
    address: string;
    tag?: string[];
    options?: IOptionsTxt;
}

const apply = (src: IOptionsTxt, dest: IOptionsId) => {
    if (src)
        for (const k in src) {
            const id = getDHCPId(k);
            if (id && !dest[id])
                dest[id] = src[k];
        }
};

/**
 * basic static Lease conmfiguration module
 */
export class LeaseStaticStoreFile implements ILeaseStaticStore {
    public save: () => void;

    private file: string;
    private tags: { [key: string]: IOptionsTxt };
    private data: { [key: string]: ILeaseExStr };
    private set: Set<string>;

    constructor(file: string) {
        this.file = file;
        this.save = debounce(() => this._save(), 200);
        let fileData: IStaticLeaseModel;
        try {
            fileData = fse.readJSONSync(file);
        } catch {
            fileData = {} as IStaticLeaseModel;
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

    public getLease(mac: string, request: IDHCPMessage): ILeaseEx | null {
        const lease = this.data[mac];
        if (!lease)
            return;
        const out: ILeaseEx = { address: lease.address, mac: lease.mac, options: {} };
        apply(lease.options, out.options);
        if (lease.tag)
            lease.tag.forEach((tag) => apply(this.tags[tag], out.options));
        return out;
    }

    public getReservedIP(): Set<string> {
        return this.set;
    }

    private _save() {
        const exportData: IStaticLeaseModel = {
            tags: this.tags,
            leases: Object.values(this.data),
        };
        return fse.writeJSON(`${this.file}`, exportData, { spaces: 2 });
    }
}
