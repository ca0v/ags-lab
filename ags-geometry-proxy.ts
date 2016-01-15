/**
 * geometry services
 * http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer/distance 
 */

import Units = require("esri/units");
import lang = require("dojo/_base/lang");

// see http://resources.esri.com/help/9.3/ArcGISDesktop/ArcObjects/esriGeometry/esriSRUnitType.htm
enum esriSRUnitType {
    Meter = 9001,
    Kilometer = 9036
}

export default class Geometry {
    private ajax: Ajax;

    constructor(url: string) {
        this.ajax = new Ajax(url);
    }

    lengths(data: {
        polylines: Array<{ paths: number[][][] }>;
        sr?: number;
        lengthUnit?: number;
        calculationType?: string;
    }) {

        let req = lang.mixin({
            sr: 4326,
            calculationType: "geodesic",
            lengthUnit: esriSRUnitType.Meter,
            f: "pjson"
        }, data);

        req.polylines = <any>JSON.stringify(req.polylines);
        return this.ajax.get(req);
    }

    public static test() {
        new Geometry("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer/lengths")
            .lengths({
                polylines: [{ "paths": [[[-117, 34], [-116, 34], [-117, 33]], [[-115, 44], [-114, 43], [-115, 43]]] }]
            })
            .then((value: {}) => {
                console.log("lengths", value);
            });
    }
}