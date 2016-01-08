/**
 * http://roadsandhighwayssample.esri.com/roads/api/index.html
 */

export default class Lrs {
    private ajax: Ajax;

    constructor(url: string) {
        this.ajax = new Ajax(url);
    }

    static test() {
        let lrs = new Lrs("http://roadsandhighwayssample.esri.com/arcgis/rest/services/RoadsHighways/NewYork/MapServer/exts/LRSServer/networkLayers/2/geometryToMeasure");

        lrs.geometryToMeasure({
            locations: [{
                routeId: "10050601",
                geometry: {
                    x: -73.93205854118287,
                    y: 41.71805546327077
                }
            }],
            tolerance: 0.001,
            inSR: 4326
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

        lrs.measureToGeometry({
            locations: [{
                routeId: "10050601",
                measure: 0.1
            }],
            outSR: 102100
        }).then((value: {}) => {
            console.log("measureToGeometry", value);
        });
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

        let req = Object.assign({
            inSR: 4326,
            outSR: 4326,
            f: "pjson"
        }, data);

        req.locations = <any>JSON.stringify(req.locations);

        return this.ajax.get(req);
    }

    measureToGeometry(data: {
        locations: Array<{
            routeId: string;
            measure?: number;
            fromMeasure?: number;
            toMeasure?: number;
        }>;
        outSR?: number;
    }) {

        let req = Object.assign({
            outSR: 4326,
            f: "pjson"
        }, data);

        req.locations = <any>JSON.stringify(req.locations);
        return this.ajax.get(req);
    }

    translate(data: {
    }) {

        let req = Object.assign({
            f: "pjson"
        }, data);

        return this.ajax.get(req);
    }

    queryAttributeSet(data: {
    }) {

        let req = Object.assign({
            f: "pjson"
        }, data);

        return this.ajax.get(req);
    }

    checkEvents(data: {
    }) {

        let req = Object.assign({
            f: "pjson"
        }, data);

        return this.ajax.get(req);
    }

    geometryToStation(data: {
    }) {

        let req = Object.assign({
            f: "pjson"
        }, data);

        return this.ajax.get(req);
    }

    stationToGeometry(data: {
    }) {

        let req = Object.assign({
            f: "pjson"
        }, data);

        return this.ajax.get(req);
    }


}