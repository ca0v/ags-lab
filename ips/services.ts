/**
 * See http://wiki.infor.com:8080/confluence/display/IPSECTOR/Routing+POC%3A+Rest+Services+Interface
 */
import Ajax = require("../ajax");
import lang = require("dojo/_base/lang");
import all = require("dojo/promise/all");
import Deferred = require("dojo/Deferred");

const __DEV__ = 0;

class test {
    static ips_route_response = <Routing.RouteResponse>{
    "data": [{
        "employeeId": "10313",
        "employeeFullName": "Phil S",
        "routeDate": "2016-04-05T08:57:42",
        "startLocation": {
            "x": 0,
            "y": 0
        },
        "endLocation": {
            "x": 0,
            "y": 0
        },
        "routeItems": [{
            "ordinalIndex": 2,
            "activity": {
                "moniker": "Hansen.CDR.Building.Inspection",
                "primaryKey": 1013
            },
            "location": {
                "x": 0,
                "y": 0
            },
            "activityParentType": "DEMO",
            "scheduledDate": "2016-03-21T00:00:00",
            "activityType": "M-Insp",
            "isActivityCompleted": false,
            "lastModifiedBy": "HANSEN8",
            "lastModifiedDateTime": "2016-04-05T09:42:56.777",
            "id": 1539,
            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1539}]}"
        },
        {
            "ordinalIndex": 3,
            "activity": {
                "moniker": "Hansen.CDR.Building.Inspection",
                "primaryKey": 1014
            },
            "location": {
                "x": 0,
                "y": 0
            },
            "activityParentType": "DEMO",
            "scheduledDate": "2016-03-21T00:00:00",
            "activityType": "M-Insp",
            "isActivityCompleted": false,
            "lastModifiedBy": "HANSEN8",
            "lastModifiedDateTime": "2016-04-05T09:42:56.777",
            "id": 1540,
            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1540}]}"
        },
        {
            "ordinalIndex": 1,
            "activity": {
                "moniker": "Hansen.CDR.Building.Inspection",
                "primaryKey": 1021
            },
            "location": {
                "x": "-115.252869380492",
                "y": 36.1904151260815
            },
            "activityParentType": "UseDeposit",
            "scheduledDate": "2016-04-05T08:57:42",
            "activityType": "Insp 1",
            "isActivityCompleted": true,
            "lastModifiedBy": "HANSEN8",
            "lastModifiedDateTime": "2016-04-05T09:42:56.777",
            "id": 1553,
            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1553}]}"
        }],
        "lastModifiedBy": "",
        "lastModifiedDateTime": "0001-01-01T00:00:00",
        "id": 1170,
        "href": "/generic/Hansen.Routing.Route?query={select:[ActivityDate,AddedBy,AddedDateTime,EndGpsXCoordinate,EndGpsYCoordinate,EndGpsZCoordinate,LastModifiedBy,LastModifiedDateTime,RouteKey,StartGpsXCoordinate,StartGpsYCoordinate,StartGpsZCoordinate],distinct:False,filter:[{property:RouteKey,operator:Equal,value:1170}]}"
    },
    {
        "employeeId": "1003",
        "employeeFullName": "Rob Roberts",
        "routeDate": "2016-04-05T09:06:20",
        "startLocation": {
            "x": 0,
            "y": 0
        },
        "endLocation": {
            "x": 0,
            "y": 0
        },
        "routeItems": [{
            "ordinalIndex": 1,
            "activity": {
                "moniker": "Hansen.CDR.Building.Inspection",
                "primaryKey": 1015
            },
            "location": {
                "x": "-115.232380018892",
                "y": 36.172993425676
            },
            "activityParentType": "DEMO",
            "scheduledDate": "2016-03-21T00:00:00",
            "activityType": "Insp",
            "isActivityCompleted": false,
            "lastModifiedBy": "",
            "lastModifiedDateTime": "0001-01-01T00:00:00",
            "id": 1547,
            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1547}]}"
        },
        {
            "ordinalIndex": 2,
            "activity": {
                "moniker": "Hansen.CDR.Building.Inspection",
                "primaryKey": 1016
            },
            "location": {
                "x": "-115.232380018892",
                "y": 36.172993425676
            },
            "activityParentType": "DEMO",
            "scheduledDate": "2016-03-21T00:00:00",
            "activityType": "Insp",
            "isActivityCompleted": false,
            "lastModifiedBy": "",
            "lastModifiedDateTime": "0001-01-01T00:00:00",
            "id": 1548,
            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1548}]}"
        },
        {
            "ordinalIndex": 3,
            "activity": {
                "moniker": "Hansen.CDR.Building.Inspection",
                "primaryKey": 1017
            },
            "location": {
                "x": "-115.232380018892",
                "y": 36.172993425676
            },
            "activityParentType": "DEMO",
            "scheduledDate": "2016-03-21T00:00:00",
            "activityType": "Insp",
            "isActivityCompleted": false,
            "lastModifiedBy": "",
            "lastModifiedDateTime": "0001-01-01T00:00:00",
            "id": 1549,
            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1549}]}"
        },
        {
            "ordinalIndex": 4,
            "activity": {
                "moniker": "Hansen.CDR.Building.Inspection",
                "primaryKey": 1018
            },
            "location": {
                "x": "-115.232380018892",
                "y": 36.172993425676
            },
            "activityParentType": "DEMO",
            "scheduledDate": "0001-01-01T00:00:00",
            "activityType": "Insp",
            "isActivityCompleted": false,
            "lastModifiedBy": "",
            "lastModifiedDateTime": "0001-01-01T00:00:00",
            "id": 1550,
            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1550}]}"
        },
        {
            "ordinalIndex": 5,
            "activity": {
                "moniker": "Hansen.CDR.Building.Inspection",
                "primaryKey": 1019
            },
            "location": {
                "x": "-115.256673787042",
                "y": 36.194162517804
            },
            "activityParentType": "DEMO",
            "scheduledDate": "0001-01-01T00:00:00",
            "activityType": "Insp",
            "isActivityCompleted": false,
            "lastModifiedBy": "",
            "lastModifiedDateTime": "0001-01-01T00:00:00",
            "id": 1551,
            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1551}]}"
        },
        {
            "ordinalIndex": 6,
            "activity": {
                "moniker": "Hansen.CDR.Building.Inspection",
                "primaryKey": 1020
            },
            "location": {
                "x": "-115.256673787042",
                "y": 36.194162517804
            },
            "activityParentType": "DEMO",
            "scheduledDate": "2016-03-22T00:00:00",
            "activityType": "M-Insp",
            "isActivityCompleted": false,
            "lastModifiedBy": "",
            "lastModifiedDateTime": "0001-01-01T00:00:00",
            "id": 1552,
            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1552}]}"
        },
        {
            "ordinalIndex": 7,
            "activity": {
                "moniker": "Hansen.CDR.Building.Inspection",
                "primaryKey": 1022
            },
            "location": {
                "x": 0,
                "y": 0
            },
            "activityParentType": "DEMO",
            "scheduledDate": "2016-03-22T00:00:00",
            "activityType": "M-Insp",
            "isActivityCompleted": false,
            "lastModifiedBy": "HANSEN8",
            "lastModifiedDateTime": "2016-04-05T09:42:45.7",
            "id": 1554,
            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1554}]}"
        }],
        "lastModifiedBy": "",
        "lastModifiedDateTime": "0001-01-01T00:00:00",
        "id": 1174,
        "href": "/generic/Hansen.Routing.Route?query={select:[ActivityDate,AddedBy,AddedDateTime,EndGpsXCoordinate,EndGpsYCoordinate,EndGpsZCoordinate,LastModifiedBy,LastModifiedDateTime,RouteKey,StartGpsXCoordinate,StartGpsYCoordinate,StartGpsZCoordinate],distinct:False,filter:[{property:RouteKey,operator:Equal,value:1174}]}"
    }],
    "responseStatus": {
        "severity": "Success"
    }
};

}

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
        employeeFullName: string;
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

    constructor(public api: string) {
    }

    auth(id: { username: string; password: string }) {
        let ajax = new Ajax(`${this.api}/auth?username=${id.username}&password=${id.password}`);
        return ajax.get<{ sessionId: string }>();
    }

    forceSampleRoutes() {
        //if (!__DEV__) throw "you must set __DEV__ first";

        let extent = [-115.24, 36.16, -115.22, 36.18];
        let routeItems = test.ips_route_response.data.filter(r => r.employeeId === "1003");         
        let count = routeItems.length;

        let randomLocation = (i: number) => ({
            x: extent[0] + Math.random() * (extent[2] - extent[0]) * (1 + i % count) / count,
            y: extent[1] + Math.random() * (extent[2] - extent[0]) * (1 + i % count) / count
        });


        let ajax = new Ajax(`${this.api}/routing/routes`);
        
        let routes = routeItems.map((route, i) => ({
            employeeId: route.employeeId,
            routeDate: new Date().toISOString(),
            startLocation: randomLocation(i),
            endLocation: randomLocation(i),
            routeItems: route.routeItems.map(item => ({
                activity: item.activity,
                ordinalIndex: item.ordinalIndex,
                location: randomLocation(i)
            }))
        }));

        let result = <Array<Routing.RouteItem>>[];
        let d = new Deferred<Array<Routing.RouteItem>>();

        let doit = () => {
            if (!routes.length) {
                d.resolve(result);
                return;
            }

            ajax.post<{ data: Routing.RouteItem }>(routes.pop())
                .then(routes => {
                    result.push(routes.data);
                    doit();
                });

        };
        doit();

        return d.promise;        
    }

    createRoutes() {
        if (__DEV__) throw "you must set __DEV__ first";
        let ajax = new Ajax(`${this.api}/routing/routes`);
        return ajax.post<Routing.RouteResponse>();
    }

    getRoutes(args: {
        routeDate?: Date;
        employeeId?: string;
    } = {}) {
        let ajax = new Ajax(`${this.api}/routing/routes`);
        ajax.options.use_cors = true;
        ajax.options.use_json = true;
        ajax.options.use_jsonp = false;

        let params = lang.mixin({ routeDate: new Date(), employeeId: "" }, args);
        params.routeDate = <any>params.routeDate.toISOString().substring(0, 10);

        return (__DEV__ ? ajax.stub(test.ips_route_response) : ajax.get<Routing.RouteResponse>(params)).then(routes => {
            routes.data.forEach((r, i) => {
                r.employeeFullName = r.employeeFullName || r.employeeId;
            });

            if (__DEV__) {
                // spoof some locations
                let extent = [-115.24, 36.16, -115.22, 36.18];
                let count = routes.data.length;

                let randomLocation = (i: number) => ({
                    x: extent[0] + Math.random() * (extent[2] - extent[0]) * (1 + i % count) / count,
                    y: extent[1] + Math.random() * (extent[2] - extent[0]) * (1 + i % count) / count
                });


                routes.data.forEach((r, i) => {
                    r.startLocation = randomLocation(i);
                    r.endLocation = randomLocation(i);
                    r.routeItems.forEach(ri => ri.location = randomLocation(i))
                });
            }

            return routes;
        });
    }

    optimizeRoute(routeId: number) {
        if (__DEV__) throw "you must set __DEV__ first";
        let ajax = new Ajax(`${this.api}/routing/routes/optimize`);
        return ajax.put<{
            data: Routing.Route;
            responseStatus: Routing.ResponseStatus;
        }>({
            Id: routeId,
            Parameters: {}
        });
    }

    updateRoute(routeId: number, routeItems: number[]) {
        if (__DEV__) throw "you must set __DEV__ first";
        console.log("updateRoute", routeId, routeItems);
        let ajax = new Ajax(`${this.api}/routing/routes/orderchanged`);
        return ajax.put<Routing.Route>({
            Id: routeId,
            Items: routeItems
        });
    }
}
