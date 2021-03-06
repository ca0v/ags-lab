/**
 * //sampleserver6.arcgisonline.com/arcgis/rest/?f=pjson 
 */

import lang = require("dojo/_base/lang");
import FeatureServer from "./ags-feature-proxy";
import Ajax = require("./ajax");

interface Service {
    name: string;
    type: string;
}

interface CatalogInfo {
    currentVersion: number;
    folders: string[];
    services: Service[];
}

export default class Catalog {
    private ajax: Ajax;

    constructor(url: string) {
        this.ajax = new Ajax(url);
    }

    about(data?: any) {

        let req = lang.mixin({
            f: "pjson"
        }, data);

        return this.ajax.get<CatalogInfo>(req);
    }

    aboutFolder(folder: string) {

        let ajax = new Ajax(`${this.ajax.url}/${folder}`);
        let req = lang.mixin({
            f: "pjson"
        }, {});

        return ajax.get<CatalogInfo>(req);
    }

}

export function run() {
    let url = "//sampleserver6.arcgisonline.com/arcgis/rest/services"
    let service = new Catalog(url);
    service
        .about()
        .then(value => {
            console.log("about", value);
            value.services.filter(s => s.type === "FeatureServer").forEach(s => {
                let featureService = new FeatureServer(`${url}/${s.name}/FeatureServer`);
                featureService.about().then(s => console.log("featureServer", s));
            });
            value.folders.forEach(f => {
                service.aboutFolder(f).then(value => {
                    console.log("folder", f, value);
                })
            })
        });
}
