/**
 * geocode find 
 */

import lang = require("dojo/_base/lang");
import Ajax = require("./ajax");

export default class Find {
    private ajax: Ajax;
    
    constructor(url: string) {
        this.ajax = new Ajax(url);
    }
 
    find(data: {
        text?: string;
        outFields?: string;
        outSRS?: string;
        maxLocations?: number;
        bbox?: string;
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
    
    public static test() {
        new Find("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find")
        .find({
            text: "50 Datastream Plz, Greenville, South Carolina, 29605",
            location: "-82.41,34.79",
            category: "Address"            
        })
        .then((value: {
            spatialReference: {
                wkid: string;
                latestWkid: string;
            };
            locations: Array<{
                name: string;
                feature: {
                    geometry: {
                        x: number; 
                        y: number
                    }
                };
                attributes: any;
                extent: {
                    xmin: number;
                    ymin: number;
                    xmax: number;
                    ymax: number;
                }
            }>;
        }) => {
            console.log("location", value.locations.map(c => c.name));
            console.log(value);
        });
    } 
}