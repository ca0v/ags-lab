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
        let ajax = new Ajax(`${this.api}/routing/routes`, false);
        if (0) return ajax.stub(<Routing.RouteResponse>{
            "data": [
                {
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
                    "routeItems": [
                        {
                            "ordinalIndex": 4,
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
                            "lastModifiedBy": "HANSEN8",
                            "lastModifiedDateTime": "2016-03-24T04:46:13.423",
                            "id": 1296,
                            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1296}]}"
                        },
                        {
                            "ordinalIndex": 5,
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
                            "lastModifiedBy": "HANSEN8",
                            "lastModifiedDateTime": "2016-03-24T04:46:13.433",
                            "id": 1297,
                            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1297}]}"
                        },
                        {
                            "ordinalIndex": 2,
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
                            "lastModifiedBy": "HANSEN8",
                            "lastModifiedDateTime": "2016-03-24T04:46:13.437",
                            "id": 1298,
                            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1298}]}"
                        },
                        {
                            "ordinalIndex": 1,
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
                            "lastModifiedBy": "HANSEN8",
                            "lastModifiedDateTime": "2016-03-24T04:46:13.437",
                            "id": 1299,
                            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1299}]}"
                        },
                        {
                            "ordinalIndex": 3,
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
                            "lastModifiedBy": "HANSEN8",
                            "lastModifiedDateTime": "2016-03-24T04:46:13.437",
                            "id": 1301,
                            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1301}]}"
                        }
                    ],
                    "lastModifiedBy": "",
                    "lastModifiedDateTime": "0001-01-01T00:00:00",
                    "id": 1121,
                    "href": "/generic/Hansen.Routing.Route?query={select:[ActivityDate,AddedBy,AddedDateTime,EndGpsXCoordinate,EndGpsYCoordinate,EndGpsZCoordinate,LastModifiedBy,LastModifiedDateTime,RouteKey,StartGpsXCoordinate,StartGpsYCoordinate,StartGpsZCoordinate],distinct:False,filter:[{property:RouteKey,operator:Equal,value:1121}]}"
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
                    "routeItems": [
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
                            "lastModifiedBy": "HANSEN8",
                            "lastModifiedDateTime": "2016-03-23T15:58:18.84",
                            "id": 1300,
                            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1300}]}"
                        },
                        {
                            "ordinalIndex": 1,
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
                            "lastModifiedBy": "HANSEN8",
                            "lastModifiedDateTime": "2016-03-22T15:57:12.24",
                            "id": 1302,
                            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1302}]}"
                        },
                        {
                            "ordinalIndex": 2,
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
                            "lastModifiedBy": "HANSEN8",
                            "lastModifiedDateTime": "2016-03-22T15:57:12.24",
                            "id": 1303,
                            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1303}]}"
                        },
                        {
                            "ordinalIndex": 4,
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
                            "lastModifiedBy": "HANSEN8",
                            "lastModifiedDateTime": "2016-03-23T15:58:18.847",
                            "id": 1304,
                            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1304}]}"
                        },
                        {
                            "ordinalIndex": 5,
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
                            "lastModifiedBy": "HANSEN8",
                            "lastModifiedDateTime": "2016-03-23T15:58:18.847",
                            "id": 1305,
                            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1305}]}"
                        }
                    ],
                    "lastModifiedBy": "",
                    "lastModifiedDateTime": "0001-01-01T00:00:00",
                    "id": 1122,
                    "href": "/generic/Hansen.Routing.Route?query={select:[ActivityDate,AddedBy,AddedDateTime,EndGpsXCoordinate,EndGpsYCoordinate,EndGpsZCoordinate,LastModifiedBy,LastModifiedDateTime,RouteKey,StartGpsXCoordinate,StartGpsYCoordinate,StartGpsZCoordinate],distinct:False,filter:[{property:RouteKey,operator:Equal,value:1122}]}"
                },
                {
                    "employeeId": "1001",
                    "routeDate": "0001-01-01T00:00:00",
                    "startLocation": {
                        "x": 0,
                        "y": 0
                    },
                    "endLocation": {
                        "x": 0,
                        "y": 0
                    },
                    "routeItems": [
                        {
                            "ordinalIndex": 1,
                            "activity": {
                                "moniker": "Hansen.CDR.Building.Inspection",
                                "primaryKey": 1009
                            },
                            "location": {
                                "x": 0,
                                "y": 0
                            },
                            "activityParentType": "DEMO",
                            "scheduledDate": "0001-01-01T00:00:00",
                            "activityType": "M-Insp",
                            "lastModifiedBy": "",
                            "lastModifiedDateTime": "0001-01-01T00:00:00",
                            "id": 1319,
                            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1319}]}"
                        },
                        {
                            "ordinalIndex": 2,
                            "activity": {
                                "moniker": "Hansen.CDR.Building.Inspection",
                                "primaryKey": 1010
                            },
                            "location": {
                                "x": 0,
                                "y": 0
                            },
                            "activityParentType": "DEMO",
                            "scheduledDate": "2014-06-19T12:00:00",
                            "activityType": "M-Insp",
                            "lastModifiedBy": "",
                            "lastModifiedDateTime": "0001-01-01T00:00:00",
                            "id": 1320,
                            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1320}]}"
                        },
                        {
                            "ordinalIndex": 3,
                            "activity": {
                                "moniker": "Hansen.CDR.Building.Inspection",
                                "primaryKey": 1011
                            },
                            "location": {
                                "x": 0,
                                "y": 0
                            },
                            "activityParentType": "DEMO",
                            "scheduledDate": "2014-06-20T00:00:00",
                            "activityType": "M-Insp",
                            "lastModifiedBy": "",
                            "lastModifiedDateTime": "0001-01-01T00:00:00",
                            "id": 1321,
                            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1321}]}"
                        },
                        {
                            "ordinalIndex": 4,
                            "activity": {
                                "moniker": "Hansen.CDR.Building.Inspection",
                                "primaryKey": 1012
                            },
                            "location": {
                                "x": 0,
                                "y": 0
                            },
                            "activityParentType": "DEMO",
                            "scheduledDate": "0001-01-01T00:00:00",
                            "activityType": "M-Insp",
                            "lastModifiedBy": "",
                            "lastModifiedDateTime": "0001-01-01T00:00:00",
                            "id": 1322,
                            "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1322}]}"
                        }
                    ],
                    "lastModifiedBy": "",
                    "lastModifiedDateTime": "0001-01-01T00:00:00",
                    "id": 1126,
                    "href": "/generic/Hansen.Routing.Route?query={select:[ActivityDate,AddedBy,AddedDateTime,EndGpsXCoordinate,EndGpsYCoordinate,EndGpsZCoordinate,LastModifiedBy,LastModifiedDateTime,RouteKey,StartGpsXCoordinate,StartGpsYCoordinate,StartGpsZCoordinate],distinct:False,filter:[{property:RouteKey,operator:Equal,value:1126}]}"
                }
            ],
            "responseStatus": {
                "severity": "Success"
            }
        }).then(routes => {
            let extent = [-117.13, 32.73, -117.12, 32.74];

            let randomLocation = (i: number) => ({
                x : extent[0] + Math.random() * (extent[2] - extent[0]) * (1 + i % 3) / 3,
                y : extent[1] + Math.random() * (extent[2] - extent[0]) * (1 + i % 3) / 3
            });
            routes.data.forEach((r, i) => {
                r.startLocation = randomLocation(i);
                r.endLocation = randomLocation(i);
                r.routeItems.forEach(ri => ri.location  = randomLocation(i))
            });
            return routes;
        });
        
        return ajax.get<Routing.RouteResponse>();
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
            Permutation: {
                SetOrder: routeItems
            }
        });
    }    
}
