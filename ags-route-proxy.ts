/**
 * http://sampleserver6.arcgisonline.com/arcgis/sdk/rest/index.html#/Network_Layer/02ss0000009p000000/
 */
export default class Route {
    private ajax: Ajax;
    
    constructor(url: string) {
        this.ajax = new Ajax(url);
    }
    
    /**
     * http://sampleserver6.arcgisonline.com/arcgis/sdk/rest/index.html#/Solve_Route/02ss0000001t000000/
     */
    solve(data: {
        stops: Array<{x: number; y: number;}>;
        returnDirections?: boolean;
        returnRoutes?: boolean;                        
    }) {
        let req = Object.assign({
            returnDirections: true,
            returnRoutes: true,
            preserveFirstStop: true,
            preserveLastStop: true,
            directionsLanguage: "en",
            outputGeometryPrecisionUnits: "esriDecimalDegrees",
            directionsOutputType: "esriDOTComplete",
            directionsLengthUnits: "esriNAUMiles",
            f: "pjson"
        }, data);
        
        req.stops = <any>data.stops.map(p => `${p.x},${p.y}`).join(';');
        
        return this.ajax.get(req);
    }
    
    static test() {
        new Route("http://sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/Route/solve")
        .solve({stops: [{x: -117.141724, y: 32.7122},{x: -117.141724, y: 32.72}]})
        .then((value: {
                error?: {
                    code: number; 
                    message: string; 
                    details: string[];
                } 
            }) => {
                // how to get route to return json?
                value = JSON.parse(<any>value);
                if (value.error) {
                    console.error(value.error.message);
                } else {
                console.log("solve", value);
                }
                return value;
            });        
    }
}
