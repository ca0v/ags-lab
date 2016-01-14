/**
 * http://sampleserver1.arcgisonline.com/ArcGIS/SDK/REST/identify.html
 */

import lang = require("dojo/_base/lang");

interface Dictionary<T> {
    [n: string]: T;
}

interface DefinitionExpression {
    field: string;
    op: string;
    value: string;
}
        
/**
 * mapserver identify
 */
export default class Identify {
    private ajax: Ajax;

    constructor(url: string) {
        this.ajax = new Ajax(url);
    }

    identify(data: {
        geometry: Array<number>;
        geometryType: string;
        sr?: number;
        layerDefs?: Dictionary<DefinitionExpression>;
        time?: number;
        layerTimeOptions?: Dictionary<{
            userTime: boolean;
            timeDateCumulative?: boolean;
            timeOffset?: number;
            timeOffsetUnits?: string;
        }>;
        layers?: string;
        tolerance?: number;
        mapExtent: Array<number>;
        imageDisplay: {
            width: number;
            height: number;
            dpi: number;
        };
        returnGeometry?: boolean;
        maxAllowableOffset?: number;
    }) {

        let req = lang.mixin({
            sr: 4326,
            tolerance: 10,
            f: "pjson"
        }, data);

        req.mapExtent = <any>req.mapExtent.join(",");
        req.imageDisplay = <any>`${req.imageDisplay.width},${req.imageDisplay.height},${req.imageDisplay.dpi}`;

        return this.ajax.get<{
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
            }>(req);
    }

    public static test() {
        new Identify("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StateCityHighway_USA/MapServer/identify")
            .identify({
                geometryType: "esriGeometryPoint",
                geometry: [-82.4,34.85],
                mapExtent: [-83,34,-82,35],
                imageDisplay: {
                    width: 400,
                    height: 300,
                    dpi: 96
                },
                tolerance: 0
            })
            .then(value => {
                console.log("identify", value);
            });
    }
}