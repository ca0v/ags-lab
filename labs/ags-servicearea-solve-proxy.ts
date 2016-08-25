import Base from "./ags-solve-proxy";
import lang = require("dojo/_base/lang");

export default class ServiceAreaSolve extends Base {

    solve(data: {
        facilities: string | {
            features: Array<{
                attributes: any;
                geometry: {
                    x: number;
                    y: number;
                }
            }>;
        };
        outSR: number;
        returnFacilities: boolean;
        travelDirection?: string;
        returnRoutes?: boolean;
    }) {
        /**
         * ?facilities=
            // {"features": [{
            // "attributes": {
            //     "Name": "San Francisco Museum of Modern Art",
            //     "Breaks_Length" : 10.0
            // },
            // "geometry": {
            //     "x": -122.401134465,
            //     "y": 37.7857056500001
            //     }
            // }]}
         * &barriers={}
         * &polylineBarriers={}
         * &polygonBarriers={}
         * &defaultBreaks=5.0
         * &excludeSourcesFromPolygons=
         * &mergeSimilarPolygonRanges=false
         * &overlapLines=false
         * &overlapPolygons=false
         * &splitLinesAtBreaks=false
         * &splitPolygonsAtBreaks=false
         * &trimOuterPolygon=false
         * &trimPolygonDistance=100.0
         * &trimPolygonDistanceUnits=esriMeters
         * &outSR=26911
         * &accumulateAttributeNames=
         * &impedanceAttributeName=Length
         * &restrictionAttributeNames=
         * &attributeParameterValues=
         * &restrictUTurns=esriNFSBAllowBacktrack
         * &returnFacilities=true
         * &returnBarriers=true
         * &returnPolylineBarriers=false
         * &returnPolygonBarriers=false
         * &outputLines=esriNAOutputLineNone
         * &outputPolygons=esriNAOutputPolygonSimplified
         * &travelDirection=esriNATravelDirectionFromFacility
         * &outputGeometryPrecision=0.01
         * &outputGeometryPrecisionUnits=esriMeters
         * &f=html
        */
        let req = lang.mixin({
            travelDirection: "esriNATravelDirectionFromFacility",
            returnFacilities: false,
            f: "pjson"
        }, data);

        return this.ajax.get(req);
    }
}

export function run() {
    new ServiceAreaSolve("http://sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/ServiceArea/solveServiceArea")
        .solve({
            facilities: "-117.141724,32.7122",
            returnFacilities: true,
            outSR: 4326
        })
        .then((value: {
            error?: {
                code: number;
                message: string;
                details: string[];
            };
            saPolygons: {
                spatialReference: {
                    wkid: number;
                };
                features: Array<{
                    attributes: any;
                    geometry: {
                        rings: number[][][];
                    }
                }>;
                facilities: {
                    spatialReference: {
                        wkid: number;
                    };
                    features: Array<{
                        attributes: any;
                        geometry: {
                            x: number;
                            y: number;
                        }
                    }>;
                };
                messages: string[];
            }
        }) => {
            // how to get route to return json?
            if (value.error) {
                console.error(value.error.message);
            } else {
                console.log("solve", value);
            }
            return value;
        });
}
