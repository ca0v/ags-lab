import Base from "./ags-solve-proxy";
import lang = require("dojo/_base/lang");

/**
 * http://sampleserver6.arcgisonline.com/arcgis/sdk/rest/index.html#/Network_Layer/02ss0000009p000000/
 */
export default class RouteSolve extends Base {

    /**
     * http://sampleserver6.arcgisonline.com/arcgis/sdk/rest/index.html#/Solve_Route/02ss0000001t000000/
     */
    solve(data: {
        stops: Array<{ x: number; y: number; }>;
        returnDirections?: boolean;
        returnRoutes?: boolean;
    }) {
        let req = lang.mixin({
            returnDirections: true,
            returnRoutes: true,
            preserveFirstStop: true,
            preserveLastStop: true,
            directionsLanguage: "",
            outputGeometryPrecisionUnits: "esriDecimalDegrees",
            directionsOutputType: "esriDOTComplete",
            directionsLengthUnits: "esriNAUMiles",
            f: "pjson"
        }, data);

        req.stops = <any>data.stops.map(p => `${p.x},${p.y}`).join(';');

        return this.ajax.get(req);
    }
}

export function run() {
    new RouteSolve("http://sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/Route/solve")
        .solve({ stops: [{ x: -117.141724, y: 32.7122 }, { x: -117.141724, y: 32.72 }] })
        .then((value: {
            error?: {
                code: number;
                message: string;
                details: string[];
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
