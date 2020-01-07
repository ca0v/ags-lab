var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */
define("labs/ajax", ["require", "exports"], function (require, exports) {
    "use strict";
    class Ajax {
        constructor(url) {
            this.url = url;
            this.options = {
                use_json: true,
                use_jsonp: false,
                use_cors: true
            };
        }
        jsonp(args, url = this.url) {
            return new Promise((resolve, reject) => {
                args["callback"] = "define";
                let uri = url + "?" + Object.keys(args).map(k => `${k}=${args[k]}`).join('&');
                require([uri], (data) => resolve(data));
            });
        }
        // http://www.html5rocks.com/en/tutorials/cors/    
        ajax(method, args, url = this.url) {
            let isData = method === "POST" || method === "PUT";
            let isJson = this.options.use_json;
            let isCors = this.options.use_cors;
            let promise = new Promise((resolve, reject) => {
                let client = new XMLHttpRequest();
                if (isCors)
                    client.withCredentials = true;
                let uri = url;
                let data = null;
                if (args) {
                    if (isData) {
                        data = JSON.stringify(args);
                    }
                    else {
                        uri += '?';
                        let argcount = 0;
                        for (let key in args) {
                            if (args.hasOwnProperty(key)) {
                                if (argcount++) {
                                    uri += '&';
                                }
                                uri += encodeURIComponent(key) + '=' + encodeURIComponent(args[key]);
                            }
                        }
                    }
                }
                client.open(method, uri, true);
                if (isData && isJson)
                    client.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                client.send(data);
                client.onload = () => {
                    console.log("content-type", client.getResponseHeader("Content-Type"));
                    if (client.status >= 200 && client.status < 300) {
                        isJson = isJson || 0 === client.getResponseHeader("Content-Type").indexOf("application/json");
                        resolve(isJson ? JSON.parse(client.response) : client.response);
                    }
                    else {
                        reject(client.statusText);
                    }
                };
                client.onerror = function () {
                    reject(this.statusText);
                };
            });
            // Return the promise
            return promise;
        }
        stub(result) {
            return new Promise((resolve, reject) => {
                resolve(result);
            });
        }
        get(args) {
            if (this.options.use_jsonp)
                return this.jsonp(args);
            return this.ajax('GET', args);
        }
        post(args) {
            return this.ajax('POST', args);
        }
        put(args) {
            return this.ajax('PUT', args);
        }
        delete(args) {
            return this.ajax('DELETE', args);
        }
    }
    return Ajax;
});
/**
 * http://sampleserver6.arcgisonline.com/arcgis/rest/services/Military/FeatureServer
 */
define("labs/ags-feature-proxy", ["require", "exports", "dojo/_base/lang", "labs/ajax"], function (require, exports, lang, Ajax) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FeatureServer {
        constructor(url) {
            this.ajax = new Ajax(url);
        }
        about(data) {
            let req = lang.mixin({
                f: "pjson"
            }, data);
            return this.ajax.get(req);
        }
        aboutLayer(layer) {
            let ajax = new Ajax(`${this.ajax.url}/${layer}`);
            let req = lang.mixin({
                f: "pjson"
            }, {});
            return ajax.get(req);
        }
    }
    exports.default = FeatureServer;
    function run() {
        let service = new FeatureServer("//sampleserver6.arcgisonline.com/arcgis/rest/services/Military/FeatureServer");
        service
            .about()
            .then(value => {
            console.log("about", value);
            console.log("currentVersion", value.currentVersion);
            service.aboutLayer(2).then(value => {
                console.log("layer2", value);
            });
        });
    }
    exports.run = run;
});
/**
 * //sampleserver6.arcgisonline.com/arcgis/rest/?f=pjson
 */
define("labs/ags-catalog-proxy", ["require", "exports", "dojo/_base/lang", "labs/ags-feature-proxy", "labs/ajax"], function (require, exports, lang, ags_feature_proxy_1, Ajax) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Catalog {
        constructor(url) {
            this.ajax = new Ajax(url);
        }
        about(data) {
            let req = lang.mixin({
                f: "pjson"
            }, data);
            return this.ajax.get(req);
        }
        aboutFolder(folder) {
            let ajax = new Ajax(`${this.ajax.url}/${folder}`);
            let req = lang.mixin({
                f: "pjson"
            }, {});
            return ajax.get(req);
        }
    }
    exports.default = Catalog;
    function run() {
        let url = "//sampleserver6.arcgisonline.com/arcgis/rest/services";
        let service = new Catalog(url);
        service
            .about()
            .then(value => {
            console.log("about", value);
            value.services.filter(s => s.type === "FeatureServer").forEach(s => {
                let featureService = new ags_feature_proxy_1.default(`${url}/${s.name}/FeatureServer`);
                featureService.about().then(s => console.log("featureServer", s));
            });
            value.folders.forEach(f => {
                service.aboutFolder(f).then(value => {
                    console.log("folder", f, value);
                });
            });
        });
    }
    exports.run = run;
});
define("app", ["require", "exports", "labs/ags-catalog-proxy"], function (require, exports) {
    "use strict";
    return {};
});
define("ips/services", ["require", "exports", "labs/ajax", "dojo/_base/lang", "dojo/Deferred"], function (require, exports, Ajax, lang, Deferred) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const __DEV__ = 0;
    class test {
    }
    test.ips_route_response = {
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
    class Routing {
        constructor(api) {
            this.api = api;
        }
        auth(id) {
            let ajax = new Ajax(`${this.api}/auth?username=${id.username}&password=${id.password}`);
            return ajax.get();
        }
        forceSampleRoutes() {
            //if (!__DEV__) throw "you must set __DEV__ first";
            let extent = [-115.24, 36.16, -115.22, 36.18];
            let routeItems = test.ips_route_response.data.filter(r => r.employeeId === "1003");
            let count = routeItems.length;
            let randomLocation = (i) => ({
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
            let result = [];
            let d = new Deferred();
            let x = new Deferred();
            x.reject;
            let doit = () => {
                if (!routes.length) {
                    d.resolve(result);
                    return;
                }
                ajax.post(routes.pop())
                    .then(routes => {
                    result.push(routes.data);
                    doit();
                });
            };
            doit();
            return d.promise;
        }
        createRoutes() {
            if (__DEV__)
                throw "you must set __DEV__ first";
            let ajax = new Ajax(`${this.api}/routing/routes`);
            return ajax.post();
        }
        getRoutes(args = {}) {
            let ajax = new Ajax(`${this.api}/routing/routes`);
            ajax.options.use_cors = true;
            ajax.options.use_json = true;
            ajax.options.use_jsonp = false;
            let params = lang.mixin({ routeDate: new Date(), employeeId: "" }, args);
            params.routeDate = params.routeDate.toISOString().substring(0, 10);
            return (__DEV__ ? ajax.stub(test.ips_route_response) : ajax.get(params)).then(routes => {
                routes.data.forEach((r, i) => {
                    r.employeeFullName = r.employeeFullName || r.employeeId;
                });
                if (__DEV__) {
                    // spoof some locations
                    let extent = [-115.24, 36.16, -115.22, 36.18];
                    let count = routes.data.length;
                    let randomLocation = (i) => ({
                        x: extent[0] + Math.random() * (extent[2] - extent[0]) * (1 + i % count) / count,
                        y: extent[1] + Math.random() * (extent[2] - extent[0]) * (1 + i % count) / count
                    });
                    routes.data.forEach((r, i) => {
                        r.startLocation = randomLocation(i);
                        r.endLocation = randomLocation(i);
                        r.routeItems.forEach(ri => ri.location = randomLocation(i));
                    });
                }
                return routes;
            });
        }
        optimizeRoute(routeId) {
            if (__DEV__)
                throw "you must set __DEV__ first";
            let ajax = new Ajax(`${this.api}/routing/routes/optimize`);
            return ajax.put({
                Id: routeId,
                Parameters: {}
            });
        }
        updateRoute(routeId, routeItems) {
            if (__DEV__)
                throw "you must set __DEV__ first";
            console.log("updateRoute", routeId, routeItems);
            let ajax = new Ajax(`${this.api}/routing/routes/orderchanged`);
            return ajax.put({
                Id: routeId,
                Items: routeItems
            });
        }
    }
    exports.Routing = Routing;
});
/**
 * http://sampleserver6.arcgisonline.com/arcgis/sdk/rest/index.html#//02ss0000002r000000
 */
define("labs/ags-feature-query-proxy", ["require", "exports", "dojo/_base/lang", "labs/ajax"], function (require, exports, lang, Ajax) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Query {
        constructor(url) {
            this.ajax = new Ajax(url);
        }
        query(data) {
            let req = lang.mixin({
                where: "1=1",
                inSR: 4326,
                outSR: 4326,
                returnDistinctValues: true,
                returnGeometry: false,
                returnCountOnly: false,
                f: "pjson"
            }, data);
            if (req.objectIds)
                req.objectIds = req.objectIds.join(',');
            if (req.outFields)
                req.outFields = req.outFields.join(',');
            if (req.groupByFieldsForStatistics)
                req.groupByFieldsForStatistics = req.groupByFieldsForStatistics.join(',');
            return this.ajax.get(req);
        }
    }
    exports.default = Query;
    function run() {
        new Query("https://sampleserver6.arcgisonline.com/arcgis/rest/services/Military/FeatureServer/3/query")
            .query({
            outFields: ["symbolname"],
            returnDistinctValues: true
        })
            .then((value) => {
            console.log("query", value);
        });
    }
    exports.run = run;
});
/**
 * https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=50%20Datastream%20Plaza&f=json&outSR=%7B%22wkid%22%3A102100%2C%22latestWkid%22%3A3857%7D&maxLocations=10
 */
define("labs/ags-find-address-proxy", ["require", "exports", "dojo/_base/lang", "labs/ajax"], function (require, exports, lang, Ajax) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FindAddress {
        constructor(url) {
            this.ajax = new Ajax(url);
        }
        find(data) {
            let req = lang.mixin({
                outFields: "*",
                outSRS: "wkid:4326",
                maxLocations: 1,
                distance: 1e5,
                forStorage: false,
                f: "pjson"
            }, data);
            return this.ajax.get(req);
        }
    }
    exports.default = FindAddress;
    function run() {
        new FindAddress("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates")
            .find({
            singleLine: "50 Datastream Plz, Greenville, South Carolina, 29605",
            location: "-82.41,34.79",
            category: "Address"
        })
            .then((value) => {
            console.log("location", value.candidates.map(c => c.location));
            console.log(value);
        });
    }
    exports.run = run;
});
/**
 * geocode find
 */
