/**
 * http://roadsandhighwayssample.esri.com/roads/api/index.html
 * http://roadsandhighwayssample.esri.com/ROADS/SAMPLES/
 */

import lang = require("dojo/_base/lang");
import Ajax = require("./ajax");

interface Location {
    routeId: string;
    measure?: number;
    fromMeasure?: number;
    toMeasure?: number;
}

export default class Lrs {
    private ajax: Ajax;

    constructor(url: string) {
        this.ajax = new Ajax(url);
    }

    geometryToMeasure(data: {
        locations: Array<{
            routeId?: string;
            geometry: { x: number; y: number; }
        }>;
        tolerance: number;
        inSR?: number;
        outSR?: number;
    }) {

        let req = lang.mixin({
            inSR: 4326,
            outSR: 4326,
            f: "pjson"
        }, data);

        req.locations = <any>JSON.stringify(req.locations);

        return this.ajax.get(req);
    }

    measureToGeometry(data: {
        locations: Array<Location>;
        outSR?: number;
    }) {

        let req = lang.mixin({
            outSR: 4326,
            f: "pjson"
        }, data);

        req.locations = <any>JSON.stringify(req.locations);
        return this.ajax.get(req);
    }

    translate(data: {
        locations: Array<Location>;
        targetNetworkLayerIds: Array<number>;
        tolerance?: number;
        temporalViewDate?: number;
    }) {

        let req = lang.mixin({
            tolerance: 0,
            f: "pjson"
        }, data);

        req.locations = <any>JSON.stringify(req.locations);
        req.targetNetworkLayerIds = <any>`[${req.targetNetworkLayerIds}]`;
        return this.ajax.get(req);
    }

    queryAttributeSet(data: {
        locations: Array<Location>;
        attributeSet: Array<{
            layerId: number;
            fields: Array<string>;
        }>;
        temporalViewDate?: number;
        outSR?: number;
    }) {

        let req = lang.mixin({
            outSR: 4326,
            f: "pjson"
        }, data);

        req.locations = <any>JSON.stringify(req.locations);
        req.attributeSet = <any>JSON.stringify(req.attributeSet);

        return this.ajax.get(req);
    }

    checkEvents(data: {
    }) {

        let req = lang.mixin({
            f: "pjson"
        }, data);

        return this.ajax.get(req);
    }

    geometryToStation(data: {
    }) {

        let req = lang.mixin({
            f: "pjson"
        }, data);

        return this.ajax.get(req);
    }

    stationToGeometry(data: {
    }) {

        let req = lang.mixin({
            f: "pjson"
        }, data);

        return this.ajax.get(req);
    }


}

export function run() {

    // geometryToMeasure
    new Lrs("//roadsandhighwayssample.esri.com/arcgis/rest/services/RoadsHighways/NewYork/MapServer/exts/LRSServer/networkLayers/2/geometryToMeasure")
        .geometryToMeasure({
            locations: [{
                routeId: "10050601",
                geometry: {
                    x: 588947,
                    y: 4619012
                }
            }],
            tolerance: 0.1,
            inSR: 26918
        }).then((value: {
            unitsOfMeasure: string;
            spatialReference: {
                wkid: number;
            };
            locations: Array<{
                status: string;
                results: Array<string>;
            }>;
        }) => {
            console.log("geometryToMeasure", value);
        });

    // measureToGeometry
    new Lrs("//roadsandhighwayssample.esri.com/arcgis/rest/services/RoadsHighways/NewYork/MapServer/exts/LRSServer/networkLayers/2/measureToGeometry")
        .measureToGeometry({
            locations: [{
                routeId: "10050601",
                measure: 0.071
            }],
            outSR: 102100
        }).then((value: {}) => {
            console.log("measureToGeometry", value);
        });

    // translate
    new Lrs("//roadsandhighwayssample.esri.com/arcgis/rest/services/RoadsHighways/NewYork/MapServer/exts/LRSServer/networkLayers/2/translate")
        .translate({
            locations: [{
                routeId: "10050601",
                measure: 0.071
            }],
            targetNetworkLayerIds: [2, 3]
        }).then((value: {
            locations: Array<{
                routeId: string;
                measure: number;
                translateLocations: Array<{
                    networkLayerId: number;
                    routeId: string;
                    measure: number;
                }>;
            }>;
        }) => {
            console.log("translate", value);
        });

    // query attribute set
    new Lrs("//roadsandhighwayssample.esri.com/arcgis/rest/services/RoadsHighways/NewYork/MapServer/exts/LRSServer/networkLayers/2/queryAttributeSet")
        .queryAttributeSet({
            locations: [{
                routeId: "10050601",
                measure: 0.071
            }],
            attributeSet: [{
                layerId: 0,
                fields: "rid,meas,distance,comment_".split(',')
            }]
        }).then((value: {}) => {
            console.log("queryAttributeSet", value);
        });

    // TODO: check events

    // TODO: geometry to station

    // TODO: station to geometry
}

