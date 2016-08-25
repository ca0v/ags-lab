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
 * mapserver export 
 */
export default class Export {
    private ajax: Ajax;

    constructor(url: string) {
        this.ajax = new Ajax(url);
    }

    export(data: {
        bbox: Array<number>;
        size?: Array<number>;
        dpi?: number;
        imageSR?: number;
        bboxSR?: number;
        format?: string;
        layerDefs?: Dictionary<DefinitionExpression>;
        layers?: string;
        transparent?: boolean;
        time?: number;
        layerTimeOptions?: Dictionary<{
            useTime: boolean;
            timeDateCumulative: boolean;
            timeOffset: number;
            timeOffsetUnits: string;
        }>;
        dynamicLayers?: Array<{
            id: string;
            source: string;
            definitionExpression: DefinitionExpression;
            layerTimeOptions?: {
                useTime: boolean;
                timeDateCumulative: boolean;
                timeOffset: number;
                timeOffsetUnits: string;
            };
            drawingInfo: {
                renderer: string;
                transparency: number;
                scaleSymbols: boolean;
                showLabels: boolean;
                labelingInfo: any;
            }
        }>;
        mapScale?: number;
    }) {

        let req = lang.mixin({
            size: [512, 512],
            dpi: 96,
            imageSR: 4326,
            bboxSR: 4326,
            format: "png",
            transparent: true,
            f: "pjson"
        }, data);

        req.bbox = <any>req.bbox.join(",");
        req.size = <any>req.size.join(",");

        return this.ajax.get(req);
    }

}

export function run() {
    new Export("//sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/export")
        .export({
            bbox: [-82.4, 34.85, -82.25, 35]
        })
        .then((value: {}) => {
            console.log("export", value);
        });
}
