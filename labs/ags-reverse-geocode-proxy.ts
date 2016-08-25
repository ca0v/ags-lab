/**
 * http://resources.arcgis.com/EN/HELP/REST/APIREF/INDEX.HTML?REVERSE.HTML 
 */

import lang = require("dojo/_base/lang");
import Ajax = require("./ajax");

export default class ReverseGeocode {
    private ajax: Ajax;

    constructor(url: string) {
        this.ajax = new Ajax(url);
    }

    reverseGeocode(data: {
        location: string;
        distance?: number;
        outSR?: string;
        langCode?: string;
        returnIntersection?: boolean;
    }) {

        let req = lang.mixin({
            outSRS: "wkid:4326",
            distance: 10,
            langCode: "en",
            forStorage: false,
            returnIntersection: false,
            f: "pjson"
        }, data);

        return this.ajax.get(req);
    }

}

export function run() {
    new ReverseGeocode("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode")
        .reverseGeocode({
            location: "-82.407548,34.790207"
        })
        .then((value: {
            error: {
                code: number;
                message: string;
                details: Array<string>;
            };
            address: {
                Address: string;
                Neightborhood: string;
                City: string;
                Subregion: string;
                Region: string;
                Postal: string;
                PostalExt: string;
                CountryCode: string;
                State: string;
                Zip: string;
                Loc_name: string;
            };
            location: {
                x: number;
                y: number;
                spatialReference: {
                    wkid: number;
                    latestWkid: number;
                }
            }
        }) => {
            console.log("ReverseGeocode", value.address);
            console.log(value);
        });
} 