define("labs/ags-find-proxy", ["require", "exports", "dojo/_base/lang", "labs/ajax"], function (require, exports, lang, Ajax) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Find {
        constructor(url) {
            this.ajax = new Ajax(url);
        }
        find(data) {
            let req = lang.mixin({
                outFields: "*",
                outSRS: "wkid:4326",
                maxLocations: 1,
                distance: 1e5,
                forStorage: false,
                f: "pjson"
            }, data);
            return this.ajax.get(req);
        }
    }
    exports.default = Find;
    function run() {
        new Find("//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find")
            .find({
            text: "50 Datastream Plz, Greenville, South Carolina, 29605",
            location: "-82.41,34.79",
            category: "Address"
        })
            .then((value) => {
            console.log("location", value.locations.map(c => c.name));
            console.log(value);
        });
    }
    exports.run = run;
});
/**
 * geometry services
 * http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer/distance
 */
define("labs/ags-geometry-proxy", ["require", "exports", "dojo/_base/lang", "labs/ajax"], function (require, exports, lang, Ajax) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // see http://resources.esri.com/help/9.3/ArcGISDesktop/ArcObjects/esriGeometry/esriSRUnitType.htm
    var esriSRUnitType;
    (function (esriSRUnitType) {
        esriSRUnitType[esriSRUnitType["Meter"] = 9001] = "Meter";
        esriSRUnitType[esriSRUnitType["Kilometer"] = 9036] = "Kilometer";
    })(esriSRUnitType || (esriSRUnitType = {}));
    class Geometry {
        constructor(url) {
            this.ajax = new Ajax(url);
        }
        lengths(data) {
            let req = lang.mixin({
                sr: 4326,
                calculationType: "geodesic",
                lengthUnit: esriSRUnitType.Meter,
                f: "pjson"
            }, data);
            req.polylines = JSON.stringify(req.polylines);
            return this.ajax.get(req);
        }
        buffer(data) {
            let req = lang.mixin({
                geometryType: "esriGeometryPoint",
                inSR: 4326,
                outSR: 4326,
                bufferSR: 4326,
                unit: esriSRUnitType.Meter,
                distances: [1000],
                unionResults: true,
                geodesic: true,
                f: "pjson"
            }, data);
            req.geometries = JSON.stringify(req.geometries);
            req.distances = req.distances.join(",");
            return this.ajax.get(req);
        }
    }
    exports.default = Geometry;
    function run() {
        new Geometry("//sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer/lengths")
            .lengths({
            polylines: [{ "paths": [[[-117, 34], [-116, 34], [-117, 33]], [[-115, 44], [-114, 43], [-115, 43]]] }]
        })
            .then((value) => {
            console.log("lengths", value);
        });
        new Geometry("//sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer/buffer")
            .buffer({
            geometries: {
                geometryType: "esriGeometryPoint",
                geometries: [{ x: -82.4, y: 34.85 }]
            },
            distances: [100]
        })
            .then((value) => {
            console.log("buffer", value);
        });
    }
    exports.run = run;
});
/**
 * http://roadsandhighwayssample.esri.com/roads/api/index.html
 * http://roadsandhighwayssample.esri.com/ROADS/SAMPLES/
 */
define("labs/ags-lrs-proxy", ["require", "exports", "dojo/_base/lang", "labs/ajax"], function (require, exports, lang, Ajax) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Lrs {
        constructor(url) {
            this.ajax = new Ajax(url);
            this.ajax.options.use_jsonp = true;
        }
        geometryToMeasure(data) {
            let req = lang.mixin({
                inSR: 4326,
                outSR: 4326,
                f: "pjson"
            }, data);
            req.locations = JSON.stringify(req.locations);
            return this.ajax.get(req);
        }
        measureToGeometry(data) {
            let req = lang.mixin({
                outSR: 4326,
                f: "pjson"
            }, data);
            req.locations = JSON.stringify(req.locations);
            return this.ajax.get(req);
        }
        translate(data) {
            let req = lang.mixin({
                tolerance: 0,
                f: "pjson"
            }, data);
            req.locations = JSON.stringify(req.locations);
            req.targetNetworkLayerIds = `[${req.targetNetworkLayerIds}]`;
            return this.ajax.get(req);
        }
        queryAttributeSet(data) {
            let req = lang.mixin({
                outSR: 4326,
                f: "pjson"
            }, data);
            req.locations = JSON.stringify(req.locations);
            req.attributeSet = JSON.stringify(req.attributeSet);
            return this.ajax.get(req);
        }
        checkEvents(data) {
            let req = lang.mixin({
                f: "pjson"
            }, data);
            return this.ajax.get(req);
        }
        geometryToStation(data) {
            let req = lang.mixin({
                f: "pjson"
            }, data);
            return this.ajax.get(req);
        }
        stationToGeometry(data) {
            let req = lang.mixin({
                f: "pjson"
            }, data);
            return this.ajax.get(req);
        }
    }
    exports.default = Lrs;
    function run() {
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
        }).then((value) => {
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
        }).then((value) => {
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
        }).then((value) => {
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
        }).then((value) => {
            console.log("queryAttributeSet", value);
        });
        // TODO: check events
        // TODO: geometry to station
        // TODO: station to geometry
    }
    exports.run = run;
});
/**
 * http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/find?searchText=Woonsocket&contains=true&searchFields=&sr=&layers=0%2C2&layerdefs=&returnGeometry=true&maxAllowableOffset=&f=pjson
 */
define("labs/ags-map-export-proxy", ["require", "exports", "dojo/_base/lang", "labs/ajax"], function (require, exports, lang, Ajax) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * mapserver export
     */
    class Export {
        constructor(url) {
            this.ajax = new Ajax(url);
            this.ajax.options.use_jsonp = true;
        }
        export(data) {
            let req = lang.mixin({
                size: [512, 512],
                dpi: 96,
                imageSR: 4326,
                bboxSR: 4326,
                format: "png",
                transparent: true,
                f: "pjson"
            }, data);
            req.bbox = req.bbox.join(",");
            req.size = req.size.join(",");
            return this.ajax.get(req);
        }
    }
    exports.default = Export;
    function run() {
        new Export("//sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/export")
            .export({
            bbox: [-82.4, 34.85, -82.25, 35]
        })
            .then((value) => {
            console.log("export", value);
        });
    }
    exports.run = run;
});
/**
 * http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/find?searchText=Woonsocket&contains=true&searchFields=&sr=&layers=0%2C2&layerdefs=&returnGeometry=true&maxAllowableOffset=&f=pjson
 */
define("labs/ags-map-find-proxy", ["require", "exports", "dojo/_base/lang", "labs/ajax"], function (require, exports, lang, Ajax) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * mapserver find
     */
    class Find {
        constructor(url) {
            this.ajax = new Ajax(url);
            this.ajax.options.use_jsonp = true;
        }
        find(data) {
            let req = lang.mixin({
                sr: 4326,
                f: "pjson"
            }, data);
            req.layers = req.layers.join(",");
            return this.ajax.get(req);
        }
    }
    exports.default = Find;
    function run() {
        new Find("//sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/find")
            .find({
            searchText: "island",
            layers: ["0"]
        })
            .then((value) => {
            console.log("find", value);
        });
    }
    exports.run = run;
});
/**
 * http://sampleserver1.arcgisonline.com/ArcGIS/SDK/REST/identify.html
 */
define("labs/ags-map-identify-proxy", ["require", "exports", "dojo/_base/lang", "labs/ajax"], function (require, exports, lang, Ajax) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * mapserver identify
     */
    class Identify {
        constructor(url) {
            this.ajax = new Ajax(url);
            this.ajax.options.use_jsonp = true;
        }
        identify(data) {
            let req = lang.mixin({
                sr: 4326,
                tolerance: 10,
                f: "pjson"
            }, data);
            req.mapExtent = req.mapExtent.join(",");
            req.imageDisplay = `${req.imageDisplay.width},${req.imageDisplay.height},${req.imageDisplay.dpi}`;
            return this.ajax.get(req);
        }
    }
    exports.default = Identify;
    function run() {
        new Identify("//sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StateCityHighway_USA/MapServer/identify")
            .identify({
            geometryType: "esriGeometryPoint",
            geometry: [-82.4, 34.85],
            mapExtent: [-83, 34, -82, 35],
            imageDisplay: {
                width: 400,
                height: 300,
                dpi: 96
            },
            tolerance: 0
        })
            .then(value => {
            console.log("identify", value);
        });
    }
    exports.run = run;
});
/**
 * http://sampleserver1.arcgisonline.com/ArcGIS/SDK/REST/query.html
 */
define("labs/ags-map-query-proxy", ["require", "exports", "dojo/_base/lang", "labs/ajax"], function (require, exports, lang, Ajax) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * mapserver query
     */
    class Query {
        constructor(url) {
            this.ajax = new Ajax(url);
            this.ajax.options.use_jsonp = true;
        }
        query(data) {
            let req = lang.mixin({
                inSR: 4326,
                outSR: 4326,
                f: "pjson"
            }, data);
            if (req.outFields)
                req.outFields = req.outFields.join(",");
            return this.ajax.get(req);
        }
    }
    exports.default = Query;
    function run() {
        new Query("//sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StateCityHighway_USA/MapServer/1/query")
            .query({
            text: "South Carolina"
        })
            .then(value => console.log("query", value));
    }
    exports.run = run;
});
/**
 * http://resources.arcgis.com/EN/HELP/REST/APIREF/INDEX.HTML?REVERSE.HTML
 */
