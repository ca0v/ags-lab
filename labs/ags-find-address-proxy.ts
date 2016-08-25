/** 
 * https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=50%20Datastream%20Plaza&f=json&outSR=%7B%22wkid%22%3A102100%2C%22latestWkid%22%3A3857%7D&maxLocations=10
 */

import lang = require("dojo/_base/lang");
import Ajax = require("./ajax");

export default class FindAddress {
    private ajax: Ajax;

    constructor(url: string) {
        this.ajax = new Ajax(url);
    }

    find(data: {
        singleLine: string;
        outFields?: string;
        outSRS?: string;
        maxLocations?: number;
        searchExtent?: string;
        location?: string;
        distance?: number;
        category?: string;
    }) {

        let req = lang.mixin({
            outFields: "*",
            outSRS: "wkid:4326",
            maxLocations: 1,
            distance: 1e5,
            forStorage: false,
            f: "pjson"
        }, data);

        return this.ajax.get(req);
    }

}

export function run() {
    new FindAddress("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates")
        .find({
            singleLine: "50 Datastream Plz, Greenville, South Carolina, 29605",
            location: "-82.41,34.79",
            category: "Address"
        })
        .then((value: {
            spatialReference: {
                wkid: string;
                latestWkid: string;
            };
            candidates: Array<{
                address: string;
                location: {
                    x: number;
                    y: number
                };
                score: number;
                attributes: any;
                extent: {
                    xmin: number;
                    ymin: number;
                    xmax: number;
                    ymax: number;
                }
            }>;
        }) => {
            console.log("location", value.candidates.map(c => c.location));
            console.log(value);
        });
} 
