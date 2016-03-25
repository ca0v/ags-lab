import Ajax = require("../ajax");

export module Routing {

    export interface Activity {
        moniker: string;
        primaryKey: number;
    }

    export interface Location {
        x: number;
        y: number;
    }

    export interface RouteItem {
        isActivityCompleted: boolean;
        ordinalIndex: number;
        activity: Activity;
        location: Location;
        activityParentType: string;
        scheduledDate: string;
        activityType: string;
        lastModifiedBy: string;
        lastModifiedDateTime: string;
        id: number;
        href: string;
    }

    export interface Route {
        employeeId: string;
        routeDate: string;
        startLocation: Location;
        endLocation: Location;
        routeItems: RouteItem[];
        lastModifiedBy: string;
        lastModifiedDateTime: string;
        id: number;
        href: string;
    }

    export interface ResponseStatus {
        severity: string;
    }

    export interface RouteResponse {
        data: Array<Route>;
        responseStatus: ResponseStatus;
    }

}

export class Routing {

    constructor(public api = "http://usrcdpscovis01/restservices/api") {
    }

    auth(userName = "Hansen8") {
        let ajax = new Ajax(`${this.api}/auth?username=${userName}&password=`);
        return ajax.get<{sessionId: string}>();
    }

    getRoutes() {
        let ajax = new Ajax(`${this.api}/routing/routes`);
        ajax.options.use_cors = true;
        ajax.options.use_json = true;
        ajax.options.use_jsonp = false;
        
        return ajax.get<Routing.RouteResponse>().then(routes => {
            // until Phil gets coordinates working...spoof some locations
            let extent = [-117.13, 32.73, -117.12, 32.74];
            let count = routes.data.length;

            let randomLocation = (i: number) => ({
                x : extent[0] + Math.random() * (extent[2] - extent[0]) * (1 + i % count) / count,
                y : extent[1] + Math.random() * (extent[2] - extent[0]) * (1 + i % count) / count
            });
            
            routes.data.forEach((r, i) => {
                r.startLocation = randomLocation(i);
                r.endLocation = randomLocation(i);
                r.routeItems.forEach(ri => ri.location  = randomLocation(i))
            });
            
            return routes;
        });
    }

    optimizeRoute(routeId: number) {
        let ajax = new Ajax(`${this.api}/routing/routes/optimize`);
        return ajax.put<Routing.Route>({
            Id: routeId
        });
    }    

    updateRoute(routeId: number, routeItems: number[]) {
        console.log("updateRoute", routeId, routeItems);
        let ajax = new Ajax(`${this.api}/routing/routes/orderchanged`);
        return ajax.put<Routing.Route>({
            Id: routeId,
            Items: routeItems
        });
    }    
}