define("labs/ags-reverse-geocode-proxy", ["require", "exports", "dojo/_base/lang", "labs/ajax"], function (require, exports, lang, Ajax) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ReverseGeocode {
        constructor(url) {
            this.ajax = new Ajax(url);
            this.ajax.options.use_jsonp = true;
        }
        reverseGeocode(data) {
            let req = lang.mixin({
                outSRS: "wkid:4326",
                distance: 10,
                langCode: "en",
                forStorage: false,
                returnIntersection: false,
                f: "pjson"
            }, data);
            return this.ajax.get(req);
        }
    }
    exports.default = ReverseGeocode;
    function run() {
        new ReverseGeocode("//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode")
            .reverseGeocode({
            location: "-82.407548,34.790207"
        })
            .then((value) => {
            console.log("ReverseGeocode", value.address);
            console.log(value);
        });
    }
    exports.run = run;
});
define("labs/data/route01", ["require", "exports"], function (require, exports) {
    "use strict";
    const center = {
        "x": -115.256673787042,
        "y": 36.194162517804
    };
    let route = {
        "data": [
            {
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
                            "moniker": "Inspection",
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
                            "moniker": "Inspection",
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
                            "moniker": "Inspection",
                            "primaryKey": 1021
                        },
                        "location": {
                            "x": -115.252869380492,
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
                            "moniker": "Inspection",
                            "primaryKey": 1015
                        },
                        "location": {
                            "x": -115.232380018892,
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
                            "moniker": "Inspection",
                            "primaryKey": 1016
                        },
                        "location": {
                            "x": -115.232380018892,
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
                            "moniker": "Inspection",
                            "primaryKey": 1017
                        },
                        "location": {
                            "x": -115.232380018892,
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
                            "moniker": "Inspection",
                            "primaryKey": 1018
                        },
                        "location": {
                            "x": -115.232380018892,
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
                            "moniker": "Inspection",
                            "primaryKey": 1019
                        },
                        "location": {
                            "x": -115.256673787042,
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
                            "moniker": "Inspection",
                            "primaryKey": 1020
                        },
                        "location": {
                            "x": -115.256673787042,
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
                            "moniker": "Inspection",
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
            }
        ],
        "responseStatus": {
            "severity": "Success"
        }
    };
    route.data.push({
        startLocation: { x: 0, y: 0 },
        endLocation: { x: 0, y: 0 },
        routeItems: [
            { location: { x: 0, y: 0 } },
            { location: { x: 0, y: 0 } },
            { location: { x: 0, y: 0 } },
            { location: { x: 0, y: 0 } },
            { location: { x: 0, y: 0 } }
        ]
    });
    route.data.forEach(data => {
        for (let i = 0; i < 10; i++)
            data.routeItems.push({ location: { x: 0, y: 0 } });
    });
    let offset = 0.01;
    route.data.forEach((data, j) => {
        data.startLocation = {
            x: center.x + offset * (1 - Math.random()),
            y: center.y + offset * (1 - Math.random())
        };
        data.endLocation = {
            x: center.x + offset * (1 - Math.random()),
            y: center.y + offset * (1 - Math.random())
        };
        data.routeItems.forEach((item, i) => {
            item.location.x = center.x + offset * ((1 + i + 5 * j) - Math.random());
            item.location.y = center.y + 5 * offset * (1 - Math.random());
        });
    });
    return route;
});
define("labs/ags-route-editor", ["require", "exports", "labs/data/route01", "esri/map", "esri/layers/GraphicsLayer", "esri/graphic", "esri/geometry/Point", "esri/geometry/Polyline", "esri/SpatialReference", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/TextSymbol", "esri/Color", "esri/InfoTemplate", "dojo/_base/event", "esri/symbols/Font", "esri/toolbars/edit", "esri/geometry/Extent", "dojo/Evented"], function (require, exports, route, Map, GraphicsLayer, Graphic, Point, Polyline, SpatialReference, SimpleMarkerSymbol, SimpleLineSymbol, TextSymbol, Color, InfoTemplate, event, Font, Edit, Extent, Evented) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const epsg4326 = new SpatialReference("4326");
    const epsg3857 = new SpatialReference("102100");
    const delta = 24;
    const routeColors = [new Color("#ffa800"), new Color("#1D5F8A"), new Color("yellow")];
    const underlayColor = new Color("white");
    const orphanColor = new Color("red");
    const hiliteColor = new Color("#00FF00");
    const routeLineStyle = (routeInfo) => ({
        color: routeInfo.color,
        width: 2,
        type: "esriSLS",
        style: "esriSLSShortDot"
    });
    const routeUnderlayStyle = (routeInfo) => ({
        color: underlayColor,
        width: 4,
        type: "esriSLS",
        style: "esriSLSSolid"
    });
    const editorLineStyle = {
        color: hiliteColor,
        width: 3,
        type: "esriSLS",
        style: "esriSLSDot"
    };
    const editorVertexStyle = {
        color: [0, 0, 0, 0],
        size: delta,
        type: "esriSMS",
        style: "esriSMSCircle",
        outline: {
            color: hiliteColor,
            width: delta / 8,
            type: "esriSLS",
            style: "esriSLSSolid"
        }
    };
    let editorMinorVertexStyle = (routeInfo) => ({
        color: routeInfo.color,
        size: delta / 2,
        type: "esriSMS",
        style: "esriSMSCircle",
        outline: {
            color: hiliteColor,
            width: delta / 8,
            type: "esriSLS",
            style: "esriSLSSolid"
        }
    });
    let textStyle = (routeInfo, routeItem) => ({
        text: (1 + routeItem.ordinalIndex + ""),
        font: new Font(delta / 2),
        color: underlayColor,
        yoffset: -delta / 6,
        haloColor: routeInfo.color,
        haloSize: 1
    });
    let stopStyle = (routeInfo, routeItem) => ({
        type: "esriSMS",
        style: "esriSMSCircle",
        size: delta,
        color: routeInfo.color,
        outline: {
            type: "esriSLS",
            style: "esriSLSSolid",
            color: underlayColor,
            width: delta / 8
        }
    });
    let terminalStyle = (routeInfo) => ({
        type: "esriSMS",
        style: "esriSMSX",
        size: delta / 2,
        color: routeInfo.color,
        outline: {
            type: "esriSLS",
            style: "esriSLSSolid",
            color: routeInfo.color,
            width: delta / 8
        }
    });
    let activeVertexStyle = (routeInfo) => ({
        "color": routeInfo.color,
        "size": delta / 2,
        "angle": 0,
        "xoffset": 0,
        "yoffset": 0,
        "type": "esriSMS",
        "style": "esriSMSCircle",
        "outline": {
            "color": underlayColor,
            "width": delta / 8,
            "type": "esriSLS",
            "style": "esriSLSSolid"
        }
    });
    let cursorStyle = (routeInfo, text) => ({
        text: text,
        font: new Font(delta / 2),
        color: routeInfo.color,
        xoffset: delta,
        yoffset: -delta / 6,
        haloColor: underlayColor,
        haloSize: 1
    });
    function first(arr, filter) {
        let result;
        return arr.some(v => { result = v; return filter(v); }) ? result : undefined;
    }
    function indexOf(arr, filter) {
        let result;
        return arr.some((v, i) => { result = i; return filter(v); }) ? result : undefined;
    }
    function asGeom(location) {
        return new Point(location.x, location.y);
    }
    var RouteViewer;
    (function (RouteViewer) {
        ;
        ;
        class RouteView {
            constructor(options) {
                this.options = options;
                this.events = new Evented();
                this.destroyables = [];
                let map = options.map;
                let layer = this.layer = new GraphicsLayer();
                options.map.addLayer(layer);
                this.routes = [];
                this.orphans = [];
                route.data.map((data, colorIndex) => this.add({
                    route: data,
                    color: routeColors[colorIndex % routeColors.length]
                })).forEach(route => this.redraw(route));
            }
            destroy() {
                this.destroyables.reverse().forEach(d => d());
                this.destroyables = [];
            }
            on(name, cb) {
                let handle = this.events.on(name, cb);
                this.destroyables.push(() => handle.remove());
            }
            trigger(name, args) {
                // just trigger was invoking the callback many times even with prevent/stop set everywhere
                this.events.emit(name, args);
            }
            removeRoute(route) {
                let routeIndex = (typeof route === "number") ? route : this.routes.indexOf(route);
                return this.routes.splice(routeIndex, 1)[0];
            }
            removeOrphan(stop) {
                let index = this.orphans.indexOf(stop);
                stop = this.orphans.splice(index, 1)[0];
                this.trigger("remove-orphan", { stop: stop });
            }
            addOrphan(stop) {
                this.orphans.push(stop);
                this.trigger("add-orphan", { stop: stop });
            }
            removeStop(route, stop) {
                let routeIndex = (typeof route === "number") ? route : this.routes.indexOf(route);
                let stopIndex = (typeof stop === "number") ? stop : this.routes[routeIndex].stops.indexOf(stop);
                let routeInfo = this.routes[routeIndex];
                let stopInfo = routeInfo.stops.splice(stopIndex, 1)[0];
                this.trigger("remove-stop", { route: routeInfo, stop: stopInfo });
            }
            addStop(route, stop, stopIndex) {
                let routeIndex = (typeof route === "number") ? route : this.routes.indexOf(route);
                let routeInfo = this.routes[routeIndex];
                routeInfo.stops.splice(stopIndex, 0, stop);
                let stopInfo = routeInfo.stops[stopIndex];
                this.trigger("add-stop", { route: routeInfo, stop: stopInfo });
            }
            moveStop(stop, location) {
                stop.stop.setGeometry(location);
                stop.label.setGeometry(location);
                let routeInfo = first(this.routes, r => 0 <= r.stops.indexOf(stop));
                let stopInfo = routeInfo && stop;
                this.trigger("move-stop", { route: routeInfo, stop: stopInfo, location: location });
            }
            reassignStop(activeRoute, targetRoute, targetStop, activeIndex) {
                let isOrphan = !targetRoute && targetStop;
                targetRoute && this.removeStop(targetRoute, targetStop);
                isOrphan && this.removeOrphan(targetStop);
                this.addStop(activeRoute, targetStop, activeIndex);
                this.trigger("reassign-stop", {
                    source: targetRoute,
                    target: activeRoute,
                    stop: targetStop,
                    index: activeIndex
                });
            }
            unassignStop(route, stop) {
                this.removeStop(route, stop);
                this.addOrphan(stop);
                this.trigger("unassign-stop", {
                    route: route,
                    stop: stop
                });
            }
            addToLayer(info) {
                const isStop = (object) => 'stop' in object;
                if (isStop(info)) {
                    this.layer.add(info.stop);
                    this.layer.add(info.label);
                }
                else {
                    this.layer.add(info.underlay);
                    this.layer.add(info.routeLine);
                }
            }
            add(args) {
                let routeInfo = {
                    color: args.color,
                    routeLine: null,
                    stops: null,
                    startLocation: null,
                    endLocation: null
                };
                this.routes.push(routeInfo);
                if (1) {
                    routeInfo.stops = args.route.routeItems.map((item, itemIndex) => {
                        let geometry = asGeom(item.location);
                        let circleSymbol = new SimpleMarkerSymbol(stopStyle(routeInfo, item));
                        let textSymbol = new TextSymbol(textStyle(routeInfo, item));
                        let attributes = {};
                        let template = new InfoTemplate(() => `${args.route.employeeFullName} ${item.activity.moniker} ${item.activity.primaryKey}`, () => `${JSON.stringify(item)}`);
                        let stop = new Graphic(geometry, circleSymbol, attributes, template);
                        let label = new Graphic(geometry, textSymbol);
                        return {
                            stop: stop,
                            label: label
                        };
                    });
                    routeInfo.stops.forEach(stop => this.addToLayer(stop));
                }
                if (1) {
                    let circleSymbol = new SimpleMarkerSymbol(terminalStyle(routeInfo));
                    if (args.route.startLocation) {
                        let geom = asGeom(args.route.startLocation);
                        routeInfo.startLocation = {
                            stop: new Graphic(geom, circleSymbol),
                            label: new Graphic()
                        };
                        this.addToLayer(routeInfo.startLocation);
                    }
                    if (args.route.endLocation) {
                        let geom = asGeom(args.route.endLocation);
                        routeInfo.endLocation = {
                            stop: new Graphic(geom, circleSymbol),
                            label: new Graphic()
                        };
                        this.addToLayer(routeInfo.endLocation);
                    }
                }
                return routeInfo;
            }
            redraw(route) {
                {
                    let getGeom = () => {
                        let stops = [].concat(route.stops);
                        route.startLocation && stops.unshift(route.startLocation);
                        route.endLocation && stops.push(route.endLocation);
                        let path = stops.map(stop => stop.stop.geometry).map(p => [p.getLongitude(), p.getLatitude()]);
                        return new Polyline(path);
                    };
                    let geom = getGeom();
                    if (!route.routeLine) {
                        route.routeLine = {
                            routeLine: new Graphic(geom, new SimpleLineSymbol(routeLineStyle(route))),
                            underlay: new Graphic(geom, new SimpleLineSymbol(routeUnderlayStyle(route)))
                        };
                        this.addToLayer(route.routeLine);
                    }
                    else {
                        route.routeLine.underlay.setGeometry(geom);
                        route.routeLine.routeLine.setGeometry(geom);
                    }
                }
                this.orphans.forEach((stop, itemIndex) => {
                    stop.label.symbol.text = (1 + itemIndex + "");
                    stop.stop.symbol.color = orphanColor;
                });
                route.stops.forEach((stop, itemIndex) => {
                    stop.stop.symbol.color = route.color;
                    stop.label.symbol.text = (1 + itemIndex + "");
                });
                setTimeout(() => this.moveToFront(route), 200);
            }
            moveToFront(route) {
                [route.routeLine.routeLine, route.routeLine.underlay].forEach(g => {
                    g.draw();
                    g.getShapes().forEach(s => s.moveToBack());
                });
                route.stops.forEach(stop => {
                    [stop.stop, stop.label].forEach(g => {
                        g.draw();
                        g.getShapes().forEach(s => s.moveToFront());
                    });
                });
                this.orphans.forEach(stop => {
                    [stop.stop, stop.label].forEach(g => {
                        g.draw();
                        g.getShapes().forEach(s => s.moveToFront());
                    });
                });
            }
            edit(editor, graphic, options) {
                // ensures callbacks are unregistered
                editor.deactivate();
                let activeRoute = first(this.routes, route => {
                    if (graphic === route.routeLine.routeLine)
                        return true;
                    if (graphic === route.routeLine.underlay)
                        return true;
                    if (graphic.geometry.type === "point") {
                        return !!first(route.stops, stop => stop.stop === graphic || stop.label === graphic);
                    }
                });
                if (activeRoute) {
                    this.moveToFront(activeRoute);
                    editor.activate(Edit.EDIT_VERTICES, activeRoute.routeLine.routeLine, {
                        ghostVertexSymbol: new SimpleMarkerSymbol(editorMinorVertexStyle(activeRoute))
                    });
                }
                else {
                    console.log("cannot determine route");
                    return;
                }
                let isActiveVertexMinor;
                let activeVertexIndex;
                let targetRoute = null && activeRoute;
                let activeStop = null && activeRoute.stops[0];
                let targetStop = null && activeRoute.stops[0];
                let activeLocation;
                let cursor;
                let doit = () => {
                    let isSameStop = activeStop === targetStop;
                    let isSameRoute = targetRoute === activeRoute;
                    let isRemoveActiveStop = activeStop && !isActiveVertexMinor && !options.moveStop && !isSameStop;
                    let isMoveActiveStop = activeStop && !isActiveVertexMinor && options.moveStop && (!targetStop || isSameStop);
                    let isAddTargetStop = !!targetStop && !isSameStop;
                    if (isSameStop) {
                        console.log("dnd onto same stop does nothing");
                    }
                    if (isRemoveActiveStop) {
                        this.unassignStop(activeRoute, activeStop);
                    }
                    if (isAddTargetStop) {
                        let activeIndex = activeVertexIndex;
                        if (activeIndex > 0)
                            activeIndex -= (!!activeRoute.startLocation ? 1 : 0);
                        this.reassignStop(activeRoute, targetRoute, targetStop, activeIndex);
                    }
                    if (isMoveActiveStop) {
                        this.moveStop(activeStop, activeLocation);
                    }
                    !isSameRoute && targetRoute && this.redraw(targetRoute);
                    this.redraw(activeRoute);
                    this.edit(editor, activeRoute.routeLine.routeLine, options);
                };
                let handles = [
                    editor.on("vertex-move-start", args => {
                        // were on the move!
                        isActiveVertexMinor = args.vertexinfo.isGhost;
                        activeVertexIndex = args.vertexinfo.pointIndex;
                        activeStop = !isActiveVertexMinor && activeRoute.stops[activeVertexIndex - (activeRoute.startLocation ? 1 : 0)];
                        let g = args.vertexinfo.graphic;
                        g.setSymbol(new SimpleMarkerSymbol(activeVertexStyle(activeRoute)));
                        g.draw();
                    }),
                    editor.on("vertex-move-stop", args => {
                        if (cursor) {
                            this.layer.remove(cursor);
                            cursor = null;
                        }
                        if (args.vertexinfo.pointIndex !== activeVertexIndex)
                            return;
                        // does it intersect with another stop?
                        let routeLine = activeRoute.routeLine;
                        let pointIndex = args.vertexinfo.pointIndex;
                        let segmentIndex = args.vertexinfo.segmentIndex;
                        activeLocation = routeLine.routeLine.geometry.getPoint(segmentIndex, pointIndex);
                        // convert to pixel and find an intersecting stop
                        let map = this.options.map;
                        let extent = map.extent;
                        let [width, height] = [map.width, map.height];
                        let pixel = map.toScreen(activeLocation);
                        pixel.x -= delta / 2;
                        pixel.y -= delta / 2;
                        let topLeft = map.toMap(pixel);
                        pixel.x += delta;
                        pixel.y += delta;
                        let bottomRight = map.toMap(pixel);
                        extent = new Extent(topLeft.x, bottomRight.y, bottomRight.x, topLeft.y, map.spatialReference);
                        targetRoute = first(this.routes, route => {
                            targetStop = first(route.stops, stop => extent.contains(stop.stop.geometry));
                            return !!targetStop;
                        });
                        if (!targetRoute) {
                            targetStop = first(this.orphans, stop => extent.contains(stop.stop.geometry));
                        }
                        doit();
                    }),
                    editor.on("vertex-move", args => {
                        // does it intersect with another stop?                    
                        let map = this.options.map;
                        let g = args.vertexinfo.graphic;
                        let startPoint = g.geometry;
                        let tx = args.transform;
                        let endPoint = map.toMap(map.toScreen(startPoint).offset(tx.dx, tx.dy));
                        // draw a 'cursor' as a hack to render text over the active vertex
                        if (!cursor) {
                            cursor = new Graphic(endPoint, new TextSymbol(cursorStyle(activeRoute, (1 + activeVertexIndex - (activeRoute.startLocation ? 1 : 0) + ""))));
                            this.layer.add(cursor);
                        }
                        else {
                            cursor.setGeometry(endPoint);
                            cursor.draw();
                            cursor.getShape().moveToFront();
                        }
                    }),
                    editor.on("vertex-add", args => {
                        // does it intersect with another stop?
                    }),
                    editor.on("deactivate", evt => {
                        // stop listening for editor events
                        handles.forEach(h => h.remove());
                    }),
                ];
            }
        }
        RouteViewer.RouteView = RouteView;
    })(RouteViewer = exports.RouteViewer || (exports.RouteViewer = {}));
    function run() {
        let map = new Map(document.getElementById("map"), {
            center: [-115.257, 36.194],
            zoom: 13,
            basemap: 'streets'
        });
        {
            let editor = new Edit(map, {
                allowAddVertices: true,
                allowDeleteVertices: false,
                ghostLineSymbol: new SimpleLineSymbol(editorLineStyle),
                vertexSymbol: new SimpleMarkerSymbol(editorVertexStyle)
            });
            let routeView = new RouteViewer.RouteView({
                map: map,
                route: route
            });
            // primary events
            routeView.on("unassign-stop", args => console.log("unassign-stop"));
            routeView.on("reassign-stop", args => console.log("reassign-stop"));
            // low-level events
            routeView.on("remove-orphan", args => console.log("remove-orphan"));
            routeView.on("add-orphan", args => console.log("add-orphan"));
            routeView.on("remove-stop", args => console.log("remove-stop"));
            routeView.on("add-stop", args => console.log("add-stop"));
            routeView.on("move-stop", args => console.log("move-stop"));
            map.on("click", () => {
                editor.deactivate();
            });
            routeView.layer.on("click", (args) => {
                event.stop(args);
                routeView.edit(editor, args.graphic, {
                    moveStop: args.shiftKey
                });
            });
        }
    }
    exports.run = run;
});
define("labs/ags-solve-proxy", ["require", "exports", "labs/ajax"], function (require, exports, Ajax) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BaseSolve {
        constructor(url) {
            this.ajax = new Ajax(url);
        }
        solve(data) {
            return this.ajax.get(data);
        }
        ;
    }
    exports.default = BaseSolve;
    function run() {
        console.log("this is an abstract class for route, closest facility and service area");
    }
    exports.run = run;
});
define("labs/ags-route-solve-proxy", ["require", "exports", "labs/ags-solve-proxy", "dojo/_base/lang"], function (require, exports, ags_solve_proxy_1, lang) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * http://sampleserver6.arcgisonline.com/arcgis/sdk/rest/index.html#/Network_Layer/02ss0000009p000000/
     */
    class RouteSolve extends ags_solve_proxy_1.default {
        /**
         * http://sampleserver6.arcgisonline.com/arcgis/sdk/rest/index.html#/Solve_Route/02ss0000001t000000/
         */
        solve(data) {
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
            req.stops = data.stops.map(p => `${p.x},${p.y}`).join(';');
            return this.ajax.get(req);
        }
    }
    exports.default = RouteSolve;
    function run() {
        new RouteSolve("//sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/Route/solve")
            .solve({ stops: [{ x: -117.141724, y: 32.7122 }, { x: -117.141724, y: 32.72 }] })
            .then((value) => {
            // how to get route to return json?
            if (value.error) {
                console.error(value.error.message);
            }
            else {
                console.log("solve", value);
            }
            return value;
        });
    }
    exports.run = run;
});
define("labs/ags-servicearea-solve-proxy", ["require", "exports", "labs/ags-solve-proxy", "dojo/_base/lang"], function (require, exports, ags_solve_proxy_2, lang) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ServiceAreaSolve extends ags_solve_proxy_2.default {
        solve(data) {
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
    exports.default = ServiceAreaSolve;
    function run() {
        new ServiceAreaSolve("//sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/ServiceArea/solveServiceArea")
            .solve({
            facilities: "-117.141724,32.7122",
            returnFacilities: true,
            outSR: 4326
        })
            .then((value) => {
            // how to get route to return json?
            if (value.error) {
                console.error(value.error.message);
            }
            else {
                console.log("solve", value);
            }
            return value;
        });
    }
    exports.run = run;
});
define("labs/ags-suggest-proxy", ["require", "exports", "dojo/_base/lang", "labs/ajax"], function (require, exports, lang, Ajax) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Suggest {
        constructor(url) {
            this.ajax = new Ajax(url);
        }
        suggest(data) {
            let req = lang.mixin({
                f: "pjson",
                category: "Address",
                countryCode: "USA"
            }, data);
            return this.ajax.get(req);
        }
    }
    exports.default = Suggest;
    function run() {
        new Suggest("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest")
            .suggest({ text: "50 Datastream Plaza, Greenville SC" })
            .then((value) => {
            // how to get route to return json?
            console.log("text", value.suggestions.map(s => s.text));
            console.log(value);
        });
    }
    exports.run = run;
});
define("labs/ags-webmap", ["require", "exports", "esri/arcgis/utils", "esri/arcgis/OAuthInfo", "esri/IdentityManager"], function (require, exports, utils, OAuthInfo, IdentityManager) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //https://www.arcgis.com/sharing/oauth2/approve?oauth_state=GD6ps1QHrIq-evMlDEj9BkwQqP8qtCMm-r1-zNkUobLFtk4E04D7TJ4Cn0pkeZ56svApgSHK9iRY7HasLI4YrUYIP5wunF_syiATUiY4hyenri_P2OazODUVl28SwOONAOZKzbRVIHamNdtpSo_sBtl_ahDqHArMbiV3dxkDMgr5eLWYpaJxFpGIdMpj0bjaSz_OcgrHej3jmUT-RBRlQrKhgFdHmFmf0k8zhfKIYx8GnlzS6BqZqNo8Hz0ZIpQuTAfza-qg4ZyhMS8DhEI377hLlrb5PMcTeDl7-NpMlfyDjWHecmI0OmOLEOaMSy58LYaFJtZIH46c7fKvE5ESZg..
    // https://www.arcgis.com/sharing/oauth2/authorize?client_id=313b7327133f4802affee46893b4bec7&response_type=token&state=%7B%22portalUrl%22%3A%22https%3A%2F%2Fwww.arcgis.com%22%7D&expiration=20160&redirect_uri=http%3A%2F%2Flocalhost%2Fags-lab%2Foauth-callback.html
    function run(appId = "vK2LJni4ozSNXdmj") {
        debugger;
        "hereiam: cannot access without OAUTH configuration...read email from Brian";
        let response = {
            "error": {
                "code": 403,
                "messageCode": "GWM_0003",
                "message": "You do not have permissions to access this resource or perform this operation.", "details": []
            }
        };
        var info = new OAuthInfo({
            appId: appId,
            // Uncomment the next line and update if using your own portal
            // portalUrl: "https://<host>:<port>/arcgis"
            // Uncomment the next line to prevent the user's signed in state from being shared
            // with other apps on the same domain with the same authNamespace value.
            // authNamespace: "portal_oauth_inline",
            popup: false
        });
        // typings wrong..it has no constructor
        let id = IdentityManager;
        id.registerOAuthInfos([info]);
        console.log("info", info, "id", id);
        let cred = id.getCredential(info.portalUrl + "/sharing").then(() => {
            debugger;
        }).otherwise(() => {
        });
        id.checkSignInStatus(info.portalUrl + "/sharing").then(() => {
            debugger;
        }).otherwise(() => {
        });
        false && utils.createMap(appId, "map").then((response) => {
            debugger;
            // now we can use the map
            response.itemInfo.itemData;
            // and we have the webmap configuration
            response.itemInfo.itemData.operationalLayers;
        });
    }
    exports.run = run;
    ;
});
define("labs/console", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function run() {
        let content = document.getElementById("console");
        if (!content)
            return;
        let log = console.log;
        console.log = (...args) => {
            log.apply(console, args);
            let div = document.createElement("textarea");
            div.innerText = args.map(JSON.stringify).join(" ");
            content.insertBefore(div, null);
        };
    }
    exports.run = run;
});
define("labs/index", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function run() {
        let l = window.location;
        let path = `${l.origin}${l.pathname}?run=labs/`;
        let labs = `
    ags-catalog-proxy
    ags-feature-proxy
    ags-feature-query-proxy
    ags-find-address-proxy
    ags-find-proxy
    ags-geometry-proxy
    ags-lrs-proxy
    ags-map-export-proxy
    ags-map-find-proxy
    ags-map-identify-proxy
    ags-map-query-proxy
    ags-reverse-geocode-proxy
    ags-route-editor
    ags-route-solve-proxy
    ags-servicearea-solve-proxy
    ags-solve-proxy
    ags-suggest-proxy
    ags-webmap
    index
    maplet
    pubsub    
    `;
        let styles = document.createElement("style");
        document.head.appendChild(styles);
        styles.innerText += `
    #map {
        display: none;
    }
    .test {
        margin: 20px;
    }
    `;
        let labDiv = document.createElement("div");
        document.body.appendChild(labDiv);
        labDiv.innerHTML = labs
            .split(/ /)
            .map(v => v.trim())
            .filter(v => !!v)
            //.sort()
            .map(lab => `<div class='test'><a href='${path}${lab}&debug=1'>${lab}</a></div>`)
            .join("\n");
        let testDiv = document.createElement("div");
        document.body.appendChild(testDiv);
    }
    exports.run = run;
    ;
});
define("labs/pubsub", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class PubSub {
        constructor() {
            this.topics = {};
        }
        subscribe(topic, listener) {
            if (!this.topics[topic])
                this.topics[topic] = [];
            var index = this.topics[topic].push(listener) - 1;
            return {
                remove: () => delete this.topics[topic][index]
            };
        }
        publish(topic, info = {}) {
            if (!this.topics[topic])
                return;
            this.topics[topic].forEach(item => item(info));
        }
    }
    exports.default = PubSub;
    function run() {
        let topic = new PubSub();
        topic.subscribe("hello", args => console.log("hello", args));
        topic.publish("hello", 1);
    }
    exports.run = run;
});
define("labs/maplet", ["require", "exports", "dojo/dom-construct", "labs/pubsub", "esri/map", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/geometry/Point", "esri/geometry/Polygon", "esri/graphic", "esri/renderers/HeatmapRenderer", "esri/layers/FeatureLayer", "esri/layers/ArcGISTiledMapServiceLayer", "esri/layers/ArcGISDynamicMapServiceLayer"], function (require, exports, domConstruct, pubsub_1, Map, MarkerSymbol, LineSymbol, FillSymbol, Point, Polygon, Graphic, HeatmapRenderer, FeatureLayer, ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let topic = new pubsub_1.default();
    let asList = (nodeList) => {
        let result = [];
        for (let i = 0; i < nodeList.length; i++) {
            result.push(nodeList[i]);
        }
        return result;
    };
    let html = `
<br/><label for="geometry">Add Geometry To Map</label>
<br/><textarea id="geometry">[-82.4,34.85]</textarea>
<br/><button data-event="add-geometry-to-map">Add</button>
`;
    function watchers() {
        /** add the geometry to the map  */
        topic.subscribe("add-geometry-to-map", () => {
            let textarea = document.getElementById("geometry");
            let geomText = textarea.value;
            let geomJs = JSON.parse(geomText);
            if ("x" in geomJs)
                geomJs = [geomJs];
            if (Array.isArray(geomJs)) {
                let items = geomJs;
                if (typeof geomJs[0]["x"] !== "undefined") {
                    items.forEach(item => topic.publish("add-point", item));
                }
                else {
                    if (Array.isArray(geomJs[0])) {
                        if (typeof geomJs[0][0] == "number") {
                            topic.publish("add-polyline", items);
                        }
                        else {
                            topic.publish("add-polygon", items);
                        }
                    }
                    else {
                        topic.publish("add-point", { x: items[0], y: items[1] });
                    }
                }
                console.log(geomJs);
                textarea.value = "";
            }
        });
        domConstruct.place(html, document.body, "first");
        let events = asList(document.querySelectorAll("[data-event]"));
        events.forEach(e => e.addEventListener("click", () => topic.publish(e.dataset["event"], e)));
    }
    class Maplet {
        constructor(element) {
            let map = new Map(element, {
                center: new Point(-122, 37)
            });
            this.map = map;
        }
        // 3857
        addBasemap(url = "//services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer") {
            let layer = new ArcGISTiledMapServiceLayer(url, {});
            this.map.addLayer(layer);
            return layer;
        }
        // 4326
        addDynamicLayer(url = "//sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Population_World/MapServer") {
            var layer = new ArcGISDynamicMapServiceLayer(url);
            layer.setOpacity(0.5);
            this.map.addLayer(layer);
            return layer;
        }
        // 4326
        addFeatureLayer(url = "//services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Earthquakes_Since_1970/FeatureServer/0") {
            let layer = new FeatureLayer(url, {
                mode: FeatureLayer.MODE_SNAPSHOT,
                outFields: ["Name", "Magnitude"]
            });
            this.map.addLayer(layer);
            return layer;
        }
        // 4326
        addHeatmap(url = "//services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Earthquakes_Since_1970/FeatureServer/0") {
            let layer = this.addFeatureLayer(url);
            let heatmapOption = {};
            heatmapOption.colors = ["rgba(0,0,0,0.1)", "rgba(0,0,255,0.5)"];
            heatmapOption.field = "Magnitude";
            heatmapOption.blurRadius = 8;
            heatmapOption.minPixelIntensity = 0;
            heatmapOption.maxPixelIntensity = 250;
            var heatmapRenderer = new HeatmapRenderer(heatmapOption);
            layer.setRenderer(heatmapRenderer);
            return layer;
        }
        measure() {
        }
    }
    exports.default = Maplet;
    function run() {
        watchers();
        var el = document.getElementById('map');
        var map = new Maplet(el);
        //map.addDynamicLayer();
        map.addBasemap();
        //map.addHeatmap();
        //map.addFeatureLayer();
        topic.subscribe("add-point", (point) => {
            let geom = new Point(point.x, point.y);
            let g = new Graphic(geom, new MarkerSymbol());
            map.map.graphics.add(g);
            map.map.centerAt(geom);
        });
        topic.subscribe("add-polyline", (points) => {
            let geom = new Polygon(points);
            let g = new Graphic(geom, new LineSymbol());
            map.map.graphics.add(g);
            map.map.setExtent(geom.getExtent());
        });
        topic.subscribe("add-polygon", (points) => {
            let geom = new Polygon(points);
            let g = new Graphic(geom, new FillSymbol());
            map.map.graphics.add(g);
            map.map.setExtent(geom.getExtent());
        });
    }
    exports.run = run;
});
define("labs/data/findAddressCandidates_response", ["require", "exports"], function (require, exports) {
    "use strict";
    return {
        "spatialReference": {
            "wkid": 102100, "latestWkid": 3857
        }, "candidates": [
            {
                "address": "50 Datastream Plz, Greenville, South Carolina, 29605",
                "location": { "x": -9173569.049505163, "y": 4135405.7745092344 },
                "score": 100,
                "attributes": {
                    "Loc_name": "World",
                    "Status": "M",
                    "Score": 100,
                    "Match_addr": "50 Datastream Plz, Greenville, South Carolina, 29605",
                    "LongLabel": "50 Datastream Plz, Greenville, SC, 29605, USA",
                    "ShortLabel": "50 Datastream Plz",
                    "Addr_type": "StreetAddress", "Type": "",
                    "PlaceName": "",
                    "Place_addr": "50 Datastream Plz, Greenville, South Carolina, 29605",
                    "Phone": "", "URL": "", "Rank": 20, "AddBldg": "",
                    "AddNum": "50", "AddNumFrom": "98", "AddNumTo": "2",
                    "AddRange": "2-98", "Side": "L", "StPreDir": "",
                    "StPreType": "", "StName": "Datastream", "StType": " Plz",
                    "StDir": "", "BldgType": "", "BldgName": "", "LevelType": "",
                    "LevelName": "", "UnitType": "", "UnitName": "", "SubAddr": "",
                    "StAddr": "50 Datastream Plz", "Block": "", "Sector": "", "Nbrhd": "",
                    "District": "", "City": "Greenville", "MetroArea": "",
                    "Subregion": "Greenville County", "Region": "South Carolina",
                    "RegionAbbr": "SC", "Territory": "", "Zone": "", "Postal": "29605",
                    "PostalExt": "3451", "Country": "USA", "LangCode": "ENG",
                    "Distance": 0, "X": -82.407572870962795, "Y": 34.790194008903825,
                    "DisplayX": -82.407572870962795, "DisplayY": 34.790194008903825,
                    "Xmin": -82.4085728709628, "Xmax": -82.40657287096279,
                    "Ymin": 34.789194008903827, "Ymax": 34.791194008903823,
                    "ExInfo": ""
                },
                "extent": {
                    "xmin": -9173680.3689959571,
                    "ymin": 4135270.2259676843,
                    "xmax": -9173457.7300143708,
                    "ymax": 4135541.3246944472
                }
            }
        ]
    };
});
define("labs/data/suggest_response", ["require", "exports"], function (require, exports) {
    "use strict";
    return {
        "suggestions": [
            {
                "text": "50 Datastream Plz, Greenville, SC, 29605, USA",
                "magicKey": "dHA9MCNsb2M9ODE4MTU1MiNsbmc9MzMjaG49NTAjbGJzPTEwOTo0MjMwMDQ0NQ==",
                "isCollection": false
            }, {
                "text": "Datastream Systems, 50 Datastream Plz, Greenville, SC, 29605, USA",
                "magicKey": "dHA9MCNsb2M9ODE4MTU1MiNsbmc9MzMjcGw9MjkzMjgwMiNsYnM9MTQ6MTAyMzg3NzA=",
                "isCollection": false
            }, {
                "text": "DST Datastream Technologies, 13 Jalan Perdana 2/7, Pandan Perdana, Pandan Indah, Hulu Langat, 55100, Selangor, MYS",
                "magicKey": "dHA9MCNsb2M9NDA1NjQ2MTQjbG5nPTkyI3BsPTQwMzA4NjI2I2xicz0xNDoxMDA0MjI0NQ==",
                "isCollection": false
            }
        ]
    };
});
let mappings = {
    source: {
        url: "http://usalvwdgis1:6080/arcgis/rest/services/Annotations/H840_Annotations/FeatureServer/3",
        type: "ags"
    },
    target: {
        url: "http://usalvwdgis1:6080/arcgis/rest/services/Annotations/H840_Annotations/FeatureServer/3",
        type: "wfs"
    },
    mapping: {
        "GlobalID": "globalid",
        "H8EXPDATE": "h8expdate",
        "last_edited_user": "last_edited_user",
        "last_edited_date": "last_edited_date",
        "shape": "geom"
    }
};
define("labs/widgets/auto-complete", ["require", "exports", "dojo/debounce", "labs/data/suggest_response"], function (require, exports, debounce, mockSuggestResponse) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const MIN_SEARCH_LENGTH = 5;
    /**
     * As user types a message invoke multiple "suggest" requests...as response comes
     * in add it to a auto-complete list
     * If user makes a selection invoke a findAddressCandidates request using magic-key
     * If user presses enter, invoke a findAddressCandidates request using input value
     */
    let styles = document.createElement("style");
    styles.innerText = `
    :root {
      --border-color: rgba(255,255,200,1);
    }

    .mock-auto-complete {
      display: inline-block;
      padding: 1em;
      background-color: #777777;
    }

    .mock-auto-complete .search-area {
      border: 1px solid silver;
      padding: 1em;
      display: grid;
      grid-template-columns: 16em 1.5em 2em;
      grid-template-areas:
        "search cancel run"
        "results results results";
    }

    .mock-auto-complete .search-area .search {
      grid-area: search;
    }

    .mock-auto-complete .search-area .run {
      grid-area: run;
    }

    .mock-auto-complete .search-area .cancel {
      grid-area: cancel;
    }

    .mock-auto-complete .result-area {
      grid-area: results;
    }

    .mock-auto-complete .result-area .result-list {
      display: grid;
    }

    .mock-auto-complete .result-area .result-list .provider {
    }

    .mock-auto-complete .result-list .result-item {
      cursor: pointer;
      padding: 0.5em;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      border-left: 1px solid transparent;
      height: 0;
      animation: grow 250ms forwards linear;
    }

    .mock-auto-complete .result-list .result-item:hover {
      transition: all 200ms ease-in;
      border-left-color: var(--border-color);
    }

    .mock-auto-complete .result-list .provider .spin {
      width: 2em;
      height: 2em;
      animation: spin 1000ms infinite linear;
      transform: scale(0);
    }

    .mock-auto-complete .result-list .provider .spin.fade-out {
      animation: fadeout 200ms forwards linear;
    }

    @keyframes hightlight {
      100% {
        border-left-color: var(--border-color);
      }
    }

    @keyframes grow {
      from {height:0;}
      to {height:auto;}
    }

    @keyframes spin {
      from {transform:translate(0, 10px) rotate(0deg);}
      to {transform:translate(0, 10px) rotate(360deg);}
    }

    @keyframes fadeout {
      from {transform:scale(1);}
      to {transform:scale(0);}
    }
`;
    document.head.appendChild(styles);
    function asDom(html) {
        let div = document.createElement("div");
        div.innerHTML = html.trim();
        return div.firstChild;
    }
    function run() {
        return __awaiter(this, void 0, void 0, function* () {
            const autoCompleteInput = `
<div class="mock-auto-complete">
  <svg style="display:none" viewBox="-10 -10 20 20">
  <defs>
    <g id="progress-spinner">
      <circle class="track" cx="0" cy="0" r="5" fill="none" stroke="#888888" stroke-width="1" />
      <circle class="ball" cx="0" cy="-5" r="1" fill="#000000" stroke-width="0" />
      <circle class="ball" cx="0" cy="5" r="1" fill="#ffffff" stroke-width="0" />
    </g>
    <g id="icon-search" viewBox="0 0 18 18">
      <path d="M17.707 16.293l-5.108-5.109A6.954 6.954 0 0014 7c0-3.86-3.141-7-7-7S0 3.14 0 7s3.141 7 7 7a6.958 6.958 0 004.185-1.402l5.108 5.109a.997.997 0 001.414 0 .999.999 0 000-1.414zM7 12c-2.757 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5z"
      fill="currentColor" fill-rule="nonzero" stroke="none"></path>
    </g>
    <g id="icon-close" viewBox="0 0 18 18">
      <path
        d="M10.414 9l5.293-5.293a.999.999 0 10-1.414-1.414L9 7.586 3.707 2.293a.999.999 0 10-1.414 1.414L7.586 9l-5.293 5.293a.999.999 0 101.414 1.414L9 10.414l5.293 5.293a.997.997 0 001.414 0 .999.999 0 000-1.414L10.414 9"
        fill="currentColor" fill-rule="evenodd" stroke="none"></path>
    </g>
  </defs>
  </svg>
  <div class="search-area">
    <input class="search" placeholder="find address"></input>
    <button class="cancel" type="button">
    <svg viewBox="0 0 18 18"><use href="#icon-close"></use></svg>
    </input>
    <button class="run" type="button">
      <svg viewBox="0 0 18 18"><use href="#icon-search"></use></svg>
    </button>
    <div class="result-area">
      <div class="result-list">
      </div>
    </div>
  </div>
</div>
`;
            let widget = asDom(autoCompleteInput);
            let input = widget.querySelector(".search");
            let cancel = widget.querySelector(".cancel");
            let run = widget.querySelector(".run");
            let resultItems = widget.querySelector(".result-list");
            const createSpinner = (className) => `<svg class="${className}" viewBox="-10 -10 20 20"><use href="#progress-spinner"></use></svg>`;
            function search(singleLineInput) {
                return __awaiter(this, void 0, void 0, function* () {
                    console.log(`searching for "${singleLineInput}"`);
                    return new Promise((good, bad) => {
                        let response = mockSuggestResponse.suggestions.map(v => ({
                            text: `${v.text}`,
                            magicKey: `${Math.random()}`
                        }));
                        try {
                            setTimeout(() => good(response), 100 + Math.random() * 5000);
                        }
                        catch (ex) {
                            bad(ex);
                        }
                    });
                });
            }
            let resultData = {};
            function merge(suggestion, before) {
                resultData[suggestion.magicKey] = suggestion;
                let li = document.createElement("div");
                li.tabIndex = 0;
                li.classList.add("result-item");
                li.title = suggestion.text;
                li.innerText = suggestion.text;
                if (!!before) {
                    before.insertAdjacentElement("afterend", li);
                }
                else {
                    resultItems.appendChild(li);
                }
                return li;
            }
            let priorSearchValue = "";
            const searchAllProviders = () => {
                let searchValue = input.value;
                if (priorSearchValue === searchValue)
                    return;
                priorSearchValue = searchValue;
                resultItems.innerText = "";
                if (input.value.length < MIN_SEARCH_LENGTH) {
                    return; // will not perform search
                }
                return Promise.all(["Addresses", "Parcel Layer", "Address Layer"].map((providerName) => __awaiter(this, void 0, void 0, function* () {
                    let results = search(input.value);
                    let progress = asDom(`<div class="provider"><label>${providerName}</label>${createSpinner("spin")}</div>`);
                    resultItems.appendChild(progress);
                    results.then(suggestions => {
                        suggestions.forEach(suggestion => merge(suggestion, progress));
                        if (!suggestions.length) {
                            progress.remove();
                        }
                        else {
                            progress.querySelector(".spin").classList.add("fade-out");
                        }
                    });
                    return results;
                })));
            };
            const slowSearch = debounce(() => __awaiter(this, void 0, void 0, function* () {
                searchAllProviders();
            }), 500);
            input.addEventListener("keyup", event => {
                slowSearch();
            });
            document.body.insertBefore(widget, document.body.firstChild);
            input.value = "12345";
            yield searchAllProviders();
            console.log("done");
        });
    }
    exports.run = run;
});
/**
 * https://developers.google.com/earth-engine/geometries_planar_geodesic?hl=en
 * geodesic: shortest path on the surface of a earth
 * planar: shortest path on paper
 *
 * Renders scaleline and measurement controls
 * Uses geometry services to calculate planar and geodesic lengths
 * Confirms the measure tool reports geodesic measurements
 */
