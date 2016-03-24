/**
 * http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/find?searchText=Woonsocket&contains=true&searchFields=&sr=&layers=0%2C2&layerdefs=&returnGeometry=true&maxAllowableOffset=&f=pjson
 */

import lang = require("dojo/_base/lang");
import Ajax = require("./ajax");

interface Dictionary<T> {
    [n: string]: T;
}

interface DefinitionExpression {
    field: string;
    op: string;
    value: string;
}
        
/**
 * mapserver find 
 */
export default class Find {
    private ajax: Ajax;

    constructor(url: string) {
        this.ajax = new Ajax(url);
    }

    find(data: {
        searchText: string;
        contains?: boolean;
        searchFields?: Array<string>;
        sr?: number;
        layerDefs?: Dictionary<DefinitionExpression>;
        layers: Array<string>;
        returnGeometry?: boolean;
        maxAllowableOffset?: number;
        geometryPrecision?: number;
        dynamicLayers?: Array<{
            id: string;
            source: string;
            definitionExpression: DefinitionExpression;
        }>;
        returnZ?: boolean;
        returnM?: boolean;
    }) {

        let req = lang.mixin({
            sr: 4326,
            f: "pjson"
        }, data);
        
        req.layers = <any>req.layers.join(",");

        return this.ajax.get(req);
    }

    public static test() {
        new Find("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/find")
            .find({
                searchText: "island",
                layers: ["0"]
            })
            .then((value: {
                results: Array<{
                    layerId: string;
                    layerName: string;
                    displayFieldName: string;
                    foundFieldName: string;
                    value: string;
                    attributes: any;
                    geometryType: string;
                    geometry: any;
                }>;
            }) => {
                console.log("find", value);
            });
    }
}