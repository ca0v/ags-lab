import Ajax = require("../ajax");

const ips_route_response = <Routing.RouteResponse> {
    "data": [{
        "employeeId": "10313",
        "routeDate": "2016-03-21T00:00:00",
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
            "scheduledDate": "2016-03-21T16:13:23",
            "activityType": "M-Insp",
            "isActivityCompleted": false,
            "lastModifiedBy": "HANSEN8",
            "lastModifiedDateTime": "2016-03-28T10:17:32.023",
            "id": 1328,
            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1328}]}"
        },
            {
                "ordinalIndex": 1,
                "activity": {
                    "moniker": "Hansen.CDR.Building.Inspection",
                    "primaryKey": 1014
                },
                "location": {
                    "x": 0,
                    "y": 0
                },
                "activityParentType": "DEMO",
                "scheduledDate": "2016-03-21T16:13:23",
                "activityType": "M-Insp",
                "isActivityCompleted": false,
                "lastModifiedBy": "HANSEN8",
                "lastModifiedDateTime": "2016-03-28T10:17:32.027",
                "id": 1329,
                "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1329}]}"
            }],
        "lastModifiedBy": "",
        "lastModifiedDateTime": "0001-01-01T00:00:00",
        "id": 1129,
        "href": "/generic/Hansen.Routing.Route?query={select:[ActivityDate,AddedBy,AddedDateTime,EndGpsXCoordinate,EndGpsYCoordinate,EndGpsZCoordinate,LastModifiedBy,LastModifiedDateTime,RouteKey,StartGpsXCoordinate,StartGpsYCoordinate,StartGpsZCoordinate],distinct:False,filter:[{property:RouteKey,operator:Equal,value:1129}]}"
    },
        {
            "employeeId": "1003",
            "routeDate": "2016-03-21T00:00:00",
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
                    "x": 0,
                    "y": 0
                },
                "activityParentType": "DEMO",
                "scheduledDate": "2016-03-21T16:13:23",
                "activityType": "Insp",
                "isActivityCompleted": false,
                "lastModifiedBy": "HANSEN8",
                "lastModifiedDateTime": "2016-03-28T06:03:13.723",
                "id": 1330,
                "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1330}]}"
            },
                {
                    "ordinalIndex": 2,
                    "activity": {
                        "moniker": "Hansen.CDR.Building.Inspection",
                        "primaryKey": 1016
                    },
                    "location": {
                        "x": 0,
                        "y": 0
                    },
                    "activityParentType": "DEMO",
                    "scheduledDate": "2016-03-21T16:13:23",
                    "activityType": "Insp",
                    "isActivityCompleted": false,
                    "lastModifiedBy": "HANSEN8",
                    "lastModifiedDateTime": "2016-03-28T06:03:13.77",
                    "id": 1331,
                    "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1331}]}"
                },
                {
                    "ordinalIndex": 3,
                    "activity": {
                        "moniker": "Hansen.CDR.Building.Inspection",
                        "primaryKey": 1017
                    },
                    "location": {
                        "x": 0,
                        "y": 0
                    },
                    "activityParentType": "DEMO",
                    "scheduledDate": "2016-03-21T16:13:23",
                    "activityType": "Insp",
                    "isActivityCompleted": false,
                    "lastModifiedBy": "HANSEN8",
                    "lastModifiedDateTime": "2016-03-28T06:03:13.77",
                    "id": 1332,
                    "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1332}]}"
                },
                {
                    "ordinalIndex": 4,
                    "activity": {
                        "moniker": "Hansen.CDR.Building.Inspection",
                        "primaryKey": 1018
                    },
                    "location": {
                        "x": 0,
                        "y": 0
                    },
                    "activityParentType": "DEMO",
                    "scheduledDate": "2016-03-21T16:13:23",
                    "activityType": "Insp",
                    "isActivityCompleted": false,
                    "lastModifiedBy": "HANSEN8",
                    "lastModifiedDateTime": "2016-03-28T06:03:13.77",
                    "id": 1333,
                    "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1333}]}"
                },
                {
                    "ordinalIndex": 5,
                    "activity": {
                        "moniker": "Hansen.CDR.Building.Inspection",
                        "primaryKey": 1019
                    },
                    "location": {
                        "x": 0,
                        "y": 0
                    },
                    "activityParentType": "DEMO",
                    "scheduledDate": "2016-03-21T14:14:14",
                    "activityType": "Insp",
                    "isActivityCompleted": false,
                    "lastModifiedBy": "HANSEN8",
                    "lastModifiedDateTime": "2016-03-28T06:03:13.77",
                    "id": 1334,
                    "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1334}]}"
                },
                {
                    "ordinalIndex": 6,
                    "activity": {
                        "moniker": "Hansen.CDR.Building.Inspection",
                        "primaryKey": 1020
                    },
                    "location": {
                        "x": 0,
                        "y": 0
                    },
                    "activityParentType": "DEMO",
                    "scheduledDate": "2016-03-21T14:14:14",
                    "activityType": "M-Insp",
                    "isActivityCompleted": false,
                    "lastModifiedBy": "HANSEN8",
                    "lastModifiedDateTime": "2016-03-28T06:03:13.77",
                    "id": 1335,
                    "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1335}]}"
                },
                {
                    "ordinalIndex": 7,
                    "activity": {
                        "moniker": "Hansen.CDR.Building.Inspection",
                        "primaryKey": 1021
                    },
                    "location": {
                        "x": 0,
                        "y": 0
                    },
                    "activityParentType": "UseDeposit",
                    "scheduledDate": "2016-03-21T14:14:14",
                    "activityType": "Insp 1",
                    "isActivityCompleted": true,
                    "lastModifiedBy": "HANSEN8",
                    "lastModifiedDateTime": "2016-03-28T06:03:13.77",
                    "id": 1336,
                    "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1336}]}"
                },
                {
                    "ordinalIndex": 8,
                    "activity": {
                        "moniker": "Hansen.CDR.Building.Inspection",
                        "primaryKey": 1022
                    },
                    "location": {
                        "x": 0,
                        "y": 0
                    },
                    "activityParentType": "DEMO",
                    "scheduledDate": "2016-03-21T14:14:14",
                    "activityType": "M-Insp",
                    "isActivityCompleted": false,
                    "lastModifiedBy": "HANSEN8",
                    "lastModifiedDateTime": "2016-03-28T06:03:13.773",
                    "id": 1337,
                    "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1337}]}"
                }],
            "lastModifiedBy": "",
            "lastModifiedDateTime": "0001-01-01T00:00:00",
            "id": 1130,
            "href": "/generic/Hansen.Routing.Route?query={select:[ActivityDate,AddedBy,AddedDateTime,EndGpsXCoordinate,EndGpsYCoordinate,EndGpsZCoordinate,LastModifiedBy,LastModifiedDateTime,RouteKey,StartGpsXCoordinate,StartGpsYCoordinate,StartGpsZCoordinate],distinct:False,filter:[{property:RouteKey,operator:Equal,value:1130}]}"
        }],
    "responseStatus": {
        "severity": "Success"
    }
};

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
            routes.data.forEach((r, i) => {
                r.employeeName = r.employeeName || r.employeeId;
                r.employeeId = `EMP_${r.employeeId}`;
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