define("ux/geodesic-planar-ux", ["require", "exports", "esri/map", "esri/dijit/Scalebar", "esri/dijit/Measurement", "esri/units", "esri/config", "esri/tasks/GeometryService", "esri/tasks/BufferParameters", "esri/tasks/LengthsParameters", "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol", "esri/graphic", "esri/Color", "dojo/Deferred"], function (require, exports, Map, Scalebar, Measurement, Units, Config, GeometryService, BufferParameters, LengthsParameters, SimpleFillSymbol, SimpleLineSymbol, Graphic, Color, Deferred) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let geometryService = Config.defaults.geometryService = new GeometryService("https://sampleserver6.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer");
    /**
     * Giving SystemJS a try to transform coordinates to 4326 before using geodesy to calculate distances
     */
    let distanceTo = (points) => {
        let d = new Deferred();
        System.import("proj4").then((proj4) => {
            let epsg4326 = new proj4.Proj("EPSG:4326");
            let epsg3857 = new proj4.Proj("EPSG:3857");
            let transform = proj4(epsg3857, epsg4326);
            points = points.map(p => transform.forward(p));
            System.import("geodesy").then((geodesy) => {
                let geodesyPoints = points.map(p => new geodesy.LatLonSpherical(p[1], p[0]));
                let distance = 0;
                for (let i = 1; i < geodesyPoints.length; i++)
                    distance += geodesyPoints[i - 1].distanceTo(geodesyPoints[i]);
                d.resolve({
                    distance: distance
                });
            });
        });
        return d;
    };
    function run() {
        let map = new Map("map", {
            basemap: "dark-gray",
            center: [-82.39, 34.85],
            zoom: 15
        });
        let scalebar = new Scalebar({
            map: map,
            scalebarUnit: "dual"
        });
        let measurement = new Measurement({
            map: map,
            advancedLocationUnits: true,
            defaultAreaUnit: Units.SQUARE_METERS,
            defaultLengthUnit: Units.METERS
        }, document.getElementById("measurement"));
        measurement.on("measure-end", (args) => {
            console.log("measure", args);
            switch (args.geometry.type) {
                case "point":
                    break;
                case "polyline":
                    // geodesy library
                    distanceTo(args.geometry.paths[0]).then((args) => {
                        console.log("geodesy", args.distance);
                    });
                    // esri geometry service
                    let lengths = new LengthsParameters();
                    lengths.geodesic = false;
                    lengths.polylines = [args.geometry];
                    geometryService.lengths(lengths, (args) => {
                        console.log("planar lengths", args.lengths);
                        lengths.geodesic = true;
                        geometryService.lengths(lengths, (args) => {
                            console.log("geodesic lengths", args.lengths);
                        });
                    });
                    break;
                default:
                    break;
            }
            if (false) {
                let buffer = new BufferParameters();
                buffer.geodesic = true;
                buffer.bufferSpatialReference = map.spatialReference;
                buffer.geometries = [args.geometry];
                buffer.outSpatialReference = map.spatialReference;
                buffer.distances = [1];
                buffer.unit = GeometryService.UNIT_METER;
                geometryService.buffer(buffer, (bufferedGeometries) => {
                    let symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]));
                    let graphics = bufferedGeometries.map(g => new Graphic(g, symbol));
                    graphics.forEach(g => map.graphics.add(g));
                });
            }
        });
        measurement.startup();
    }
    exports.run = run;
});
/// <reference path="../app.d.ts" />
// To use the IdentityManager simply include esri/IdentityManager as part of your require statement.
//import "esri/IdentityManager";
define("ux/routing-prototype", ["require", "exports", "dijit/registry", "dojo/on", "dojo/topic", "dojo/dom-construct", "dojo/debounce", "esri/InfoTemplate", "esri/dijit/Directions", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleMarkerSymbol", "esri/Color", "esri/graphic", "esri/tasks/RouteParameters", "ips/services"], function (require, exports, registry, on, topic, domConstruct, debounce, InfoTemplate, DirectionsWidget, SimpleLineSymbol, SimpleMarkerSymbol, Color, Graphic, RouteParams, Services) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let config = {
        zones: [{
                name: "red",
                color: new Color([200, 60, 60])
            }, {
                name: "green",
                color: new Color([60, 200, 60])
            }, {
                name: "blue",
                color: new Color([60, 60, 200])
            }]
    };
    function toArray(l) {
        let r = [];
        for (let i = 0; i < l.length; i++) {
            r.push(l[i]);
        }
        return r;
    }
    ;
    function getRoutes(routesDom, config) {
        let manager = new RouteManager(routesDom, config);
        manager.createRoutes().then(() => {
            manager.addCommand({ text: "Refresh", execute: () => {
                    manager.routingService.createRoutes().then(routes => {
                        console.log("refreshed routes", routes);
                        manager.destroyRoutes();
                        manager.createRoutes();
                    });
                } });
            manager.addCommand({ text: "Create Test Routes", execute: () => {
                    manager.routingService.forceSampleRoutes().then(routes => {
                        debugger;
                        console.log("test routes", routes);
                        manager.destroyRoutes();
                        manager.createRoutes();
                    });
                } });
        });
    }
    exports.getRoutes = getRoutes;
    /**
     * container for multiple directions widgets
    */
    class RouteManager {
        constructor(routesDom, config) {
            this.routesDom = routesDom;
            this.config = config;
            this.template = `<div class="routes"></div><div class="commands"></div>`;
            this._widgets = [];
            this.routeItemMap = {};
            this.routingService = new Services.Routing(config.restapi);
            domConstruct.place(this.template, routesDom);
        }
        get routes() {
            return this.routesDom.getElementsByClassName("routes")[0];
        }
        get commands() {
            return this.routesDom.getElementsByClassName("commands")[0];
        }
        destroyRoutes() {
            while (this._widgets.length) {
                this._widgets.pop().destroy();
            }
        }
        createRoutes() {
            let status = document.createElement("label");
            status.classList.add("status", "hidden");
            this.routesDom.appendChild(status);
            this._widgets.push({ destroy: () => this.routesDom.removeChild(status) });
            let h = setInterval(() => {
                status.innerHTML += ".";
            }, 2000);
            let reportStatus = (text) => {
                status.classList.remove("hidden");
                status.innerHTML = text + "&nbsp;";
                status.title = text;
            };
            let removeStatus = () => {
                clearInterval(h);
                status.classList.add("hidden");
            };
            reportStatus("Authenticating");
            return this.routingService.auth(this.config.auth)
                .then(() => {
                reportStatus("Getting routes");
                return this.routingService.getRoutes()
                    .then(routes => {
                    removeStatus();
                    if (!routes.data.length) {
                        reportStatus("No routes found");
                    }
                    routes.data.map((route, i) => {
                        // create a container
                        {
                            let routeNode = domConstruct.toDom(this.routeTemplate(route));
                            this.routes.appendChild(routeNode);
                            this._widgets.push({ destroy: () => routeNode.parentNode.removeChild(routeNode) });
                        }
                        this.initializeDirections(`EMP_${route.employeeId}`, this.config.map, route, "red,green,blue".split(",")[i % 3]);
                    });
                    this.parse();
                })
                    .catch(() => {
                    const msg = "failed to get routes";
                    console.error(msg, this.config.auth.username);
                    reportStatus(msg);
                    clearInterval(h);
                    throw msg;
                });
            })
                .catch(() => {
                const msg = "failed to authenticate";
                console.error(msg, this.config.auth.username);
                reportStatus(msg);
                throw msg;
            });
        }
        addCommand(cmd) {
            let button = domConstruct.create("button", {
                className: "ipsOptimizeButton",
                innerHTML: cmd.text
            });
            on(button, "click", () => cmd.execute());
            domConstruct.place(button, this.commands);
        }
        parse() {
            let togglers = toArray(document.getElementsByClassName("toggler"));
            togglers.forEach(t => {
                let doit = () => {
                    var target = document.getElementById(t.dataset['ipsTogglerFor']);
                    t.checked ? target.classList.remove("hidden") : target.classList.add("hidden");
                };
                t.addEventListener("click", doit);
                doit();
            });
        }
        getActivityName(routeItem) {
            return `${routeItem.activityType} #${routeItem.id}`;
        }
        initializeDirections(id, map, route, zoneId = "blue") {
            let zone = config.zones.filter(z => z.name === zoneId)[0];
            let marker = new SimpleMarkerSymbol({
                "color": zone.color,
                "size": 16,
                "xoffset": 0,
                "yoffset": 0,
                "type": "esriSMS",
                "style": SimpleMarkerSymbol.STYLE_CIRCLE,
                "outline": {
                    "color": zone.color,
                    "width": 1,
                    "type": "esriSLS",
                    "style": "esriSLSSolid"
                }
            });
            // marker.getStroke = () => {
            //     let color = this.color;
            //     return {
            //         color: this.color,
            //         style: this.style,
            //         width: this.width
            //     }
            // };
            marker.color.a = 0.5;
            let routeLines = new SimpleLineSymbol("solid", new Color(zone.color), 3);
            routeLines.color.a = 0.5;
            let updateRoute = debounce(() => {
                console.log("notify services of change");
                let routeItems = w.stops.map((s) => this.routeItemMap[s.name]);
                routeItems.forEach((r, i) => r.ordinalIndex = i + 1);
                this.routingService.updateRoute(route.id, routeItems.map(i => i.id)).catch(() => {
                    console.error("failed to update the route", route.id);
                });
            }, 500);
            let infoTemplate = new InfoTemplate();
            let routeParams = new RouteParams();
            routeParams.returnDirections = false;
            routeParams.preserveLastStop = false;
            routeParams.startTime; // TODO
            let w = new DirectionsWidget({
                map: map,
                routeTaskUrl: "//sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/Route",
                //routeTaskUrl: "http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World",
                traffic: false,
                optimalRoute: false,
                autoSolve: false,
                returnToStart: false,
                showReturnToStartOption: false,
                showReverseStopsButton: false,
                dragging: false,
                showActivateButton: false,
                showClearButton: false,
                showMilesKilometersOption: false,
                showOptimalRouteOption: false,
                showPrintPage: false,
                showTrafficOption: false,
                showTravelModesOption: false,
                fromSymbol: marker,
                stopSymbol: marker,
                toSymbol: marker,
                unreachedSymbol: marker,
                textSymbolOffset: { x: 0, y: -4 },
                routeSymbol: routeLines,
                routeParams: routeParams,
                stops: [],
                stopsInfoTemplate: infoTemplate
            }, id);
            this._widgets.push(w);
            w.zoomToFullRoute = () => {
                // not allowed
            };
            let actionsPane = map.infoWindow.domNode.getElementsByClassName("actionsPane")[0];
            actionsPane.classList.add("hidden");
            infoTemplate.setContent((args) => {
                let routeItem = this.routeItemMap[args.attributes.address];
                let data = routeItem;
                let keys = Object.keys(data).filter(k => typeof data[k] !== "Object");
                keys = "id,isActivityCompleted,scheduledDate,activityType,lastModifiedBy,lastModifiedDateTime".split(',');
                let body = domConstruct.toDom(`${keys.map(k => `${k}: ${data[k]}`).join("<br/>")}`);
                let showInfo = domConstruct.toDom(`<a title="Show Info" to="" class="command showInfo"><span>Show Info</span></a>`);
                on(showInfo, "click", () => topic.publish("routing/show-info", routeItem.activity));
                let commands = domConstruct.toDom(`<div class="commands"></div>`);
                commands.appendChild(showInfo);
                body.appendChild(commands);
                return body;
            });
            infoTemplate.setTitle((args) => {
                return `${args.attributes.address}`;
            });
            w.on("segment-highlight", (g) => {
            });
            w.on("directions-clear", () => {
                //
            });
            w.on("directions-start", () => {
                // updateRoute();
            });
            w.on("directions-finish", () => {
                let stopIcons = w.domNode.getElementsByClassName("esriStopIcon");
                w.stops.forEach((s, i) => {
                    let routeItem = this.routeItemMap[s.name];
                    if (routeItem) {
                        // really want do know if the insp. has alreay been completed...
                        stopIcons[i].classList.add(routeItem.isActivityCompleted ? "COMPLETE" : "PENDING");
                    }
                });
            });
            w.on("directions-finish", () => {
                let groups = toArray(document.getElementById(id).getElementsByClassName("searchInputGroup"));
                groups = groups.filter(g => g.getElementsByClassName("ips-info").length === 0);
                groups.forEach(g => {
                    let div = document.createElement("label");
                    div.classList.add("ips-info");
                    g.appendChild(div);
                });
            });
            w.startup();
            {
                let optimizeButton = document.createElement("button");
                optimizeButton.className = "ipsOptimizeButton";
                optimizeButton.innerHTML = "Optimize";
                let parent = w.domNode.getElementsByClassName("esriStopsButtons")[0];
                parent.appendChild(optimizeButton);
                optimizeButton.onclick = () => {
                    w.reset();
                    this.routingService.optimizeRoute(route.id).then(newRoute => {
                        route = newRoute.data;
                        w.clearDirections();
                        w.stops = [];
                        addStops();
                    });
                };
            }
            w.on("load", () => {
                let stopLayer = w._stopLayer;
                let i = 0;
                stopLayer.on("graphic-add", (args) => {
                    let g = args.graphic;
                    if (g.symbol.type === "simplemarkersymbol") {
                        let routeItem = this.routeItemMap[g.attributes.address];
                        if (routeItem) {
                            let symbol = new SimpleMarkerSymbol(g.symbol.toJson());
                            // really want do know if the insp. has alreay been completed...
                            if (routeItem.isActivityCompleted) {
                                symbol.color.a = 0.1;
                                symbol.outline.color = new Color([200, 200, 200]);
                            }
                            g.setSymbol(symbol);
                        }
                    }
                });
            });
            let addStops = () => {
                w.addStops(route.routeItems.sort((a, b) => a.ordinalIndex - b.ordinalIndex).map(i => {
                    let key = this.getActivityName(i);
                    this.routeItemMap[key] = i;
                    return {
                        name: key,
                        routeItem: i,
                        feature: new Graphic({
                            geometry: i.location,
                            attributes: {
                                score: 100,
                                routeItem: i
                            }
                        })
                    };
                }));
            };
            addStops();
            w.domNode.classList.add(zoneId);
            topic.subscribe("/dnd/drop/before", (source, nodes, copy, target, e) => {
                let dndFrom = registry.getEnclosingWidget(source.parent);
                if (dndFrom == w) {
                    let dndTo = registry.getEnclosingWidget(target.parent);
                    if (dndFrom === dndTo) {
                        updateRoute();
                        return;
                    }
                    let i = dndFrom._dnd.getAllNodes().indexOf(nodes[0]);
                    let j = dndTo._dnd.getAllNodes().indexOf(target.current);
                    let stop = dndFrom.stops[i];
                    let stops1 = dndFrom.stops.filter(s => s !== stop);
                    let stops2 = dndTo.stops.filter(() => true);
                    stops2.splice(j, 0, stop);
                    setTimeout(() => {
                        dndFrom.stops = [];
                        dndFrom.reset().then(() => {
                            dndFrom.addStops(stops1);
                        });
                        dndTo.stops = [];
                        dndTo.reset().then(() => {
                            // update the destination route
                            dndTo.addStops(stops2);
                        });
                    }, 50);
                }
                else {
                    let dndTo = registry.getEnclosingWidget(target.parent);
                    if (w === dndTo)
                        updateRoute();
                }
            });
            return w;
        }
        routeTemplate(route) {
            return `<div class="route">
        <input type="checkbox" checked class="toggler" data-ips-toggler-for="EMP_${route.employeeId}" />
        <label>${route.employeeFullName || route.employeeId}</label>
        <div id="EMP_${route.employeeId}"></div></div>`;
        }
    }
});
