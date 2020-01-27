var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
define("labs/widgets/auto-complete/typings/Geometry", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/typings/SearchResultItem", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/typings/SearchResult", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/typings/AutoCompleteProviderContract", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/typings/RemoveEventHandler", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/typings/WidgetContract", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/typings/WidgetExtensionContract", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/typings/AutoCompleteWidgetContract", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/fun/keys", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function keys(o) {
        return Object.keys(o);
    }
    exports.keys = keys;
});
define("labs/widgets/auto-complete/typings/Dictionary", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/Channel", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Channel {
        constructor() {
            this.topics = {};
        }
        dispose() {
            this.topics = {};
        }
        on(topic, cb) {
            const listener = (this.topics[topic] = this.topics[topic] || []);
            listener.push(cb);
            return {
                remove: () => {
                    const index = listener.indexOf(cb);
                    if (index < 0)
                        return;
                    listener.splice(index, 1);
                }
            };
        }
        publish(topic, ...args) {
            if (!this.topics[topic])
                return false;
            this.topics[topic].forEach(listener => listener(...args));
        }
    }
    exports.Channel = Channel;
});
define("labs/widgets/auto-complete/WidgetBase", ["require", "exports", "labs/widgets/auto-complete/Channel"], function (require, exports, Channel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WidgetBase {
        /**
         * Create a default dom container for a generic widget
         */
        constructor() {
            this.dom = document.createElement("div");
            this.dom.className = "widget";
            this.channel = new Channel_1.Channel();
        }
        dispose() {
            this.dom.remove();
        }
        subscribe(topic, cb) {
            return this.channel.on(topic, cb);
        }
        publish(topic, ...args) {
            return this.channel.publish(topic, ...args);
        }
    }
    exports.WidgetBase = WidgetBase;
});
define("labs/widgets/auto-complete/typings/AutoCompleteEngineContract", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/AutoCompleteEngine", ["require", "exports", "labs/widgets/auto-complete/Channel"], function (require, exports, Channel_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Generic auto-complete
     */
    class AutoCompleteEngine {
        constructor() {
            this.channel = new Channel_2.Channel();
            this.providers = [];
        }
        dispose() {
            this.channel.dispose();
        }
        on(topic, cb) {
            return this.channel.on(topic, cb);
        }
        onError(message) {
            console.log("error", message);
            this.channel.publish("error", message);
        }
        onSuccess(result) {
            console.log("success", result);
            this.channel.publish("success", result);
        }
        search(value) {
            this.channel.publish("start");
            const results = this.providers.map(provider => provider.search(value));
            Promise.all(results)
                .catch(err => {
                this.channel.publish("error", err);
                this.channel.publish("complete");
            })
                .then(() => this.channel.publish("complete"));
            results.forEach(result => {
                result
                    .catch(reason => {
                    this.onError(reason);
                })
                    .then(result => {
                    if (!result)
                        throw "response expected";
                    this.onSuccess(result);
                });
            });
        }
        use(provider) {
            return __awaiter(this, void 0, void 0, function* () {
                this.providers.push(provider);
            });
        }
    }
    exports.AutoCompleteEngine = AutoCompleteEngine;
});
define("labs/widgets/auto-complete/fun/renderResults", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function asDom(html) {
        const div = document.createElement("div");
        div.innerHTML = html.trim();
        return div.firstChild;
    }
    function appendAll(target, source) {
        while (source.firstChild)
            target.appendChild(source.firstChild);
    }
    function prependAll(target, source) {
        while (source.lastChild)
            target.insertBefore(source.lastChild, target.firstChild);
    }
    function renderResults(widget, results) {
        // to be read from configuration
        const getMarkerMarkup = (markerType) => {
            const createMarker = (className) => {
                return `<svg class="${className}" style="width:1em;height:1em" viewBox="-10 -12 20 24"><use href="#icon-marker"></use></svg>`;
            };
            return createMarker((markerType && markerType[0]) || "unknown");
        };
        const asHtml = results.items
            .map(item => `<div class="marker ${results.provider_id}" title="${item.address_type}">${getMarkerMarkup(item.address_type)}</div><div class="data ${results.provider_id}" data-d='${JSON.stringify(item)}'>${item.address}</div>`)
            .join("");
        // add to result grid
        prependAll(widget.ux.results, asDom(`<div>${asHtml.trim()}</div>`));
        const resultNodes = Array.from(widget.ux.results.querySelectorAll(".data"));
        resultNodes.forEach(child => {
            child.tabIndex = 0;
            child.addEventListener("focus", () => {
                const result = document.activeElement;
                if (widget.ux.results !== result.parentElement)
                    return;
                widget.publish("focusresult", JSON.parse(result.dataset.d));
            });
        });
    }
    exports.renderResults = renderResults;
});
define("labs/widgets/auto-complete/fun/injectCss", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function injectCss(namespace, css) {
        if (document.head.querySelector(`style[id="${namespace}"]`))
            throw "css already exists";
        const style = document.createElement("style");
        style.id = name;
        style.innerText = css;
        document.head.appendChild(style);
    }
    exports.injectCss = injectCss;
});
define("labs/widgets/auto-complete/fun/injectSvg", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function injectSvg(namespace, svg) {
        const container = document.createElement("div");
        container.innerHTML = svg.trim();
        document.body.appendChild(container.firstChild);
    }
    exports.injectSvg = injectSvg;
});
define("labs/widgets/auto-complete/AutoCompleteWidget", ["require", "exports", "labs/widgets/auto-complete/fun/keys", "labs/widgets/auto-complete/WidgetBase", "labs/widgets/auto-complete/AutoCompleteEngine", "labs/widgets/auto-complete/fun/renderResults", "labs/widgets/auto-complete/fun/injectCss", "labs/widgets/auto-complete/fun/injectSvg"], function (require, exports, keys_1, WidgetBase_1, AutoCompleteEngine_1, renderResults_1, injectCss_1, injectSvg_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const svg = `
<svg style="display:none" viewBox="-10 -10 20 20">
  <defs>
    <g id="icon-marker">
      <path transform="scale(1) translate(-6, -10)"
      d=" M 6.3 0
          C 6.3 0
            0 0.1
            0 7.5
          c 0 3.8
            6.3 12.6
            6.3 12.6
          s 6.3 -8.8
            6.3 -12.7
          C 12.6 0.1
            6.3 0
            6.3 0
          z"></path>
    </g>
    <g id="progress-spinner">
      <circle class="track" cx="0" cy="0" r="5" fill="none" stroke-width="2" />
      <circle class="ball" cx="0" cy="-5" r="1" fill="#000000" stroke="#ffffff" stroke-width="0.1" />
      <circle class="ball" cx="0" cy="5" r="1" fill="#ffffff" stroke="#000000" stroke-width="0.1" />
    </g>
    <g id="icon-search" viewBox="0 0 18 18" transform="scale(0.95) translate(0,2)">
      <path d="M17.707 16.293l-5.108-5.109A6.954 6.954 0 0014 7c0-3.86-3.141-7-7-7S0 3.14 0 7s3.141 7 7 7a6.958 6.958 0 004.185-1.402l5.108 5.109a.997.997 0 001.414 0 .999.999 0 000-1.414zM7 12c-2.757 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5z"
      fill-rule="nonzero" stroke="none"></path>
    </g>
    <g id="icon-close" viewBox="0 0 18 18">
      <path
        d="M10.414 9l5.293-5.293a.999.999 0 10-1.414-1.414L9 7.586 3.707 2.293a.999.999 0 10-1.414 1.414L7.586 9l-5.293 5.293a.999.999 0 101.414 1.414L9 10.414l5.293 5.293a.997.997 0 001.414 0 .999.999 0 000-1.414L10.414 9"
        fill-rule="evenodd" stroke="none"></path>
    </g>
  </defs>
</svg>
`;
    const css = `
.widget.autocomplete {
  max-width: 24em;
  display: grid;
  grid-template-columns: auto 2em 2em;
  grid-template-rows: 2em 0.5em auto;
  grid-template-areas:
    "input search cancel"
    "gap gap gap"
    "results results results";
}

.widget.autocomplete .input {
  grid-area: input;
}

.widget.autocomplete .search {
  grid-area: search;
}

.widget.autocomplete .cancel {
  grid-area: cancel;
}

.widget.autocomplete .results {
  grid-area: results;
  max-height: 20em;
  overflow: hidden;
}

.widget.autocomplete .results {
  display: grid;
  grid-template-columns: 2em auto;
  grid-template-areas:
    "marker data";
}

.widget.autocomplete .results .marker {
  fill: red;
  stroke: black;
}

.widget.autocomplete .results .data {
  max-height: 40vh;
}
`;
    class AutoCompleteWidget extends WidgetBase_1.WidgetBase {
        constructor(options) {
            super();
            this.options = options;
            injectCss_1.injectCss("ags-lab", css);
            injectSvg_1.injectSvg("ags-lab", svg);
            this.dom.classList.add("autocomplete");
            this.engine = new AutoCompleteEngine_1.AutoCompleteEngine();
            const { input, cancel, search, results } = (this.ux = {
                input: document.createElement("input"),
                cancel: document.createElement("button"),
                search: document.createElement("button"),
                results: document.createElement("div")
            });
            input.addEventListener("change", () => this.onInputChanged());
            setBackground(this.ux.search, "icon-search");
            setBackground(this.ux.cancel, "icon-close");
            keys_1.keys(this.ux).forEach(className => {
                const item = this.ux[className];
                item.title = options.titles[className] || className;
                item.classList.add(className);
                this.dom.appendChild(item);
            });
            this.engine.on("start", () => {
                this.publish("start-search");
            });
            this.engine.on("complete", () => {
                this.publish("complete-search");
            });
            this.engine.on("success", (results) => {
                this.publish("receive-search-result", results);
                // only render results if the input hash matches the results hash
                if (this.getSearchHash() !== results.searchHash)
                    return;
                renderResults_1.renderResults(this, results);
                this.publish("update-search-result", results);
            });
        }
        onResultSelected() {
            const result = document.activeElement;
            if (this.ux.results !== result.parentElement)
                return;
            this.publish("selectresult", JSON.parse(result.dataset.d));
        }
        getSearchHash() {
            return this.ux.input.value.trim().toUpperCase();
        }
        /**
         * widget extension
         */
        selectActiveElement() {
            this.onResultSelected();
        }
        applyChanges() {
            this.onInputChanged();
        }
        onInputChanged() {
            try {
                const searchText = this.getSearchHash();
                if (searchText === this.priorSearchText)
                    return;
                this.engine.search(searchText);
                this.priorSearchText = searchText;
            }
            catch (ex) {
                this.publish("error", ex.message);
            }
        }
        ext(extension) {
            extension.initialize(this);
        }
        use(provider) {
            this.engine.use(provider);
        }
        search(value) {
            this.ux.input.value = value;
            this.onInputChanged();
        }
    }
    exports.AutoCompleteWidget = AutoCompleteWidget;
    function asDom(html) {
        let div = document.createElement("div");
        div.innerHTML = html.trim();
        return div.firstChild;
    }
    function setBackground(button, id) {
        button.appendChild(asDom(`<svg viewBox="0 0 18 18"><use href="#${id}"></use></svg>`));
    }
});
define("labs/widgets/auto-complete/extensions/AnimationExtension", ["require", "exports", "labs/widgets/auto-complete/fun/injectCss"], function (require, exports, injectCss_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const DELETION_DELAY = 100 + Math.random() * 200;
    const enhancements = `
.widget.autocomplete .results div {
    cursor: pointer;
}
`;
    const animations = `
.widget.autocomplete .results div {
    transform: translate(0em, 0em);
    opacity: 1;
}

.widget.autocomplete .results div.loading {
    transform: translate(-10em, 0em);
    opacity: 0;
    transition: all ${DELETION_DELAY}ms linear;
}

.widget.autocomplete .results div.loading.loaded {
    transform: translate(0em, 0em);
    opacity: 1;
}

.widget.autocomplete .results div.loading.loaded.unloading {
    opacity: 0.5;
}

.widget.autocomplete .results div.loading.loaded.unloading.unloaded {
    opacity: 0;
    transform: translate(10em, 0em);
}

.widget.autocomplete .spin {
  animation: spin var(--spin-rate) 200ms infinite linear;
}

@keyframes spin {
  from {transform:rotate(0deg);}
  to {transform:rotate(360deg);}
}
`;
    injectCss_2.injectCss("ags-lab", enhancements);
    injectCss_2.injectCss("ags-lab", animations);
    class AnimationExtension {
        initialize(widget) {
            const markAs = (selector, mark) => {
                const nodes = Array.from(widget.ux.results.querySelectorAll(selector));
                nodes.forEach(n => n.classList.add(mark));
                return nodes;
            };
            const unload = (providerId) => {
                const nodes = Array.from(widget.ux.results.querySelectorAll(`.unloading.${providerId}`));
                nodes.forEach(n => n.classList.add("unloaded"));
                setTimeout(() => nodes.forEach(n => n.remove()), DELETION_DELAY);
            };
            const providers = {};
            widget.subscribe("start-search", () => {
                Object.keys(providers).forEach(id => markAs(`.${id}`, "unloading"));
                widget.ux.cancel.querySelector("svg").classList.add("spin");
            });
            widget.subscribe("complete-search", () => {
                widget.ux.cancel.querySelector("svg").classList.remove("spin");
            });
            widget.subscribe("receive-search-result", (results) => {
                providers[results.provider_id] = results;
                unload(results.provider_id);
            });
            widget.subscribe("update-search-result", (results) => {
                markAs(`.${results.provider_id}`, "loading");
                setTimeout(() => markAs(`.${results.provider_id}`, "loaded"), 20);
            });
        }
    }
    exports.AnimationExtension = AnimationExtension;
});
define("labs/widgets/auto-complete/extensions/KeyboardWidgetExtension", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function debounce(cb, wait = 20) {
        let h = 0;
        let callable = (...args) => {
            clearTimeout(h);
            h = setTimeout(() => cb(...args), wait);
        };
        return callable;
    }
    function focus(element, options) {
        if (!element)
            return false;
        if (!element.focus)
            return false;
        element.focus();
        if (document.activeElement === element)
            return true;
        if (!(options === null || options === void 0 ? void 0 : options.direction))
            return false;
        switch (options.direction) {
            case "down":
                return (focus(element.firstElementChild, options) ||
                    focus(element.nextElementSibling, options));
            default:
                return focus(element.previousElementSibling, options);
        }
    }
    class KeyboardWidgetExtension {
        initialize(widget) {
            const resultItemsKeyups = {
                Space: () => {
                    widget.selectActiveElement();
                },
                Enter: () => {
                    widget.selectActiveElement();
                },
                ArrowUp: () => {
                    const { activeElement } = document;
                    if (!focus(activeElement.previousElementSibling, {
                        direction: "up"
                    })) {
                        if (focus(widget.ux.input)) {
                            widget.ux.input.select();
                        }
                    }
                },
                ArrowDown: () => {
                    const { activeElement } = document;
                    focus(activeElement.nextElementSibling, { direction: "down" });
                }
            };
            widget.ux.results.addEventListener("keydown", event => {
                if (resultItemsKeyups[event.code]) {
                    resultItemsKeyups[event.code](event);
                    event.preventDefault();
                    return;
                }
            });
            widget.ux.results.addEventListener("click", event => {
                // if clicking a marker focus the input
                const path = event.composedPath();
                while (path.length) {
                    const target = path.shift();
                    if (!target)
                        return;
                    if (target.classList.contains("marker")) {
                        focus(target.nextElementSibling);
                        widget.selectActiveElement();
                        break;
                    }
                    if (target.classList.contains("data")) {
                        focus(target);
                        widget.selectActiveElement();
                        break;
                    }
                }
            });
            const inputKeyups = {
                Enter: () => widget.ux.search.click(),
                ArrowDown: () => focus(widget.ux.results.firstElementChild, {
                    direction: "down"
                })
            };
            let priorSearchValue = widget.ux.input.value.trim();
            const slowSearch = debounce(() => {
                const currentSearchValue = widget.ux.input.value.trim();
                if (currentSearchValue === priorSearchValue)
                    return;
                widget.applyChanges();
                priorSearchValue = currentSearchValue;
            }, widget.options.delay);
            widget.ux.input.addEventListener("keyup", event => {
                if (inputKeyups[event.code]) {
                    inputKeyups[event.code](event);
                    event.preventDefault();
                    return;
                }
                slowSearch();
            });
        }
    }
    exports.KeyboardWidgetExtension = KeyboardWidgetExtension;
});
define("labs/widgets/auto-complete/index", ["require", "exports", "labs/widgets/auto-complete/extensions/AnimationExtension", "labs/widgets/auto-complete/AutoCompleteWidget", "labs/widgets/auto-complete/extensions/KeyboardWidgetExtension"], function (require, exports, AnimationExtension_1, AutoCompleteWidget_1, KeyboardWidgetExtension_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createAutoCompleteWidget(options) {
        const { providers, delay } = options, others = __rest(options, ["providers", "delay"]);
        const widget = new AutoCompleteWidget_1.AutoCompleteWidget({
            delay,
            titles: {
                input: "Enter Search Text",
                cancel: "Dismiss Search",
                search: "Perform Search",
                results: "Select Search Text"
            }
        });
        options.providers.forEach(provider => widget.use(provider));
        widget.ext(new KeyboardWidgetExtension_1.KeyboardWidgetExtension());
        widget.ext(new AnimationExtension_1.AnimationExtension());
        return widget;
    }
    exports.createAutoCompleteWidget = createAutoCompleteWidget;
});
define("labs/widgets/auto-complete/providers/MockProvider", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function randomInt(range = 1000) {
        return Math.floor(range * Math.random());
    }
    class MockProvider {
        constructor(options) {
            this.options = options;
            this.name = options.id;
            options.database.forEach(item => (item.key += options.id));
        }
        search(searchValue) {
            if (typeof searchValue !== "string")
                searchValue = searchValue.address;
            console.log(`${this.options.id} searching for: ${searchValue}`);
            return new Promise((good, bad) => {
                setTimeout(() => {
                    if (0.01 > Math.random())
                        bad("Unlucky");
                    else {
                        const items = this.options.database.filter(v => 0 <= v.address.indexOf(searchValue));
                        console.log(`${this.options.id} found ${items.length} items`);
                        const { maxResultCount } = this.options;
                        if (items.length > maxResultCount) {
                            items.splice(maxResultCount, items.length - maxResultCount);
                        }
                        good({
                            provider_id: this.name,
                            searchHash: searchValue,
                            items: items.map(item => this.options.transform(item))
                        });
                    }
                }, this.options.delay / 2 + randomInt(this.options.delay / 2));
            });
        }
    }
    exports.MockProvider = MockProvider;
});
define("labs/widgets/auto-complete/providers/AgsLocatorProvider", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?f=json&text=greenville&maxSuggestions=6&location=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%2C%22x%22%3A-10797990.606947355%2C%22y%22%3A4579425.812870008%7D
    class AgsLocatorProvider {
        constructor() {
            this.name = "AgsLocatorProvider";
        }
        mapResponseData(data) {
            const items = data.suggestions.map(responseItem => (Object.assign(Object.assign({}, responseItem), { address: responseItem.text, key: responseItem.magicKey, location: null, address_type: ["address"] })));
            return {
                provider_id: this.name,
                searchHash: "",
                items
            };
        }
        mapFindAddressCandidatesResponseData(data) {
            const items = data.candidates.map(responseItem => (Object.assign(Object.assign({}, responseItem), { address: responseItem.address, key: responseItem.address, location: responseItem.location, address_type: ["address"] })));
            return {
                provider_id: this.name,
                searchHash: "",
                items
            };
        }
        search(searchValue) {
            return __awaiter(this, void 0, void 0, function* () {
                if (typeof searchValue !== "string")
                    return this.locate(searchValue);
                const fetchResponse = yield fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?f=json&text=${searchValue}`);
                const responseData = yield fetchResponse.json();
                const response = this.mapResponseData(responseData);
                response.searchHash = searchValue;
                return response;
            });
        }
        locate(item) {
            return __awaiter(this, void 0, void 0, function* () {
                const fetchResponse = yield fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=${item.address}&f=json&maxLocations=6`);
                const responseData = yield fetchResponse.json();
                const response = this.mapFindAddressCandidatesResponseData(responseData);
                response.searchHash = item.key;
                return response;
            });
        }
    }
    exports.AgsLocatorProvider = AgsLocatorProvider;
});
define("labs/ags-widget-viewer", ["require", "exports", "labs/widgets/auto-complete/index", "labs/widgets/auto-complete/providers/MockProvider", "labs/widgets/auto-complete/extensions/AnimationExtension", "labs/widgets/auto-complete/providers/AgsLocatorProvider"], function (require, exports, index_1, MockProvider_1, AnimationExtension_2, AgsLocatorProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function camelize(text) {
        const words = text.split(" ");
        return words
            .map(word => word.substring(0, 1).toUpperCase() +
            word.substring(1).toLowerCase())
            .join(" ");
    }
    injectCss("demo", `
.widget.autocomplete {
  background-color: white;
  color: black;
  padding: 0.5em;
}

.widget.autocomplete .input {
  padding-left: 0.5em;
}

.widget.autocomplete .results .marker .address {
  fill: rgb(255, 0, 0);
  stroke: rgb(20, 20, 200);
}

.widget.autocomplete .results .marker .business {
  fill: rgb(0, 0, 255);
  stroke: rgb(20, 20, 200);
}

.widget.autocomplete .results .marker .park {
  fill: rgb(20, 200, 20);
  stroke: rgb(20, 20, 200);
}

.widget.autocomplete .results .marker .political {
  fill: blue;
  stroke: rgb(20, 20, 200);
}
`);
    function injectCss(namespace, css) {
        if (document.head.querySelector(`style[id="${namespace}"]`))
            throw "css already exists";
        const style = document.createElement("style");
        style.id = name;
        style.innerText = css;
        document.head.appendChild(style);
    }
    function randomInt(range = 1000) {
        return Math.floor(range * Math.random());
    }
    function randomCompassDir() {
        const list = "N S W E NW NE SW SE".split(" ");
        return list[randomInt(list.length)];
    }
    function randomStreetName() {
        const list = "MAIN PLEASANT MOUNTAIN PINNACLE SUMMIT RAMPART".split(" ");
        return list[randomInt(list.length)];
    }
    function randomStreetSuffix() {
        const list = "ST AVE WAY COURT BLVD".split(" ");
        return list[randomInt(list.length)];
    }
    function randomAddress() {
        return `${1 +
            randomInt()} ${randomCompassDir()} ${randomStreetName()} ${randomStreetSuffix()}`;
    }
    function randomAddressType() {
        const types = [
            "address",
            "business",
            "park",
            "political"
        ];
        return types[randomInt(types.length)];
    }
    function createDatabase(size = 1000) {
        return Array(size)
            .fill(0)
            .map((_, k) => k)
            .map(key => ({
            key: `key${key}`,
            location: [randomInt(), randomInt()],
            address_type: [randomAddressType()],
            address: randomAddress()
        }));
    }
    function run() {
        try {
            const widget = index_1.createAutoCompleteWidget({
                providers: [
                    new MockProvider_1.MockProvider({
                        id: "Sluggard",
                        database: createDatabase(500),
                        delay: 4000,
                        maxResultCount: 6,
                        transform: ({ key, location, address, address_type }) => ({
                            key,
                            address_type,
                            location,
                            address: camelize(address)
                        })
                    }),
                    new MockProvider_1.MockProvider({
                        id: "MockFast",
                        database: createDatabase(500),
                        delay: 100,
                        maxResultCount: 6,
                        transform: ({ key, location, address, address_type }) => ({
                            key,
                            address_type,
                            location,
                            address: address.toLowerCase()
                        })
                    }),
                    new MockProvider_1.MockProvider({
                        id: "MockFastest",
                        database: createDatabase(50),
                        delay: 10,
                        maxResultCount: 1,
                        transform: ({ key, location, address, address_type }) => ({
                            key,
                            address_type,
                            location,
                            address: address.toLowerCase()
                        })
                    }),
                    new MockProvider_1.MockProvider({
                        id: "MockSlow",
                        maxResultCount: 6,
                        database: createDatabase(500),
                        delay: 2000,
                        transform: ({ key, location, address, address_type }) => ({
                            key,
                            address_type,
                            location,
                            address: address.toUpperCase()
                        })
                    }),
                    new AgsLocatorProvider_1.AgsLocatorProvider()
                ],
                delay: 200
            });
            widget.ext(new AnimationExtension_2.AnimationExtension());
            document.body.insertBefore(widget.dom, document.body.firstChild);
            widget.subscribe("error", result => {
                console.log("error: ", result);
            });
            widget.subscribe("focusresult", (item) => {
                console.log("item focused: ", item);
            });
            widget.subscribe("selectresult", (item) => {
                console.log("item selected: ", item);
                widget.dispose();
            });
            widget.search("N MAIN AVE");
        }
        catch (ex) {
            console.log(ex.message || ex);
        }
        finally {
            //
        }
    }
    exports.run = run;
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
            div.innerText = args.map(v => JSON.stringify(v)).join(" ");
            content.insertBefore(div, content.firstChild);
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
    function randomColor() {
        let [r, g, b] = [255, 255, 255]
            .map(v => Math.floor(64 + (v - 64) * Math.random()))
            .map(v => v.toString(16));
        return [r, g, b].join("");
    }
    const textarea = `
/**
 * This is a prototype autocomplete/typeahead control
 * I've looked at the following solutions:
 * > the jquery autocomplete control
 * > the twitter typeahead control
 * > the esri search input control
 * > the google maps search input (and google autocomplete)
 *
 * The typeahead examples are very clean, no icons, no buttons,
 * good keyboard support (arrows, escape, enter).
 *
 * The jquery examples have similar keyboard support (arrow, esc, enter)
 * And has a multi-select example.
 * We may want to multi-select results in the result area.
 *
 * Google autocomplete requires google API and is designed for google integration.
 * The google maps search area has nice features:
 * > panning the map has you tab through the results
 * > integrated slide-out menu
 * > remembers past searches
 * > updates search text as you tab through results
 * > preserves search input as first "autocomplete" item
 * It's brilliant and so fast you cannot get it to animate!
 * I disconnected from the network and it still found local results!
 * It then suggested I "change the way google maps works with your data."
 * Simply amazing.
 *
 * The ESRI examples is pretty much what we want:
 * > user can select a specific provider
 * > user can select "current location"
 * > "✖" clears result from search and from map
 * > Search results are local first and limited to 6 or so
 * > map does not move as you tab through results (configurable)
 * > "↑" and "↓" wrap through results (awkward when body can overflow, disableDefault!)
 * > takes up very little space (width is 240px)
 * > results are aggregated below the input (configurable)
 * > use selects a result and map displays it
 * > The "✖" only appears when there is input
 * > The matching part of the result is highlighted (unnecessary)
 * > When 🔍 the first result is shown and the infoviewer has "show more results" option
 * > Select a "more results" option and map moves to new location (prevents multiple markers on map)
 *
 * This control copies the keyboard shortcuts:
 * > arrow up/down - scrolls through input <-> results
 * > escape - dismisses results, if no results, dismisses input, if no input dismisses control
 * > enter - on input, performs "search", on result, selects result
 * > space - on result, clears other results, selects current result (pans to a marker placed on the map)
 * > Shift+click/shift+space - on result, selects current result
 * > click - on a result, selects result (copies content to search)
 * > typing - on input, invokes autocomplete, adds search text as top result (clicking only updates "input")
 *
 * It will look like the google search control (which looks like the ESRI search control):
 * > The "✖" will be *after* the "🔍" (maybe)
 * > The "✖" and will morph into a spinner when searching.
 * Clicking "✖" will clear all results and the search input and stop any searches
 *
 * If an error occurs a result with a "!" icon will report the provider-specific error message
 * The "🔍" will perform the actual search operation using the current input
 * Pressing "Enter" in the input will perform this same search.
 * The "✖" will spin when performing a search.
 * The "Search" results will display on the map.
 *
 * The "↑" and "↓" arrows will scroll vertically from the input through the results
 * Pressing "Enter" on any result will select that address and clear the search area.
 *
 *
 *
 * Like the esri control, this will aggregate results from
 * multiple services and render markers based on the response
 * data.  It will group the results by the provider
 *
 * Like the google control, it will render small markers to give
 * meaning to the data (business, home address, parcel, etc.)
 *
 * The google locator is so fast it doesn't need any animations
 * but some of the providers this control will consume aren't
 * so lucky so the user needs feedback.  I tried to make it
 * less jaring, but there's more to do.
 *
 * Morphing to prevent bouncing?
 * The progress indicators for the various providers cause bouncing
 * when the come in/out of view and I'm not sure they're necessary.
 * Maybe the "✖" can show a progress spinner around it instead?
 * Or maybe the search icon can morph into a spinner?
 * Probably the first results should morph into the provider placeholder
 * instead of one fading in and the other out.
 *
 * ℂ∅ℼⅇℽ
 */
`;
    const MIN_SEARCH_LENGTH = 1;
    function focus(element, options) {
        if (!element)
            return false;
        if (!element.focus)
            return false;
        element.focus();
        if (document.activeElement === element)
            return true;
        if (!(options === null || options === void 0 ? void 0 : options.direction))
            return false;
        switch (options.direction) {
            case "down":
                return (focus(element.firstElementChild, options) ||
                    focus(element.nextElementSibling, options));
            default:
                return focus(element.previousElementSibling, options);
        }
    }
    function fadeOut(element, interval = 200) {
        return __awaiter(this, void 0, void 0, function* () {
            element.style.setProperty("animation", `unreveal ${interval}ms forwards linear`);
            yield sleep(interval);
            element.remove();
        });
    }
    function click(element) {
        if (element === null || element === void 0 ? void 0 : element.click)
            element.click();
    }
    function sleep(interval = 1000) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((good, bad) => {
                setTimeout(good, interval);
            });
        });
    }
    /**
     * As user types a message invoke multiple "suggest" requests...as response comes
     * in add it to a auto-complete list
     * If user makes a selection invoke a findAddressCandidates request using magic-key
     * If user presses enter, invoke a findAddressCandidates request using input value
     */
    let styles = document.createElement("style");
    styles.innerText = `
    :root {
      --font-size: max(1em, 2vh);
      --text-color: white;
      --background-color: black;
      --border-color: rgba(200,200,200,1);
      --reveal-time: 0ms;
      --spin-rate: 5000ms;
      --ghostly: 0.6;
      --address-layer-color: #${randomColor()};
      --parcel-layer-color: #${randomColor()};
      --geolocator-color: #${randomColor()};
    }

    body {
      overflow: hidden;
    }

    .mock-auto-complete .spinner {display: none;}
    .mock-auto-complete div.provider {display:none;}

    .mock-auto-complete {
      font-size: var(--font-size);
      display: inline-block;
      border: 1px solid;
      border-color: var(--border-color);
      padding: 0.25em;
      min-width: min(32em,100vw);
      max-width: min(48em,50vw);
      background: var(--background-color);
      color: var(--text-color);
    }

    .mock-auto-complete .search-area {
      display: grid;
      grid-template-columns: auto 2em 2em;
      grid-template-areas:
        "search run cancel"
        "results results results";
    }

    .mock-auto-complete .search-area input,
    .mock-auto-complete .search-area button {
      font-size: var(--font-size);
      padding: 0;
      margin: 0;
      padding-left: 6px;
      margin-left: 1px;
      background: var(--text-color);
      border: solid;
      fill: var(--background-color);
      stroke: var(--background-color);
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
      grid-template-columns: 2em auto;
      grid-template-areas:
        "marker data";
      max-height: 40vh;
      overflow: hidden;
    }

    .mock-auto-complete .result-list .result-item {
      cursor: pointer;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: wrap;
      animation: reveal var(--reveal-time) forwards linear;
    }

    .mock-auto-complete .result-list *.out-of-date {
      opacity: var(--ghostly);
    }

    .mock-auto-complete .result-list .provider {
      transform: translate(0, 6px);
    }

    .mock-auto-complete .spin {
      animation: spin var(--spin-rate) 200ms infinite linear;
    }

    .mock-auto-complete .result-list .marker {
      stroke: var(--text-color);
      stroke-width: 2;
      stroke-opacity: var(--ghostly);
      transform: translate(50%, 25%) scale(1);
    }

    .mock-auto-complete .result-list .marker.hilite {
      transition: all 100ms ease-in;
      stroke-opacity: 1;
    }

    .mock-auto-complete .result-list .Addresses.spinner use {
      stroke: var(--geolocator-color);
    }

    .mock-auto-complete .result-list .marker.Addresses {
        fill: var(--geolocator-color);
    }

    .mock-auto-complete .result-list .ParcelLayer.spinner use {
      stroke: var(--parcel-layer-color);
    }

    .mock-auto-complete .result-list .marker.ParcelLayer {
      fill: var(--parcel-layer-color);
    }

    .mock-auto-complete .result-list .AddressLayer.spinner use {
      stroke: var(--address-layer-color);
    }

    .mock-auto-complete .result-list .marker.AddressLayer {
      fill: var(--address-layer-color);
    }

    .mock-auto-complete .result-list .fade-out {
      animation: unreveal var(--reveal-time) forwards linear;
    }

    @keyframes as-indicator {
      to {
        transform: translate(-4px, 8px) scale(0);
      }
    }

    @keyframes spin {
      from {transform:rotate(0deg);}
      to {transform:rotate(360deg);}
    }

    .workarea .playground {
      display: none;
      fill: white;
      stroke: white;
    }

    .workarea .playground button:focus use,
    .workarea .playground button:hover use {
      fill: green;
      stroke-width: 2;
      stroke: white;
    }

    .workarea .playground use[href="#icon-marker"] {
      fill: blue;
    }

    .workarea .playground use[href="#icon-search"] {
      fill: blue;
    }

    .workarea .playground use[href="#icon-close"] {
      fill: blue;
    }

`;
    document.head.appendChild(styles);
    function asDom(html) {
        let div = document.createElement("div");
        div.innerHTML = html.trim();
        return div.firstChild;
    }
    function asId(value) {
        return value.replace(/ /gi, "");
    }
    function run() {
        return __awaiter(this, void 0, void 0, function* () {
            const autoCompleteInput = `
<div class="workarea">
  <div class="mock-auto-complete">
    <svg style="display:none" viewBox="-10 -10 20 20">
      <defs>
        <g id="icon-marker">
          <path transform="scale(1) translate(-6, -10)"
          d=" M 6.3 0
              C 6.3 0
                0 0.1
                0 7.5
              c 0 3.8
                6.3 12.6
                6.3 12.6
              s 6.3 -8.8
                6.3 -12.7
              C 12.6 0.1
                6.3 0
                6.3 0
              z"></path>
        </g>
        <g id="progress-spinner">
          <circle class="track" cx="0" cy="0" r="5" fill="none" stroke-width="2" />
          <circle class="ball" cx="0" cy="-5" r="1" fill="#000000" stroke="#ffffff" stroke-width="0.1" />
          <circle class="ball" cx="0" cy="5" r="1" fill="#ffffff" stroke="#000000" stroke-width="0.1" />
        </g>
        <g id="icon-search" viewBox="0 0 18 18" transform="scale(0.95) translate(0,2)">
          <path d="M17.707 16.293l-5.108-5.109A6.954 6.954 0 0014 7c0-3.86-3.141-7-7-7S0 3.14 0 7s3.141 7 7 7a6.958 6.958 0 004.185-1.402l5.108 5.109a.997.997 0 001.414 0 .999.999 0 000-1.414zM7 12c-2.757 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5z"
          fill-rule="nonzero" stroke="none"></path>
        </g>
        <g id="icon-close" viewBox="0 0 18 18">
          <path
            d="M10.414 9l5.293-5.293a.999.999 0 10-1.414-1.414L9 7.586 3.707 2.293a.999.999 0 10-1.414 1.414L7.586 9l-5.293 5.293a.999.999 0 101.414 1.414L9 10.414l5.293 5.293a.997.997 0 001.414 0 .999.999 0 000-1.414L10.414 9"
            fill-rule="evenodd" stroke="none"></path>
        </g>
      </defs>
    </svg>
    <p class="mission-impossible">This is a mocked service so try typing "29605" or "55100"</p>
    <div class="search-area">
      <input class="search" placeholder="find address"></input>
      <button class="run" type="button">
        <svg viewBox="0 0 18 18"><use href="#icon-search"></use></svg>
      </button>
      <button class="cancel" type="button">
        <svg viewBox="0 0 18 18"><use href="#icon-close"></use></svg>
      </button>
      <div class="result-area">
        <div class="result-list">
        </div>
      </div>
    </div>
  </div>
  <div class="playground">
    <svg style="position:absolute;top:0;right:0;width:82px;height:18px;transform:scale(2) translate(-42px,9px)" viewBox="0 0 82 22">
      <use transform="translate(8,11)" href="#icon-marker"></use>
      <use transform="translate(32,0)" href="#icon-search"></use>
      <use transform="translate(64,0)" href="#icon-close"></use>
    </svg>
    <button style="background:transparent;border:solid;padding:0;">
      <svg width="2em" height="2em" viewBox="0 0 16 22">
        <use style="transform:translate(8px,11px)" href="#icon-marker"></use>
      </svg>
    </button>
  </div>
  <div>
    <label>Notes</label>
    <p style="height:40vh;overflow:auto">${textarea
                .trim()
                .replace(/\n/g, "<br/>")
                .replace(/(\* \> )/g, "&nbsp;&nbsp;&nbsp;&nbsp;")}</p>
  </div>
</div>
`;
            let widget = asDom(autoCompleteInput);
            let input = widget.querySelector(".search");
            let cancel = widget.querySelector(".cancel");
            let run = widget.querySelector(".run");
            let resultItems = widget.querySelector(".result-list");
            const createMarker = (className) => {
                return `<div style="padding:0"><svg class="marker ${className}" style="width:1em;height:1em" viewBox="-10 -12 20 24"><use href="#icon-marker"></use></svg></div>`;
            };
            const createSpinner = (className) => `<svg class="spinner ${className}" viewBox="-10 -10 20 20"><use href="#progress-spinner"></use></svg>`;
            const missionImpossible = () => __awaiter(this, void 0, void 0, function* () {
                let nodes = Array.from(document.querySelectorAll(".mission-impossible"));
                if (!nodes.length)
                    return;
                nodes.forEach(n => n.classList.remove("mission-impossible"));
                yield sleep(5000);
                nodes.forEach(n => fadeOut(n, 2000));
            });
            let mockData = {};
            function search(providerId, singleLineInput) {
                return __awaiter(this, void 0, void 0, function* () {
                    console.log(`searching for "${singleLineInput}"`);
                    let response = mockData[providerId];
                    if (!response) {
                        response = mockSuggestResponse.suggestions.map((v, i) => ({
                            text: v.text,
                            magicKey: `${providerId}+${i}`
                        }));
                        mockData[providerId] = response;
                    }
                    let finalResult = response.filter(v => v.text
                        .split(/[ ,\.]/)
                        .some(v => !!v &&
                        0 <=
                            singleLineInput.toLocaleLowerCase().indexOf(v.toLocaleLowerCase())));
                    yield sleep(100 + Math.random() * Math.random() * 5000);
                    //if (0.05 > Math.random()) throw "Error";
                    return finalResult;
                });
            }
            function merge(providerId, suggestion, before) {
                let result;
                if (!!before) {
                    result = document.querySelector(`.result-item[data-key='${suggestion.magicKey}']`);
                }
                if (!result) {
                    result = document.createElement("div");
                    if (!!before) {
                        before.insertAdjacentElement("afterend", result);
                    }
                    else {
                        resultItems.appendChild(result);
                    }
                    let marker = asDom(createMarker(providerId));
                    marker.title = providerId;
                    resultItems.insertBefore(marker, result);
                    result.addEventListener("click", () => {
                        select(suggestion);
                        clearAll();
                    });
                    result.addEventListener("focus", () => {
                        marker.querySelector("svg").classList.add("hilite");
                    });
                    result.addEventListener("blur", () => {
                        marker.querySelector("svg").classList.remove("hilite");
                    });
                }
                let marker = result.previousElementSibling.querySelector(".marker");
                marker.classList.remove("out-of-date");
                result.dataset["key"] = suggestion.magicKey;
                result.tabIndex = 0;
                result.className = `result-item ${providerId}`;
                result.title = suggestion.text;
                result.innerText = suggestion.text;
                return result;
            }
            function select(suggestion) {
                console.log("selected result", { suggestion });
            }
            function clearAll() {
                input.value = "";
                resultItems.innerText = "";
                input.focus();
            }
            let priorSearchValue = "";
            const searchAllProviders = () => {
                let searchValue = input.value;
                if (priorSearchValue === searchValue)
                    return;
                priorSearchValue = searchValue;
                if (input.value.length < MIN_SEARCH_LENGTH) {
                    return; // will not perform search
                }
                return Promise.all(["Addresses", "Parcel Layer", "Address Layer"].map((providerName) => __awaiter(this, void 0, void 0, function* () {
                    let providerId = asId(providerName);
                    let progressIndicator = widget.querySelector(`.spinner.${providerId}`);
                    if (!progressIndicator) {
                        progressIndicator = asDom(createSpinner(providerId));
                        resultItems.appendChild(progressIndicator);
                        let progressLabel = asDom(`<div class="provider ${providerId}">${providerName}</div>`);
                        resultItems.appendChild(progressLabel);
                    }
                    else {
                        // result-item and marker get flagged as out-of-date
                        ["result-item", "marker"].forEach(selector => {
                            Array.from(widget.querySelectorAll(`.${selector}.${providerId}`)).forEach(item => item.classList.add("out-of-date"));
                        });
                    }
                    let progressLabel = progressIndicator.nextElementSibling;
                    progressLabel.classList.remove("fade-out");
                    progressIndicator.classList.remove("fade-out");
                    progressIndicator.classList.add("spin");
                    let results = search(providerId, input.value);
                    results.then(suggestions => {
                        if (!suggestions.length) {
                            progressLabel.remove();
                            progressIndicator.remove();
                        }
                        suggestions.forEach(suggestion => {
                            merge(providerId, suggestion, progressLabel);
                        });
                        progressIndicator.classList.remove("spin");
                        progressIndicator.classList.add("fade-out");
                        progressLabel.classList.add("fade-out");
                        // result-item and marker get flagged as out-of-date
                        ["result-item", "marker"].forEach(selector => {
                            Array.from(widget.querySelectorAll(`.${selector}.${providerId}.out-of-date`)).forEach(item => {
                                fadeOut(item);
                            });
                        });
                    });
                    return results;
                })));
            };
            const slowSearch = debounce(() => __awaiter(this, void 0, void 0, function* () {
                let thing = cancel.querySelector("svg");
                try {
                    thing.classList.add("spin");
                    thing
                        .querySelector("use")
                        .style.setProperty("transform", "translate(2.82px, 2.82px) scale(0.707)");
                    thing.style.setProperty("fill", "red");
                    yield searchAllProviders();
                }
                finally {
                    thing.querySelector("use").style.setProperty("transform", "");
                    thing.classList.remove("spin");
                    thing.style.setProperty("fill", "");
                }
            }), 500);
            const inputKeyups = {
                ArrowDown: () => focus(resultItems.firstElementChild, { direction: "down" }),
                Enter: () => run.click()
            };
            const resultItemsKeyups = {
                Space: () => {
                    let { activeElement } = document;
                    click(activeElement);
                },
                Enter: () => {
                    let { activeElement } = document;
                    click(activeElement);
                },
                ArrowUp: () => {
                    let { activeElement } = document;
                    if (!focus(activeElement.previousElementSibling, { direction: "up" })) {
                        if (focus(input)) {
                            input.select();
                        }
                    }
                },
                ArrowDown: () => {
                    let { activeElement } = document;
                    focus(activeElement.nextElementSibling, { direction: "down" });
                }
            };
            resultItems.addEventListener("keyup", event => {
                if (resultItemsKeyups[event.code]) {
                    resultItemsKeyups[event.code](event);
                    event.preventDefault();
                    return;
                }
            });
            run.addEventListener("click", () => {
                console.log("execute query");
            });
            input.addEventListener("keyup", event => {
                if (inputKeyups[event.code]) {
                    inputKeyups[event.code](event);
                    event.preventDefault();
                    return;
                }
                slowSearch();
            });
            cancel.addEventListener("click", () => {
                setTimeout(clearAll);
            });
            document.body.insertBefore(widget, document.body.firstChild);
            input.value = "datastream";
            yield slowSearch();
            missionImpossible();
            const globalKeyups = {
                Escape: () => {
                    clearAll();
                }
            };
            widget.addEventListener("keyup", event => {
                if (globalKeyups[event.code]) {
                    globalKeyups[event.code](event);
                    event.preventDefault();
                    return;
                }
                else {
                    console.log(event.code);
                }
            });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGFicy9hamF4LnRzIiwiLi4vbGFicy9hZ3MtZmVhdHVyZS1wcm94eS50cyIsIi4uL2xhYnMvYWdzLWNhdGFsb2ctcHJveHkudHMiLCIuLi9hcHAudHMiLCIuLi9pcHMvc2VydmljZXMudHMiLCIuLi9sYWJzL2Fncy1mZWF0dXJlLXF1ZXJ5LXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtZmluZC1hZGRyZXNzLXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtZmluZC1wcm94eS50cyIsIi4uL2xhYnMvYWdzLWdlb21ldHJ5LXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtbHJzLXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtbWFwLWV4cG9ydC1wcm94eS50cyIsIi4uL2xhYnMvYWdzLW1hcC1maW5kLXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtbWFwLWlkZW50aWZ5LXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtbWFwLXF1ZXJ5LXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtcmV2ZXJzZS1nZW9jb2RlLXByb3h5LnRzIiwiLi4vbGFicy9kYXRhL3JvdXRlMDEudHMiLCIuLi9sYWJzL2Fncy1yb3V0ZS1lZGl0b3IudHMiLCIuLi9sYWJzL2Fncy1zb2x2ZS1wcm94eS50cyIsIi4uL2xhYnMvYWdzLXJvdXRlLXNvbHZlLXByb3h5LnRzIiwiLi4vbGFicy9hZ3Mtc2VydmljZWFyZWEtc29sdmUtcHJveHkudHMiLCIuLi9sYWJzL2Fncy1zdWdnZXN0LXByb3h5LnRzIiwiLi4vbGFicy9hZ3Mtd2VibWFwLnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvdHlwaW5ncy9HZW9tZXRyeS50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL3R5cGluZ3MvU2VhcmNoUmVzdWx0SXRlbS50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL3R5cGluZ3MvU2VhcmNoUmVzdWx0LnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvdHlwaW5ncy9BdXRvQ29tcGxldGVQcm92aWRlckNvbnRyYWN0LnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvdHlwaW5ncy9SZW1vdmVFdmVudEhhbmRsZXIudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS90eXBpbmdzL1dpZGdldENvbnRyYWN0LnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvdHlwaW5ncy9XaWRnZXRFeHRlbnNpb25Db250cmFjdC50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL3R5cGluZ3MvQXV0b0NvbXBsZXRlV2lkZ2V0Q29udHJhY3QudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9mdW4va2V5cy50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL3R5cGluZ3MvRGljdGlvbmFyeS50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL0NoYW5uZWwudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9XaWRnZXRCYXNlLnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvdHlwaW5ncy9BdXRvQ29tcGxldGVFbmdpbmVDb250cmFjdC50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL0F1dG9Db21wbGV0ZUVuZ2luZS50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL2Z1bi9yZW5kZXJSZXN1bHRzLnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvZnVuL2luamVjdENzcy50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL2Z1bi9pbmplY3RTdmcudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9BdXRvQ29tcGxldGVXaWRnZXQudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9leHRlbnNpb25zL0FuaW1hdGlvbkV4dGVuc2lvbi50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL2V4dGVuc2lvbnMvS2V5Ym9hcmRXaWRnZXRFeHRlbnNpb24udHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9pbmRleC50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL3Byb3ZpZGVycy9Nb2NrUHJvdmlkZXIudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9wcm92aWRlcnMvQWdzTG9jYXRvclByb3ZpZGVyLnRzIiwiLi4vbGFicy9hZ3Mtd2lkZ2V0LXZpZXdlci50cyIsIi4uL2xhYnMvY29uc29sZS50cyIsIi4uL2xhYnMvaW5kZXgudHMiLCIuLi9sYWJzL3B1YnN1Yi50cyIsIi4uL2xhYnMvbWFwbGV0LnRzIiwiLi4vbGFicy9kYXRhL2ZpbmRBZGRyZXNzQ2FuZGlkYXRlc19yZXNwb25zZS50cyIsIi4uL2xhYnMvZGF0YS9zdWdnZXN0X3Jlc3BvbnNlLnRzIiwiLi4vbGFicy9xYXFjL21hcHBpbmdzLnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUudHMiLCIuLi91eC9nZW9kZXNpYy1wbGFuYXItdXgudHMiLCIuLi91eC9yb3V0aW5nLXByb3RvdHlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztHQUVHOztJQUVILFlBQVksQ0FBQztJQUViLE1BQU0sSUFBSTtRQVFOLFlBQW1CLEdBQVc7WUFBWCxRQUFHLEdBQUgsR0FBRyxDQUFRO1lBTnZCLFlBQU8sR0FBRztnQkFDYixRQUFRLEVBQUUsSUFBSTtnQkFDZCxTQUFTLEVBQUUsS0FBSztnQkFDaEIsUUFBUSxFQUFFLElBQUk7YUFDakIsQ0FBQTtRQUdELENBQUM7UUFFTyxLQUFLLENBQUksSUFBVSxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRztZQUN2QyxPQUFPLElBQUksT0FBTyxDQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUV0QyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsUUFBUSxDQUFDO2dCQUM1QixJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzlFLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBTyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMvQyxDQUFDLENBQUMsQ0FBQztRQUVQLENBQUM7UUFFRCxtREFBbUQ7UUFDM0MsSUFBSSxDQUFJLE1BQWMsRUFBRSxJQUFVLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHO1lBRXRELElBQUksTUFBTSxHQUFHLE1BQU0sS0FBSyxNQUFNLElBQUksTUFBTSxLQUFLLEtBQUssQ0FBQztZQUNuRCxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQztZQUNuQyxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQztZQUVuQyxJQUFJLE9BQU8sR0FBRyxJQUFJLE9BQU8sQ0FBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFFN0MsSUFBSSxNQUFNLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxNQUFNO29CQUFFLE1BQU0sQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO2dCQUUxQyxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUM7Z0JBQ2QsSUFBSSxJQUFJLEdBQVEsSUFBSSxDQUFDO2dCQUVyQixJQUFJLElBQUksRUFBRTtvQkFDTixJQUFJLE1BQU0sRUFBRTt3QkFDUixJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztxQkFDL0I7eUJBQU07d0JBQ0gsR0FBRyxJQUFJLEdBQUcsQ0FBQzt3QkFDWCxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUM7d0JBQ2pCLEtBQUssSUFBSSxHQUFHLElBQUksSUFBSSxFQUFFOzRCQUNsQixJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0NBQzFCLElBQUksUUFBUSxFQUFFLEVBQUU7b0NBQ1osR0FBRyxJQUFJLEdBQUcsQ0FBQztpQ0FDZDtnQ0FDRCxHQUFHLElBQUksa0JBQWtCLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDOzZCQUN4RTt5QkFDSjtxQkFDSjtpQkFDSjtnQkFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQy9CLElBQUksTUFBTSxJQUFJLE1BQU07b0JBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDO2dCQUNoRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVsQixNQUFNLENBQUMsTUFBTSxHQUFHLEdBQUcsRUFBRTtvQkFDakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7b0JBQ3RFLElBQUksTUFBTSxDQUFDLE1BQU0sSUFBSSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxHQUFHLEVBQUU7d0JBQzdDLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQzt3QkFDOUYsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztxQkFDbkU7eUJBQU07d0JBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztxQkFDN0I7Z0JBQ0wsQ0FBQyxDQUFDO2dCQUVGLE1BQU0sQ0FBQyxPQUFPLEdBQUc7b0JBQ2IsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDNUIsQ0FBQyxDQUFDO1lBQ04sQ0FBQyxDQUFDLENBQUM7WUFFSCxxQkFBcUI7WUFDckIsT0FBTyxPQUFPLENBQUM7UUFDbkIsQ0FBQztRQUVELElBQUksQ0FBSSxNQUFTO1lBQ2IsT0FBTyxJQUFJLE9BQU8sQ0FBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDdEMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BCLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUVELEdBQUcsQ0FBSSxJQUFVO1lBQ2IsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVM7Z0JBQUUsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFJLElBQUksQ0FBQyxDQUFDO1lBQ3ZELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBSSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELElBQUksQ0FBSSxJQUFVO1lBQ2QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFJLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBRUQsR0FBRyxDQUFJLElBQVU7WUFDYixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUksS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxNQUFNLENBQUMsSUFBVTtZQUNiLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDckMsQ0FBQztLQUNKO0lBRUQsT0FBUyxJQUFJLENBQUM7O0FDMUdkOztHQUVHOzs7O0lBbU9ILE1BQXFCLGFBQWE7UUFHOUIsWUFBWSxHQUFXO1lBQ25CLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVELEtBQUssQ0FBQyxJQUFVO1lBRVosSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDakIsQ0FBQyxFQUFFLE9BQU87YUFDYixFQUFFLElBQUksQ0FBQyxDQUFDO1lBRVQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBb0IsR0FBRyxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVELFVBQVUsQ0FBQyxLQUFhO1lBRXBCLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNqRCxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUNqQixDQUFDLEVBQUUsT0FBTzthQUNiLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFUCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQW1CLEdBQUcsQ0FBQyxDQUFDO1FBQzNDLENBQUM7S0FFSjtJQTFCRCxnQ0EwQkM7SUFFRCxTQUFnQixHQUFHO1FBQ2YsSUFBSSxPQUFPLEdBQUcsSUFBSSxhQUFhLENBQUMsOEVBQThFLENBQUMsQ0FBQztRQUNoSCxPQUFPO2FBQ0YsS0FBSyxFQUFFO2FBQ1AsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDcEQsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQy9CLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2pDLENBQUMsQ0FBQyxDQUFBO1FBQ04sQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBWEQsa0JBV0M7O0FDNVFEOztHQUVHOzs7O0lBaUJILE1BQXFCLE9BQU87UUFHeEIsWUFBWSxHQUFXO1lBQ25CLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVELEtBQUssQ0FBQyxJQUFVO1lBRVosSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDakIsQ0FBQyxFQUFFLE9BQU87YUFDYixFQUFFLElBQUksQ0FBQyxDQUFDO1lBRVQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBYyxHQUFHLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBRUQsV0FBVyxDQUFDLE1BQWM7WUFFdEIsSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQ2xELElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBQ2pCLENBQUMsRUFBRSxPQUFPO2FBQ2IsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVQLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBYyxHQUFHLENBQUMsQ0FBQztRQUN0QyxDQUFDO0tBRUo7SUExQkQsMEJBMEJDO0lBRUQsU0FBZ0IsR0FBRztRQUNmLElBQUksR0FBRyxHQUFHLHVEQUF1RCxDQUFBO1FBQ2pFLElBQUksT0FBTyxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLE9BQU87YUFDRixLQUFLLEVBQUU7YUFDUCxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDVixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1QixLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssZUFBZSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUMvRCxJQUFJLGNBQWMsR0FBRyxJQUFJLDJCQUFhLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksZ0JBQWdCLENBQUMsQ0FBQztnQkFDekUsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEUsQ0FBQyxDQUFDLENBQUM7WUFDSCxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDdEIsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7b0JBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDcEMsQ0FBQyxDQUFDLENBQUE7WUFDTixDQUFDLENBQUMsQ0FBQTtRQUNOLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQWpCRCxrQkFpQkM7Ozs7SUMvREQsT0FBUyxFQUFFLENBQUM7Ozs7O0lDT1osTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDO0lBRWxCLE1BQU0sSUFBSTs7SUFDQyx1QkFBa0IsR0FBMEI7UUFDbkQsTUFBTSxFQUFFLENBQUM7Z0JBQ0wsWUFBWSxFQUFFLE9BQU87Z0JBQ3JCLGtCQUFrQixFQUFFLFFBQVE7Z0JBQzVCLFdBQVcsRUFBRSxxQkFBcUI7Z0JBQ2xDLGVBQWUsRUFBRTtvQkFDYixHQUFHLEVBQUUsQ0FBQztvQkFDTixHQUFHLEVBQUUsQ0FBQztpQkFDVDtnQkFDRCxhQUFhLEVBQUU7b0JBQ1gsR0FBRyxFQUFFLENBQUM7b0JBQ04sR0FBRyxFQUFFLENBQUM7aUJBQ1Q7Z0JBQ0QsWUFBWSxFQUFFLENBQUM7d0JBQ1gsY0FBYyxFQUFFLENBQUM7d0JBQ2pCLFVBQVUsRUFBRTs0QkFDUixTQUFTLEVBQUUsZ0NBQWdDOzRCQUMzQyxZQUFZLEVBQUUsSUFBSTt5QkFDckI7d0JBQ0QsVUFBVSxFQUFFOzRCQUNSLEdBQUcsRUFBRSxDQUFDOzRCQUNOLEdBQUcsRUFBRSxDQUFDO3lCQUNUO3dCQUNELG9CQUFvQixFQUFFLE1BQU07d0JBQzVCLGVBQWUsRUFBRSxxQkFBcUI7d0JBQ3RDLGNBQWMsRUFBRSxRQUFRO3dCQUN4QixxQkFBcUIsRUFBRSxLQUFLO3dCQUM1QixnQkFBZ0IsRUFBRSxTQUFTO3dCQUMzQixzQkFBc0IsRUFBRSx5QkFBeUI7d0JBQ2pELElBQUksRUFBRSxJQUFJO3dCQUNWLE1BQU0sRUFBRSxrTkFBa047cUJBQzdOO29CQUNEO3dCQUNJLGNBQWMsRUFBRSxDQUFDO3dCQUNqQixVQUFVLEVBQUU7NEJBQ1IsU0FBUyxFQUFFLGdDQUFnQzs0QkFDM0MsWUFBWSxFQUFFLElBQUk7eUJBQ3JCO3dCQUNELFVBQVUsRUFBRTs0QkFDUixHQUFHLEVBQUUsQ0FBQzs0QkFDTixHQUFHLEVBQUUsQ0FBQzt5QkFDVDt3QkFDRCxvQkFBb0IsRUFBRSxNQUFNO3dCQUM1QixlQUFlLEVBQUUscUJBQXFCO3dCQUN0QyxjQUFjLEVBQUUsUUFBUTt3QkFDeEIscUJBQXFCLEVBQUUsS0FBSzt3QkFDNUIsZ0JBQWdCLEVBQUUsU0FBUzt3QkFDM0Isc0JBQXNCLEVBQUUseUJBQXlCO3dCQUNqRCxJQUFJLEVBQUUsSUFBSTt3QkFDVixNQUFNLEVBQUUsa05BQWtOO3FCQUM3TjtvQkFDRDt3QkFDSSxjQUFjLEVBQUUsQ0FBQzt3QkFDakIsVUFBVSxFQUFFOzRCQUNSLFNBQVMsRUFBRSxnQ0FBZ0M7NEJBQzNDLFlBQVksRUFBRSxJQUFJO3lCQUNyQjt3QkFDRCxVQUFVLEVBQUU7NEJBQ1IsR0FBRyxFQUFFLG1CQUFtQjs0QkFDeEIsR0FBRyxFQUFFLGdCQUFnQjt5QkFDeEI7d0JBQ0Qsb0JBQW9CLEVBQUUsWUFBWTt3QkFDbEMsZUFBZSxFQUFFLHFCQUFxQjt3QkFDdEMsY0FBYyxFQUFFLFFBQVE7d0JBQ3hCLHFCQUFxQixFQUFFLElBQUk7d0JBQzNCLGdCQUFnQixFQUFFLFNBQVM7d0JBQzNCLHNCQUFzQixFQUFFLHlCQUF5Qjt3QkFDakQsSUFBSSxFQUFFLElBQUk7d0JBQ1YsTUFBTSxFQUFFLGtOQUFrTjtxQkFDN04sQ0FBQztnQkFDRixnQkFBZ0IsRUFBRSxFQUFFO2dCQUNwQixzQkFBc0IsRUFBRSxxQkFBcUI7Z0JBQzdDLElBQUksRUFBRSxJQUFJO2dCQUNWLE1BQU0sRUFBRSx3VEFBd1Q7YUFDblU7WUFDRDtnQkFDSSxZQUFZLEVBQUUsTUFBTTtnQkFDcEIsa0JBQWtCLEVBQUUsYUFBYTtnQkFDakMsV0FBVyxFQUFFLHFCQUFxQjtnQkFDbEMsZUFBZSxFQUFFO29CQUNiLEdBQUcsRUFBRSxDQUFDO29CQUNOLEdBQUcsRUFBRSxDQUFDO2lCQUNUO2dCQUNELGFBQWEsRUFBRTtvQkFDWCxHQUFHLEVBQUUsQ0FBQztvQkFDTixHQUFHLEVBQUUsQ0FBQztpQkFDVDtnQkFDRCxZQUFZLEVBQUUsQ0FBQzt3QkFDWCxjQUFjLEVBQUUsQ0FBQzt3QkFDakIsVUFBVSxFQUFFOzRCQUNSLFNBQVMsRUFBRSxnQ0FBZ0M7NEJBQzNDLFlBQVksRUFBRSxJQUFJO3lCQUNyQjt3QkFDRCxVQUFVLEVBQUU7NEJBQ1IsR0FBRyxFQUFFLG1CQUFtQjs0QkFDeEIsR0FBRyxFQUFFLGVBQWU7eUJBQ3ZCO3dCQUNELG9CQUFvQixFQUFFLE1BQU07d0JBQzVCLGVBQWUsRUFBRSxxQkFBcUI7d0JBQ3RDLGNBQWMsRUFBRSxNQUFNO3dCQUN0QixxQkFBcUIsRUFBRSxLQUFLO3dCQUM1QixnQkFBZ0IsRUFBRSxFQUFFO3dCQUNwQixzQkFBc0IsRUFBRSxxQkFBcUI7d0JBQzdDLElBQUksRUFBRSxJQUFJO3dCQUNWLE1BQU0sRUFBRSxrTkFBa047cUJBQzdOO29CQUNEO3dCQUNJLGNBQWMsRUFBRSxDQUFDO3dCQUNqQixVQUFVLEVBQUU7NEJBQ1IsU0FBUyxFQUFFLGdDQUFnQzs0QkFDM0MsWUFBWSxFQUFFLElBQUk7eUJBQ3JCO3dCQUNELFVBQVUsRUFBRTs0QkFDUixHQUFHLEVBQUUsbUJBQW1COzRCQUN4QixHQUFHLEVBQUUsZUFBZTt5QkFDdkI7d0JBQ0Qsb0JBQW9CLEVBQUUsTUFBTTt3QkFDNUIsZUFBZSxFQUFFLHFCQUFxQjt3QkFDdEMsY0FBYyxFQUFFLE1BQU07d0JBQ3RCLHFCQUFxQixFQUFFLEtBQUs7d0JBQzVCLGdCQUFnQixFQUFFLEVBQUU7d0JBQ3BCLHNCQUFzQixFQUFFLHFCQUFxQjt3QkFDN0MsSUFBSSxFQUFFLElBQUk7d0JBQ1YsTUFBTSxFQUFFLGtOQUFrTjtxQkFDN047b0JBQ0Q7d0JBQ0ksY0FBYyxFQUFFLENBQUM7d0JBQ2pCLFVBQVUsRUFBRTs0QkFDUixTQUFTLEVBQUUsZ0NBQWdDOzRCQUMzQyxZQUFZLEVBQUUsSUFBSTt5QkFDckI7d0JBQ0QsVUFBVSxFQUFFOzRCQUNSLEdBQUcsRUFBRSxtQkFBbUI7NEJBQ3hCLEdBQUcsRUFBRSxlQUFlO3lCQUN2Qjt3QkFDRCxvQkFBb0IsRUFBRSxNQUFNO3dCQUM1QixlQUFlLEVBQUUscUJBQXFCO3dCQUN0QyxjQUFjLEVBQUUsTUFBTTt3QkFDdEIscUJBQXFCLEVBQUUsS0FBSzt3QkFDNUIsZ0JBQWdCLEVBQUUsRUFBRTt3QkFDcEIsc0JBQXNCLEVBQUUscUJBQXFCO3dCQUM3QyxJQUFJLEVBQUUsSUFBSTt3QkFDVixNQUFNLEVBQUUsa05BQWtOO3FCQUM3TjtvQkFDRDt3QkFDSSxjQUFjLEVBQUUsQ0FBQzt3QkFDakIsVUFBVSxFQUFFOzRCQUNSLFNBQVMsRUFBRSxnQ0FBZ0M7NEJBQzNDLFlBQVksRUFBRSxJQUFJO3lCQUNyQjt3QkFDRCxVQUFVLEVBQUU7NEJBQ1IsR0FBRyxFQUFFLG1CQUFtQjs0QkFDeEIsR0FBRyxFQUFFLGVBQWU7eUJBQ3ZCO3dCQUNELG9CQUFvQixFQUFFLE1BQU07d0JBQzVCLGVBQWUsRUFBRSxxQkFBcUI7d0JBQ3RDLGNBQWMsRUFBRSxNQUFNO3dCQUN0QixxQkFBcUIsRUFBRSxLQUFLO3dCQUM1QixnQkFBZ0IsRUFBRSxFQUFFO3dCQUNwQixzQkFBc0IsRUFBRSxxQkFBcUI7d0JBQzdDLElBQUksRUFBRSxJQUFJO3dCQUNWLE1BQU0sRUFBRSxrTkFBa047cUJBQzdOO29CQUNEO3dCQUNJLGNBQWMsRUFBRSxDQUFDO3dCQUNqQixVQUFVLEVBQUU7NEJBQ1IsU0FBUyxFQUFFLGdDQUFnQzs0QkFDM0MsWUFBWSxFQUFFLElBQUk7eUJBQ3JCO3dCQUNELFVBQVUsRUFBRTs0QkFDUixHQUFHLEVBQUUsbUJBQW1COzRCQUN4QixHQUFHLEVBQUUsZUFBZTt5QkFDdkI7d0JBQ0Qsb0JBQW9CLEVBQUUsTUFBTTt3QkFDNUIsZUFBZSxFQUFFLHFCQUFxQjt3QkFDdEMsY0FBYyxFQUFFLE1BQU07d0JBQ3RCLHFCQUFxQixFQUFFLEtBQUs7d0JBQzVCLGdCQUFnQixFQUFFLEVBQUU7d0JBQ3BCLHNCQUFzQixFQUFFLHFCQUFxQjt3QkFDN0MsSUFBSSxFQUFFLElBQUk7d0JBQ1YsTUFBTSxFQUFFLGtOQUFrTjtxQkFDN047b0JBQ0Q7d0JBQ0ksY0FBYyxFQUFFLENBQUM7d0JBQ2pCLFVBQVUsRUFBRTs0QkFDUixTQUFTLEVBQUUsZ0NBQWdDOzRCQUMzQyxZQUFZLEVBQUUsSUFBSTt5QkFDckI7d0JBQ0QsVUFBVSxFQUFFOzRCQUNSLEdBQUcsRUFBRSxtQkFBbUI7NEJBQ3hCLEdBQUcsRUFBRSxlQUFlO3lCQUN2Qjt3QkFDRCxvQkFBb0IsRUFBRSxNQUFNO3dCQUM1QixlQUFlLEVBQUUscUJBQXFCO3dCQUN0QyxjQUFjLEVBQUUsUUFBUTt3QkFDeEIscUJBQXFCLEVBQUUsS0FBSzt3QkFDNUIsZ0JBQWdCLEVBQUUsRUFBRTt3QkFDcEIsc0JBQXNCLEVBQUUscUJBQXFCO3dCQUM3QyxJQUFJLEVBQUUsSUFBSTt3QkFDVixNQUFNLEVBQUUsa05BQWtOO3FCQUM3TjtvQkFDRDt3QkFDSSxjQUFjLEVBQUUsQ0FBQzt3QkFDakIsVUFBVSxFQUFFOzRCQUNSLFNBQVMsRUFBRSxnQ0FBZ0M7NEJBQzNDLFlBQVksRUFBRSxJQUFJO3lCQUNyQjt3QkFDRCxVQUFVLEVBQUU7NEJBQ1IsR0FBRyxFQUFFLENBQUM7NEJBQ04sR0FBRyxFQUFFLENBQUM7eUJBQ1Q7d0JBQ0Qsb0JBQW9CLEVBQUUsTUFBTTt3QkFDNUIsZUFBZSxFQUFFLHFCQUFxQjt3QkFDdEMsY0FBYyxFQUFFLFFBQVE7d0JBQ3hCLHFCQUFxQixFQUFFLEtBQUs7d0JBQzVCLGdCQUFnQixFQUFFLFNBQVM7d0JBQzNCLHNCQUFzQixFQUFFLHVCQUF1Qjt3QkFDL0MsSUFBSSxFQUFFLElBQUk7d0JBQ1YsTUFBTSxFQUFFLGtOQUFrTjtxQkFDN04sQ0FBQztnQkFDRixnQkFBZ0IsRUFBRSxFQUFFO2dCQUNwQixzQkFBc0IsRUFBRSxxQkFBcUI7Z0JBQzdDLElBQUksRUFBRSxJQUFJO2dCQUNWLE1BQU0sRUFBRSx3VEFBd1Q7YUFDblUsQ0FBQztRQUNGLGdCQUFnQixFQUFFO1lBQ2QsVUFBVSxFQUFFLFNBQVM7U0FDeEI7S0FDSixDQUFDO0lBc0RGLE1BQWEsT0FBTztRQUVoQixZQUFtQixHQUFXO1lBQVgsUUFBRyxHQUFILEdBQUcsQ0FBUTtRQUM5QixDQUFDO1FBRUQsSUFBSSxDQUFDLEVBQTBDO1lBQzNDLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsa0JBQWtCLEVBQUUsQ0FBQyxRQUFRLGFBQWEsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDeEYsT0FBTyxJQUFJLENBQUMsR0FBRyxFQUF5QixDQUFDO1FBQzdDLENBQUM7UUFFRCxpQkFBaUI7WUFDYixtREFBbUQ7WUFFbkQsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDOUMsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxLQUFLLE1BQU0sQ0FBQyxDQUFDO1lBQ25GLElBQUksS0FBSyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFFOUIsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2pDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxLQUFLO2dCQUNoRixDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsS0FBSzthQUNuRixDQUFDLENBQUM7WUFHSCxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLGlCQUFpQixDQUFDLENBQUM7WUFFbEQsSUFBSSxNQUFNLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3ZDLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtnQkFDNUIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2dCQUNuQyxhQUFhLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztnQkFDaEMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3RDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtvQkFDdkIsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZO29CQUMvQixRQUFRLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztpQkFDOUIsQ0FBQyxDQUFDO2FBQ04sQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLE1BQU0sR0FBNkIsRUFBRSxDQUFDO1lBQzFDLElBQUksQ0FBQyxHQUFHLElBQUksUUFBUSxFQUE0QixDQUFDO1lBQ3pELElBQUksQ0FBQyxHQUFHLElBQUksUUFBUSxFQUFFLENBQUM7WUFDdkIsQ0FBQyxDQUFDLE1BQU0sQ0FBQTtZQUNBLElBQUksSUFBSSxHQUFHLEdBQUcsRUFBRTtnQkFDWixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtvQkFDaEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDbEIsT0FBTztpQkFDVjtnQkFFRCxJQUFJLENBQUMsSUFBSSxDQUE4QixNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7cUJBQy9DLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtvQkFDWCxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDekIsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLENBQUM7WUFFWCxDQUFDLENBQUM7WUFDRixJQUFJLEVBQUUsQ0FBQztZQUVQLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO1FBRUQsWUFBWTtZQUNSLElBQUksT0FBTztnQkFBRSxNQUFNLDRCQUE0QixDQUFDO1lBQ2hELElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsaUJBQWlCLENBQUMsQ0FBQztZQUNsRCxPQUFPLElBQUksQ0FBQyxJQUFJLEVBQXlCLENBQUM7UUFDOUMsQ0FBQztRQUVELFNBQVMsQ0FBQyxPQUdOLEVBQUU7WUFDRixJQUFJLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLGlCQUFpQixDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQzdCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUM3QixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFFL0IsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN6RSxNQUFNLENBQUMsU0FBUyxHQUFRLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUV4RSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUF3QixNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDMUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ3pCLENBQUMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQztnQkFDNUQsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsSUFBSSxPQUFPLEVBQUU7b0JBQ1QsdUJBQXVCO29CQUN2QixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDOUMsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7b0JBRS9CLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUNqQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsS0FBSzt3QkFDaEYsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLEtBQUs7cUJBQ25GLENBQUMsQ0FBQztvQkFHSCxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTt3QkFDekIsQ0FBQyxDQUFDLGFBQWEsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3BDLENBQUMsQ0FBQyxXQUFXLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNsQyxDQUFDLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBQy9ELENBQUMsQ0FBQyxDQUFDO2lCQUNOO2dCQUVELE9BQU8sTUFBTSxDQUFDO1lBQ2xCLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUVELGFBQWEsQ0FBQyxPQUFlO1lBQ3pCLElBQUksT0FBTztnQkFBRSxNQUFNLDRCQUE0QixDQUFDO1lBQ2hELElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsMEJBQTBCLENBQUMsQ0FBQztZQUMzRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBR1o7Z0JBQ0MsRUFBRSxFQUFFLE9BQU87Z0JBQ1gsVUFBVSxFQUFFLEVBQUU7YUFDakIsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUVELFdBQVcsQ0FBQyxPQUFlLEVBQUUsVUFBb0I7WUFDN0MsSUFBSSxPQUFPO2dCQUFFLE1BQU0sNEJBQTRCLENBQUM7WUFDaEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2hELElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsOEJBQThCLENBQUMsQ0FBQztZQUMvRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQWdCO2dCQUMzQixFQUFFLEVBQUUsT0FBTztnQkFDWCxLQUFLLEVBQUUsVUFBVTthQUNwQixDQUFDLENBQUM7UUFDUCxDQUFDO0tBQ0o7SUE3SEQsMEJBNkhDOztBQ2xhRDs7R0FFRzs7OztJQW1CSCxNQUFxQixLQUFLO1FBR3RCLFlBQVksR0FBVztZQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFFRCxLQUFLLENBQUMsSUFnQ0w7WUFFRyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUNqQixLQUFLLEVBQUUsS0FBSztnQkFDWixJQUFJLEVBQUUsSUFBSTtnQkFDVixLQUFLLEVBQUUsSUFBSTtnQkFDWCxvQkFBb0IsRUFBRSxJQUFJO2dCQUMxQixjQUFjLEVBQUUsS0FBSztnQkFDckIsZUFBZSxFQUFFLEtBQUs7Z0JBQ3RCLENBQUMsRUFBRSxPQUFPO2FBQ2IsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVULElBQUksR0FBRyxDQUFDLFNBQVM7Z0JBQUUsR0FBRyxDQUFDLFNBQVMsR0FBUSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoRSxJQUFJLEdBQUcsQ0FBQyxTQUFTO2dCQUFFLEdBQUcsQ0FBQyxTQUFTLEdBQVEsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDaEUsSUFBSSxHQUFHLENBQUMsMEJBQTBCO2dCQUFFLEdBQUcsQ0FBQywwQkFBMEIsR0FBUSxHQUFHLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRW5ILE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsQ0FBQztLQUVKO0lBMURELHdCQTBEQztJQUVELFNBQWdCLEdBQUc7UUFDZixJQUFJLEtBQUssQ0FBQyw0RkFBNEYsQ0FBQzthQUNsRyxLQUFLLENBQUM7WUFDSCxTQUFTLEVBQUUsQ0FBQyxZQUFZLENBQUM7WUFDekIsb0JBQW9CLEVBQUUsSUFBSTtTQUM3QixDQUFDO2FBQ0QsSUFBSSxDQUFDLENBQUMsS0FBb0IsRUFBRSxFQUFFO1lBQzNCLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2hDLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQVRELGtCQVNDOztBQzFGRDs7R0FFRzs7OztJQUtILE1BQXFCLFdBQVc7UUFHNUIsWUFBWSxHQUFXO1lBQ25CLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVELElBQUksQ0FBQyxJQVNKO1lBRUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDakIsU0FBUyxFQUFFLEdBQUc7Z0JBQ2QsTUFBTSxFQUFFLFdBQVc7Z0JBQ25CLFlBQVksRUFBRSxDQUFDO2dCQUNmLFFBQVEsRUFBRSxHQUFHO2dCQUNiLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixDQUFDLEVBQUUsT0FBTzthQUNiLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFVCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLENBQUM7S0FFSjtJQTlCRCw4QkE4QkM7SUFFRCxTQUFnQixHQUFHO1FBQ2YsSUFBSSxXQUFXLENBQUMsMkZBQTJGLENBQUM7YUFDdkcsSUFBSSxDQUFDO1lBQ0YsVUFBVSxFQUFFLHNEQUFzRDtZQUNsRSxRQUFRLEVBQUUsY0FBYztZQUN4QixRQUFRLEVBQUUsU0FBUztTQUN0QixDQUFDO2FBQ0QsSUFBSSxDQUFDLENBQUMsS0FvQk4sRUFBRSxFQUFFO1lBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUMvRCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQS9CRCxrQkErQkM7O0FDdEVEOztHQUVHOzs7O0lBS0gsTUFBcUIsSUFBSTtRQUdyQixZQUFZLEdBQVc7WUFDbkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRUQsSUFBSSxDQUFDLElBU0o7WUFFRyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUNqQixTQUFTLEVBQUUsR0FBRztnQkFDZCxNQUFNLEVBQUUsV0FBVztnQkFDbkIsWUFBWSxFQUFFLENBQUM7Z0JBQ2YsUUFBUSxFQUFFLEdBQUc7Z0JBQ2IsVUFBVSxFQUFFLEtBQUs7Z0JBQ2pCLENBQUMsRUFBRSxPQUFPO2FBQ2IsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVULE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsQ0FBQztLQUVKO0lBOUJELHVCQThCQztJQUVELFNBQWdCLEdBQUc7UUFDZixJQUFJLElBQUksQ0FBQyxvRUFBb0UsQ0FBQzthQUN6RSxJQUFJLENBQUM7WUFDRixJQUFJLEVBQUUsc0RBQXNEO1lBQzVELFFBQVEsRUFBRSxjQUFjO1lBQ3hCLFFBQVEsRUFBRSxTQUFTO1NBQ3RCLENBQUM7YUFDRCxJQUFJLENBQUMsQ0FBQyxLQXFCTixFQUFFLEVBQUU7WUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzFELE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkIsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBaENELGtCQWdDQzs7QUN2RUQ7OztHQUdHOzs7O0lBTUgsa0dBQWtHO0lBQ2xHLElBQUssY0FHSjtJQUhELFdBQUssY0FBYztRQUNmLHdEQUFZLENBQUE7UUFDWixnRUFBZ0IsQ0FBQTtJQUNwQixDQUFDLEVBSEksY0FBYyxLQUFkLGNBQWMsUUFHbEI7SUFFRCxNQUFxQixRQUFRO1FBR3pCLFlBQVksR0FBVztZQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFFRCxPQUFPLENBQUMsSUFLUDtZQUVHLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBQ2pCLEVBQUUsRUFBRSxJQUFJO2dCQUNSLGVBQWUsRUFBRSxVQUFVO2dCQUMzQixVQUFVLEVBQUUsY0FBYyxDQUFDLEtBQUs7Z0JBQ2hDLENBQUMsRUFBRSxPQUFPO2FBQ2IsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVULEdBQUcsQ0FBQyxTQUFTLEdBQVEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbkQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRUQsTUFBTSxDQUFDLElBWU47WUFDRyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUNqQixZQUFZLEVBQUUsbUJBQW1CO2dCQUNqQyxJQUFJLEVBQUUsSUFBSTtnQkFDVixLQUFLLEVBQUUsSUFBSTtnQkFDWCxRQUFRLEVBQUUsSUFBSTtnQkFDZCxJQUFJLEVBQUUsY0FBYyxDQUFDLEtBQUs7Z0JBQzFCLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQztnQkFDakIsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLFFBQVEsRUFBRSxJQUFJO2dCQUNkLENBQUMsRUFBRSxPQUFPO2FBQ2IsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVULEdBQUcsQ0FBQyxVQUFVLEdBQVEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckQsR0FBRyxDQUFDLFNBQVMsR0FBUSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM3QyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLENBQUM7S0FFSjtJQXZERCwyQkF1REM7SUFFRCxTQUFnQixHQUFHO1FBQ2YsSUFBSSxRQUFRLENBQUMsaUdBQWlHLENBQUM7YUFDMUcsT0FBTyxDQUFDO1lBQ0wsU0FBUyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztTQUN6RyxDQUFDO2FBQ0QsSUFBSSxDQUFDLENBQUMsS0FBUyxFQUFFLEVBQUU7WUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEMsQ0FBQyxDQUFDLENBQUM7UUFFUCxJQUFJLFFBQVEsQ0FBQyxnR0FBZ0csQ0FBQzthQUN6RyxNQUFNLENBQUM7WUFDSixVQUFVLEVBQUU7Z0JBQ1IsWUFBWSxFQUFFLG1CQUFtQjtnQkFDakMsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDO2FBQ3ZDO1lBQ0QsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDO1NBQ25CLENBQUM7YUFDRCxJQUFJLENBQUMsQ0FBQyxLQUFTLEVBQUUsRUFBRTtZQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFwQkQsa0JBb0JDOztBQzVGRDs7O0dBR0c7Ozs7SUFZSCxNQUFxQixHQUFHO1FBR3BCLFlBQVksR0FBVztZQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdkMsQ0FBQztRQUVELGlCQUFpQixDQUFDLElBUWpCO1lBRUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDakIsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsQ0FBQyxFQUFFLE9BQU87YUFDYixFQUFFLElBQUksQ0FBQyxDQUFDO1lBRVQsR0FBRyxDQUFDLFNBQVMsR0FBUSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUVuRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFFRCxpQkFBaUIsQ0FBQyxJQUdqQjtZQUVHLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBQ2pCLEtBQUssRUFBRSxJQUFJO2dCQUNYLENBQUMsRUFBRSxPQUFPO2FBQ2IsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVULEdBQUcsQ0FBQyxTQUFTLEdBQVEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbkQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRUQsU0FBUyxDQUFDLElBS1Q7WUFFRyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUNqQixTQUFTLEVBQUUsQ0FBQztnQkFDWixDQUFDLEVBQUUsT0FBTzthQUNiLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFVCxHQUFHLENBQUMsU0FBUyxHQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ25ELEdBQUcsQ0FBQyxxQkFBcUIsR0FBUSxJQUFJLEdBQUcsQ0FBQyxxQkFBcUIsR0FBRyxDQUFDO1lBQ2xFLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVELGlCQUFpQixDQUFDLElBUWpCO1lBRUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDakIsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsQ0FBQyxFQUFFLE9BQU87YUFDYixFQUFFLElBQUksQ0FBQyxDQUFDO1lBRVQsR0FBRyxDQUFDLFNBQVMsR0FBUSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNuRCxHQUFHLENBQUMsWUFBWSxHQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRXpELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVELFdBQVcsQ0FBQyxJQUNYO1lBRUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDakIsQ0FBQyxFQUFFLE9BQU87YUFDYixFQUFFLElBQUksQ0FBQyxDQUFDO1lBRVQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRUQsaUJBQWlCLENBQUMsSUFDakI7WUFFRyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUNqQixDQUFDLEVBQUUsT0FBTzthQUNiLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFVCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFFRCxpQkFBaUIsQ0FBQyxJQUNqQjtZQUVHLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBQ2pCLENBQUMsRUFBRSxPQUFPO2FBQ2IsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVULE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsQ0FBQztLQUdKO0lBaEhELHNCQWdIQztJQUVELFNBQWdCLEdBQUc7UUFFZixvQkFBb0I7UUFDcEIsSUFBSSxHQUFHLENBQUMseUlBQXlJLENBQUM7YUFDN0ksaUJBQWlCLENBQUM7WUFDZixTQUFTLEVBQUUsQ0FBQztvQkFDUixPQUFPLEVBQUUsVUFBVTtvQkFDbkIsUUFBUSxFQUFFO3dCQUNOLENBQUMsRUFBRSxNQUFNO3dCQUNULENBQUMsRUFBRSxPQUFPO3FCQUNiO2lCQUNKLENBQUM7WUFDRixTQUFTLEVBQUUsR0FBRztZQUNkLElBQUksRUFBRSxLQUFLO1NBQ2QsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBU1IsRUFBRSxFQUFFO1lBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM1QyxDQUFDLENBQUMsQ0FBQztRQUVQLG9CQUFvQjtRQUNwQixJQUFJLEdBQUcsQ0FBQyx5SUFBeUksQ0FBQzthQUM3SSxpQkFBaUIsQ0FBQztZQUNmLFNBQVMsRUFBRSxDQUFDO29CQUNSLE9BQU8sRUFBRSxVQUFVO29CQUNuQixPQUFPLEVBQUUsS0FBSztpQkFDakIsQ0FBQztZQUNGLEtBQUssRUFBRSxNQUFNO1NBQ2hCLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFTLEVBQUUsRUFBRTtZQUNsQixPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDO1FBRVAsWUFBWTtRQUNaLElBQUksR0FBRyxDQUFDLGlJQUFpSSxDQUFDO2FBQ3JJLFNBQVMsQ0FBQztZQUNQLFNBQVMsRUFBRSxDQUFDO29CQUNSLE9BQU8sRUFBRSxVQUFVO29CQUNuQixPQUFPLEVBQUUsS0FBSztpQkFDakIsQ0FBQztZQUNGLHFCQUFxQixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUNoQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FVUixFQUFFLEVBQUU7WUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNwQyxDQUFDLENBQUMsQ0FBQztRQUVQLHNCQUFzQjtRQUN0QixJQUFJLEdBQUcsQ0FBQyx5SUFBeUksQ0FBQzthQUM3SSxpQkFBaUIsQ0FBQztZQUNmLFNBQVMsRUFBRSxDQUFDO29CQUNSLE9BQU8sRUFBRSxVQUFVO29CQUNuQixPQUFPLEVBQUUsS0FBSztpQkFDakIsQ0FBQztZQUNGLFlBQVksRUFBRSxDQUFDO29CQUNYLE9BQU8sRUFBRSxDQUFDO29CQUNWLE1BQU0sRUFBRSw0QkFBNEIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO2lCQUNsRCxDQUFDO1NBQ0wsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQVMsRUFBRSxFQUFFO1lBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDLENBQUM7UUFFUCxxQkFBcUI7UUFFckIsNEJBQTRCO1FBRTVCLDRCQUE0QjtJQUNoQyxDQUFDO0lBakZELGtCQWlGQzs7QUNsTkQ7O0dBRUc7Ozs7SUFlSDs7T0FFRztJQUNILE1BQXFCLE1BQU07UUFHdkIsWUFBWSxHQUFXO1lBQ25CLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN2QyxDQUFDO1FBRUQsTUFBTSxDQUFDLElBb0NOO1lBRUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDakIsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztnQkFDaEIsR0FBRyxFQUFFLEVBQUU7Z0JBQ1AsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsTUFBTSxFQUFFLElBQUk7Z0JBQ1osTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsV0FBVyxFQUFFLElBQUk7Z0JBQ2pCLENBQUMsRUFBRSxPQUFPO2FBQ2IsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVULEdBQUcsQ0FBQyxJQUFJLEdBQVEsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbkMsR0FBRyxDQUFDLElBQUksR0FBUSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVuQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLENBQUM7S0FFSjtJQTlERCx5QkE4REM7SUFFRCxTQUFnQixHQUFHO1FBQ2YsSUFBSSxNQUFNLENBQUMsOEdBQThHLENBQUM7YUFDckgsTUFBTSxDQUFDO1lBQ0osSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQztTQUNuQyxDQUFDO2FBQ0QsSUFBSSxDQUFDLENBQUMsS0FBUyxFQUFFLEVBQUU7WUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDakMsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBUkQsa0JBUUM7O0FDNUZEOztHQUVHOzs7O0lBZUg7O09BRUc7SUFDSCxNQUFxQixJQUFJO1FBR3JCLFlBQVksR0FBVztZQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdkMsQ0FBQztRQUVELElBQUksQ0FBQyxJQWlCSjtZQUVHLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBQ2pCLEVBQUUsRUFBRSxJQUFJO2dCQUNSLENBQUMsRUFBRSxPQUFPO2FBQ2IsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVULEdBQUcsQ0FBQyxNQUFNLEdBQVEsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFdkMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5QixDQUFDO0tBRUo7SUFyQ0QsdUJBcUNDO0lBRUQsU0FBZ0IsR0FBRztRQUNmLElBQUksSUFBSSxDQUFDLDRHQUE0RyxDQUFDO2FBQ2pILElBQUksQ0FBQztZQUNGLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQztTQUNoQixDQUFDO2FBQ0QsSUFBSSxDQUFDLENBQUMsS0FXTixFQUFFLEVBQUU7WUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvQixDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFwQkQsa0JBb0JDOztBQy9FRDs7R0FFRzs7OztJQWVIOztPQUVHO0lBQ0gsTUFBcUIsUUFBUTtRQUd6QixZQUFZLEdBQVc7WUFDbkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxRQUFRLENBQUMsSUFzQlI7WUFFRyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUNqQixFQUFFLEVBQUUsSUFBSTtnQkFDUixTQUFTLEVBQUUsRUFBRTtnQkFDYixDQUFDLEVBQUUsT0FBTzthQUNiLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFVCxHQUFHLENBQUMsU0FBUyxHQUFRLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdDLEdBQUcsQ0FBQyxZQUFZLEdBQVEsR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRXZHLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBV2pCLEdBQUcsQ0FBQyxDQUFDO1FBQ1osQ0FBQztLQUdKO0lBeERELDJCQXdEQztJQUVELFNBQWdCLEdBQUc7UUFDZixJQUFJLFFBQVEsQ0FBQyw4R0FBOEcsQ0FBQzthQUN2SCxRQUFRLENBQUM7WUFDTixZQUFZLEVBQUUsbUJBQW1CO1lBQ2pDLFFBQVEsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQztZQUN4QixTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO1lBQzdCLFlBQVksRUFBRTtnQkFDVixLQUFLLEVBQUUsR0FBRztnQkFDVixNQUFNLEVBQUUsR0FBRztnQkFDWCxHQUFHLEVBQUUsRUFBRTthQUNWO1lBQ0QsU0FBUyxFQUFFLENBQUM7U0FDZixDQUFDO2FBQ0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkMsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBaEJELGtCQWdCQzs7QUM5RkQ7O0dBRUc7Ozs7SUFLSDs7T0FFRztJQUNILE1BQXFCLEtBQUs7UUFHdEIsWUFBWSxHQUFXO1lBQ25CLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN2QyxDQUFDO1FBRUQsS0FBSyxDQUFDLElBZ0JMO1lBRUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDakIsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsQ0FBQyxFQUFFLE9BQU87YUFDYixFQUFFLElBQUksQ0FBQyxDQUFDO1lBRVQsSUFBSSxHQUFHLENBQUMsU0FBUztnQkFBRSxHQUFHLENBQUMsU0FBUyxHQUFRLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRWhFLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBZWpCLEdBQUcsQ0FBQyxDQUFDO1FBQ1osQ0FBQztLQUVKO0lBcERELHdCQW9EQztJQUVELFNBQWdCLEdBQUc7UUFDZixJQUFJLEtBQUssQ0FBQyw2R0FBNkcsQ0FBQzthQUNuSCxLQUFLLENBQUM7WUFDSCxJQUFJLEVBQUUsZ0JBQWdCO1NBQ3pCLENBQUM7YUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFORCxrQkFNQzs7QUN0RUQ7O0dBRUc7Ozs7SUFLSCxNQUFxQixjQUFjO1FBRy9CLFlBQVksR0FBVztZQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdkMsQ0FBQztRQUVELGNBQWMsQ0FBQyxJQU1kO1lBRUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDakIsTUFBTSxFQUFFLFdBQVc7Z0JBQ25CLFFBQVEsRUFBRSxFQUFFO2dCQUNaLFFBQVEsRUFBRSxJQUFJO2dCQUNkLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixrQkFBa0IsRUFBRSxLQUFLO2dCQUN6QixDQUFDLEVBQUUsT0FBTzthQUNiLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFVCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLENBQUM7S0FFSjtJQTVCRCxpQ0E0QkM7SUFFRCxTQUFnQixHQUFHO1FBQ2YsSUFBSSxjQUFjLENBQUMsOEVBQThFLENBQUM7YUFDN0YsY0FBYyxDQUFDO1lBQ1osUUFBUSxFQUFFLHNCQUFzQjtTQUNuQyxDQUFDO2FBQ0QsSUFBSSxDQUFDLENBQUMsS0EyQk4sRUFBRSxFQUFFO1lBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN2QixDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFwQ0Qsa0JBb0NDOzs7O0lDekVELE1BQU0sTUFBTSxHQUFHO1FBQ1gsR0FBRyxFQUFFLENBQUMsZ0JBQWdCO1FBQ3RCLEdBQUcsRUFBRSxlQUFlO0tBQ3ZCLENBQUM7SUFFRixJQUFJLEtBQUssR0FBRztRQUNSLE1BQU0sRUFBRTtZQUNKO2dCQUNJLFlBQVksRUFBRSxPQUFPO2dCQUNyQixrQkFBa0IsRUFBRSxRQUFRO2dCQUM1QixXQUFXLEVBQUUscUJBQXFCO2dCQUNsQyxlQUFlLEVBQUU7b0JBQ2IsR0FBRyxFQUFFLENBQUM7b0JBQ04sR0FBRyxFQUFFLENBQUM7aUJBQ1Q7Z0JBQ0QsYUFBYSxFQUFFO29CQUNYLEdBQUcsRUFBRSxDQUFDO29CQUNOLEdBQUcsRUFBRSxDQUFDO2lCQUNUO2dCQUNELFlBQVksRUFBRSxDQUFDO3dCQUNYLGNBQWMsRUFBRSxDQUFDO3dCQUNqQixVQUFVLEVBQUU7NEJBQ1IsU0FBUyxFQUFFLFlBQVk7NEJBQ3ZCLFlBQVksRUFBRSxJQUFJO3lCQUNyQjt3QkFDRCxVQUFVLEVBQUU7NEJBQ1IsR0FBRyxFQUFFLENBQUM7NEJBQ04sR0FBRyxFQUFFLENBQUM7eUJBQ1Q7d0JBQ0Qsb0JBQW9CLEVBQUUsTUFBTTt3QkFDNUIsZUFBZSxFQUFFLHFCQUFxQjt3QkFDdEMsY0FBYyxFQUFFLFFBQVE7d0JBQ3hCLHFCQUFxQixFQUFFLEtBQUs7d0JBQzVCLGdCQUFnQixFQUFFLFNBQVM7d0JBQzNCLHNCQUFzQixFQUFFLHlCQUF5Qjt3QkFDakQsSUFBSSxFQUFFLElBQUk7d0JBQ1YsTUFBTSxFQUFFLGtOQUFrTjtxQkFDN047b0JBQ0c7d0JBQ0ksY0FBYyxFQUFFLENBQUM7d0JBQ2pCLFVBQVUsRUFBRTs0QkFDUixTQUFTLEVBQUUsWUFBWTs0QkFDdkIsWUFBWSxFQUFFLElBQUk7eUJBQ3JCO3dCQUNELFVBQVUsRUFBRTs0QkFDUixHQUFHLEVBQUUsQ0FBQzs0QkFDTixHQUFHLEVBQUUsQ0FBQzt5QkFDVDt3QkFDRCxvQkFBb0IsRUFBRSxNQUFNO3dCQUM1QixlQUFlLEVBQUUscUJBQXFCO3dCQUN0QyxjQUFjLEVBQUUsUUFBUTt3QkFDeEIscUJBQXFCLEVBQUUsS0FBSzt3QkFDNUIsZ0JBQWdCLEVBQUUsU0FBUzt3QkFDM0Isc0JBQXNCLEVBQUUseUJBQXlCO3dCQUNqRCxJQUFJLEVBQUUsSUFBSTt3QkFDVixNQUFNLEVBQUUsa05BQWtOO3FCQUM3TjtvQkFDRDt3QkFDSSxjQUFjLEVBQUUsQ0FBQzt3QkFDakIsVUFBVSxFQUFFOzRCQUNSLFNBQVMsRUFBRSxZQUFZOzRCQUN2QixZQUFZLEVBQUUsSUFBSTt5QkFDckI7d0JBQ0QsVUFBVSxFQUFFOzRCQUNSLEdBQUcsRUFBRSxDQUFDLGdCQUFnQjs0QkFDdEIsR0FBRyxFQUFFLGdCQUFnQjt5QkFDeEI7d0JBQ0Qsb0JBQW9CLEVBQUUsWUFBWTt3QkFDbEMsZUFBZSxFQUFFLHFCQUFxQjt3QkFDdEMsY0FBYyxFQUFFLFFBQVE7d0JBQ3hCLHFCQUFxQixFQUFFLElBQUk7d0JBQzNCLGdCQUFnQixFQUFFLFNBQVM7d0JBQzNCLHNCQUFzQixFQUFFLHlCQUF5Qjt3QkFDakQsSUFBSSxFQUFFLElBQUk7d0JBQ1YsTUFBTSxFQUFFLGtOQUFrTjtxQkFDN04sQ0FBQztnQkFDTixnQkFBZ0IsRUFBRSxFQUFFO2dCQUNwQixzQkFBc0IsRUFBRSxxQkFBcUI7Z0JBQzdDLElBQUksRUFBRSxJQUFJO2dCQUNWLE1BQU0sRUFBRSx3VEFBd1Q7YUFDblU7WUFDRDtnQkFDSSxZQUFZLEVBQUUsTUFBTTtnQkFDcEIsa0JBQWtCLEVBQUUsYUFBYTtnQkFDakMsV0FBVyxFQUFFLHFCQUFxQjtnQkFDbEMsZUFBZSxFQUFFO29CQUNiLEdBQUcsRUFBRSxDQUFDO29CQUNOLEdBQUcsRUFBRSxDQUFDO2lCQUNUO2dCQUNELGFBQWEsRUFBRTtvQkFDWCxHQUFHLEVBQUUsQ0FBQztvQkFDTixHQUFHLEVBQUUsQ0FBQztpQkFDVDtnQkFDRCxZQUFZLEVBQUUsQ0FBQzt3QkFDWCxjQUFjLEVBQUUsQ0FBQzt3QkFDakIsVUFBVSxFQUFFOzRCQUNSLFNBQVMsRUFBRSxZQUFZOzRCQUN2QixZQUFZLEVBQUUsSUFBSTt5QkFDckI7d0JBQ0QsVUFBVSxFQUFFOzRCQUNSLEdBQUcsRUFBRSxDQUFDLGdCQUFnQjs0QkFDdEIsR0FBRyxFQUFFLGVBQWU7eUJBQ3ZCO3dCQUNELG9CQUFvQixFQUFFLE1BQU07d0JBQzVCLGVBQWUsRUFBRSxxQkFBcUI7d0JBQ3RDLGNBQWMsRUFBRSxNQUFNO3dCQUN0QixxQkFBcUIsRUFBRSxLQUFLO3dCQUM1QixnQkFBZ0IsRUFBRSxFQUFFO3dCQUNwQixzQkFBc0IsRUFBRSxxQkFBcUI7d0JBQzdDLElBQUksRUFBRSxJQUFJO3dCQUNWLE1BQU0sRUFBRSxrTkFBa047cUJBQzdOO29CQUNHO3dCQUNJLGNBQWMsRUFBRSxDQUFDO3dCQUNqQixVQUFVLEVBQUU7NEJBQ1IsU0FBUyxFQUFFLFlBQVk7NEJBQ3ZCLFlBQVksRUFBRSxJQUFJO3lCQUNyQjt3QkFDRCxVQUFVLEVBQUU7NEJBQ1IsR0FBRyxFQUFFLENBQUMsZ0JBQWdCOzRCQUN0QixHQUFHLEVBQUUsZUFBZTt5QkFDdkI7d0JBQ0Qsb0JBQW9CLEVBQUUsTUFBTTt3QkFDNUIsZUFBZSxFQUFFLHFCQUFxQjt3QkFDdEMsY0FBYyxFQUFFLE1BQU07d0JBQ3RCLHFCQUFxQixFQUFFLEtBQUs7d0JBQzVCLGdCQUFnQixFQUFFLEVBQUU7d0JBQ3BCLHNCQUFzQixFQUFFLHFCQUFxQjt3QkFDN0MsSUFBSSxFQUFFLElBQUk7d0JBQ1YsTUFBTSxFQUFFLGtOQUFrTjtxQkFDN047b0JBQ0Q7d0JBQ0ksY0FBYyxFQUFFLENBQUM7d0JBQ2pCLFVBQVUsRUFBRTs0QkFDUixTQUFTLEVBQUUsWUFBWTs0QkFDdkIsWUFBWSxFQUFFLElBQUk7eUJBQ3JCO3dCQUNELFVBQVUsRUFBRTs0QkFDUixHQUFHLEVBQUUsQ0FBQyxnQkFBZ0I7NEJBQ3RCLEdBQUcsRUFBRSxlQUFlO3lCQUN2Qjt3QkFDRCxvQkFBb0IsRUFBRSxNQUFNO3dCQUM1QixlQUFlLEVBQUUscUJBQXFCO3dCQUN0QyxjQUFjLEVBQUUsTUFBTTt3QkFDdEIscUJBQXFCLEVBQUUsS0FBSzt3QkFDNUIsZ0JBQWdCLEVBQUUsRUFBRTt3QkFDcEIsc0JBQXNCLEVBQUUscUJBQXFCO3dCQUM3QyxJQUFJLEVBQUUsSUFBSTt3QkFDVixNQUFNLEVBQUUsa05BQWtOO3FCQUM3TjtvQkFDRDt3QkFDSSxjQUFjLEVBQUUsQ0FBQzt3QkFDakIsVUFBVSxFQUFFOzRCQUNSLFNBQVMsRUFBRSxZQUFZOzRCQUN2QixZQUFZLEVBQUUsSUFBSTt5QkFDckI7d0JBQ0QsVUFBVSxFQUFFOzRCQUNSLEdBQUcsRUFBRSxDQUFDLGdCQUFnQjs0QkFDdEIsR0FBRyxFQUFFLGVBQWU7eUJBQ3ZCO3dCQUNELG9CQUFvQixFQUFFLE1BQU07d0JBQzVCLGVBQWUsRUFBRSxxQkFBcUI7d0JBQ3RDLGNBQWMsRUFBRSxNQUFNO3dCQUN0QixxQkFBcUIsRUFBRSxLQUFLO3dCQUM1QixnQkFBZ0IsRUFBRSxFQUFFO3dCQUNwQixzQkFBc0IsRUFBRSxxQkFBcUI7d0JBQzdDLElBQUksRUFBRSxJQUFJO3dCQUNWLE1BQU0sRUFBRSxrTkFBa047cUJBQzdOO29CQUNEO3dCQUNJLGNBQWMsRUFBRSxDQUFDO3dCQUNqQixVQUFVLEVBQUU7NEJBQ1IsU0FBUyxFQUFFLFlBQVk7NEJBQ3ZCLFlBQVksRUFBRSxJQUFJO3lCQUNyQjt3QkFDRCxVQUFVLEVBQUU7NEJBQ1IsR0FBRyxFQUFFLENBQUMsZ0JBQWdCOzRCQUN0QixHQUFHLEVBQUUsZUFBZTt5QkFDdkI7d0JBQ0Qsb0JBQW9CLEVBQUUsTUFBTTt3QkFDNUIsZUFBZSxFQUFFLHFCQUFxQjt3QkFDdEMsY0FBYyxFQUFFLE1BQU07d0JBQ3RCLHFCQUFxQixFQUFFLEtBQUs7d0JBQzVCLGdCQUFnQixFQUFFLEVBQUU7d0JBQ3BCLHNCQUFzQixFQUFFLHFCQUFxQjt3QkFDN0MsSUFBSSxFQUFFLElBQUk7d0JBQ1YsTUFBTSxFQUFFLGtOQUFrTjtxQkFDN047b0JBQ0Q7d0JBQ0ksY0FBYyxFQUFFLENBQUM7d0JBQ2pCLFVBQVUsRUFBRTs0QkFDUixTQUFTLEVBQUUsWUFBWTs0QkFDdkIsWUFBWSxFQUFFLElBQUk7eUJBQ3JCO3dCQUNELFVBQVUsRUFBRTs0QkFDUixHQUFHLEVBQUUsQ0FBQyxnQkFBZ0I7NEJBQ3RCLEdBQUcsRUFBRSxlQUFlO3lCQUN2Qjt3QkFDRCxvQkFBb0IsRUFBRSxNQUFNO3dCQUM1QixlQUFlLEVBQUUscUJBQXFCO3dCQUN0QyxjQUFjLEVBQUUsUUFBUTt3QkFDeEIscUJBQXFCLEVBQUUsS0FBSzt3QkFDNUIsZ0JBQWdCLEVBQUUsRUFBRTt3QkFDcEIsc0JBQXNCLEVBQUUscUJBQXFCO3dCQUM3QyxJQUFJLEVBQUUsSUFBSTt3QkFDVixNQUFNLEVBQUUsa05BQWtOO3FCQUM3TjtvQkFDRDt3QkFDSSxjQUFjLEVBQUUsQ0FBQzt3QkFDakIsVUFBVSxFQUFFOzRCQUNSLFNBQVMsRUFBRSxZQUFZOzRCQUN2QixZQUFZLEVBQUUsSUFBSTt5QkFDckI7d0JBQ0QsVUFBVSxFQUFFOzRCQUNSLEdBQUcsRUFBRSxDQUFDOzRCQUNOLEdBQUcsRUFBRSxDQUFDO3lCQUNUO3dCQUNELG9CQUFvQixFQUFFLE1BQU07d0JBQzVCLGVBQWUsRUFBRSxxQkFBcUI7d0JBQ3RDLGNBQWMsRUFBRSxRQUFRO3dCQUN4QixxQkFBcUIsRUFBRSxLQUFLO3dCQUM1QixnQkFBZ0IsRUFBRSxTQUFTO3dCQUMzQixzQkFBc0IsRUFBRSx1QkFBdUI7d0JBQy9DLElBQUksRUFBRSxJQUFJO3dCQUNWLE1BQU0sRUFBRSxrTkFBa047cUJBQzdOLENBQUM7Z0JBQ04sZ0JBQWdCLEVBQUUsRUFBRTtnQkFDcEIsc0JBQXNCLEVBQUUscUJBQXFCO2dCQUM3QyxJQUFJLEVBQUUsSUFBSTtnQkFDVixNQUFNLEVBQUUsd1RBQXdUO2FBQ25VO1NBQUM7UUFDTixnQkFBZ0IsRUFBRTtZQUNkLFVBQVUsRUFBRSxTQUFTO1NBQ3hCO0tBQ0osQ0FBQztJQUVGLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ1osYUFBYSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO1FBQzdCLFdBQVcsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtRQUMzQixVQUFVLEVBQUU7WUFDUixFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzVCLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDNUIsRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM1QixFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzVCLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7U0FDL0I7S0FDSixDQUFDLENBQUM7SUFFSCxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUN0QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRTtZQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3BGLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDO0lBQ2xCLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQzNCLElBQUksQ0FBQyxhQUFhLEdBQUc7WUFDakIsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUMxQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQzdDLENBQUM7UUFDRixJQUFJLENBQUMsV0FBVyxHQUFHO1lBQ2YsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUMxQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQzdDLENBQUM7UUFDRixJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNoQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDeEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ2xFLENBQUMsQ0FBQyxDQUFBO0lBQ04sQ0FBQyxDQUFDLENBQUE7SUFDRixPQUFTLEtBQUssQ0FBQzs7Ozs7SUN6T2YsTUFBTSxRQUFRLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM5QyxNQUFNLFFBQVEsR0FBRyxJQUFJLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2hELE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQztJQUVqQixNQUFNLFdBQVcsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDdEYsTUFBTSxhQUFhLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDekMsTUFBTSxXQUFXLEdBQUcsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDckMsTUFBTSxXQUFXLEdBQUcsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFekMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxTQUFnQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzFELEtBQUssRUFBRSxTQUFTLENBQUMsS0FBSztRQUN0QixLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksRUFBRSxTQUFTO1FBQ2YsS0FBSyxFQUFFLGlCQUFpQjtLQUMzQixDQUFDLENBQUM7SUFFSCxNQUFNLGtCQUFrQixHQUFHLENBQUMsU0FBZ0MsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM5RCxLQUFLLEVBQUUsYUFBYTtRQUNwQixLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksRUFBRSxTQUFTO1FBQ2YsS0FBSyxFQUFFLGNBQWM7S0FDeEIsQ0FBQyxDQUFDO0lBRUgsTUFBTSxlQUFlLEdBQUc7UUFDcEIsS0FBSyxFQUFFLFdBQVc7UUFDbEIsS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLEVBQUUsU0FBUztRQUNmLEtBQUssRUFBRSxZQUFZO0tBQ3RCLENBQUM7SUFFRixNQUFNLGlCQUFpQixHQUFHO1FBQ3RCLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNuQixJQUFJLEVBQUUsS0FBSztRQUNYLElBQUksRUFBRSxTQUFTO1FBQ2YsS0FBSyxFQUFFLGVBQWU7UUFDdEIsT0FBTyxFQUFFO1lBQ0wsS0FBSyxFQUFFLFdBQVc7WUFDbEIsS0FBSyxFQUFFLEtBQUssR0FBRyxDQUFDO1lBQ2hCLElBQUksRUFBRSxTQUFTO1lBQ2YsS0FBSyxFQUFFLGNBQWM7U0FDeEI7S0FDSixDQUFDO0lBRUYsSUFBSSxzQkFBc0IsR0FBRyxDQUFDLFNBQWdDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDaEUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxLQUFLO1FBQ3RCLElBQUksRUFBRSxLQUFLLEdBQUcsQ0FBQztRQUNmLElBQUksRUFBRSxTQUFTO1FBQ2YsS0FBSyxFQUFFLGVBQWU7UUFDdEIsT0FBTyxFQUFFO1lBQ0wsS0FBSyxFQUFFLFdBQVc7WUFDbEIsS0FBSyxFQUFFLEtBQUssR0FBRyxDQUFDO1lBQ2hCLElBQUksRUFBRSxTQUFTO1lBQ2YsS0FBSyxFQUFFLGNBQWM7U0FDeEI7S0FDSixDQUFDLENBQUM7SUFFSCxJQUFJLFNBQVMsR0FBRyxDQUFDLFNBQWdDLEVBQUUsU0FBNEIsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNqRixJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUM7UUFDdkMsSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDekIsS0FBSyxFQUFFLGFBQWE7UUFDcEIsT0FBTyxFQUFFLENBQUMsS0FBSyxHQUFHLENBQUM7UUFDbkIsU0FBUyxFQUFFLFNBQVMsQ0FBQyxLQUFLO1FBQzFCLFFBQVEsRUFBRSxDQUFDO0tBQ2QsQ0FBQyxDQUFDO0lBRUgsSUFBSSxTQUFTLEdBQUcsQ0FBQyxTQUFnQyxFQUFFLFNBQTRCLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDakYsSUFBSSxFQUFFLFNBQVM7UUFDZixLQUFLLEVBQUUsZUFBZTtRQUN0QixJQUFJLEVBQUUsS0FBSztRQUNYLEtBQUssRUFBRSxTQUFTLENBQUMsS0FBSztRQUN0QixPQUFPLEVBQUU7WUFDTCxJQUFJLEVBQUUsU0FBUztZQUNmLEtBQUssRUFBRSxjQUFjO1lBQ3JCLEtBQUssRUFBRSxhQUFhO1lBQ3BCLEtBQUssRUFBRSxLQUFLLEdBQUcsQ0FBQztTQUNuQjtLQUNKLENBQUMsQ0FBQztJQUVILElBQUksYUFBYSxHQUFHLENBQUMsU0FBZ0MsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN2RCxJQUFJLEVBQUUsU0FBUztRQUNmLEtBQUssRUFBRSxVQUFVO1FBQ2pCLElBQUksRUFBRSxLQUFLLEdBQUcsQ0FBQztRQUNmLEtBQUssRUFBRSxTQUFTLENBQUMsS0FBSztRQUN0QixPQUFPLEVBQUU7WUFDTCxJQUFJLEVBQUUsU0FBUztZQUNmLEtBQUssRUFBRSxjQUFjO1lBQ3JCLEtBQUssRUFBRSxTQUFTLENBQUMsS0FBSztZQUN0QixLQUFLLEVBQUUsS0FBSyxHQUFHLENBQUM7U0FDbkI7S0FDSixDQUFDLENBQUM7SUFHSCxJQUFJLGlCQUFpQixHQUFHLENBQUMsU0FBZ0MsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMzRCxPQUFPLEVBQUUsU0FBUyxDQUFDLEtBQUs7UUFDeEIsTUFBTSxFQUFFLEtBQUssR0FBRyxDQUFDO1FBQ2pCLE9BQU8sRUFBRSxDQUFDO1FBQ1YsU0FBUyxFQUFFLENBQUM7UUFDWixTQUFTLEVBQUUsQ0FBQztRQUNaLE1BQU0sRUFBRSxTQUFTO1FBQ2pCLE9BQU8sRUFBRSxlQUFlO1FBQ3hCLFNBQVMsRUFBRTtZQUNQLE9BQU8sRUFBRSxhQUFhO1lBQ3RCLE9BQU8sRUFBRSxLQUFLLEdBQUcsQ0FBQztZQUNsQixNQUFNLEVBQUUsU0FBUztZQUNqQixPQUFPLEVBQUUsY0FBYztTQUMxQjtLQUNKLENBQUMsQ0FBQztJQUVILElBQUksV0FBVyxHQUFHLENBQUMsU0FBZ0MsRUFBRSxJQUFZLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbkUsSUFBSSxFQUFFLElBQUk7UUFDVixJQUFJLEVBQUUsSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztRQUN6QixLQUFLLEVBQUUsU0FBUyxDQUFDLEtBQUs7UUFDdEIsT0FBTyxFQUFFLEtBQUs7UUFDZCxPQUFPLEVBQUUsQ0FBQyxLQUFLLEdBQUcsQ0FBQztRQUNuQixTQUFTLEVBQUUsYUFBYTtRQUN4QixRQUFRLEVBQUUsQ0FBQztLQUNkLENBQUMsQ0FBQztJQUdILFNBQVMsS0FBSyxDQUFJLEdBQVEsRUFBRSxNQUF5QjtRQUNqRCxJQUFJLE1BQVMsQ0FBQztRQUNkLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztJQUNqRixDQUFDO0lBRUQsU0FBUyxPQUFPLENBQUksR0FBUSxFQUFFLE1BQXlCO1FBQ25ELElBQUksTUFBYyxDQUFDO1FBQ25CLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztJQUN0RixDQUFDO0lBRUQsU0FBUyxNQUFNLENBQUMsUUFBMEI7UUFDdEMsT0FBTyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBb0RELElBQWlCLFdBQVcsQ0FrYzNCO0lBbGNELFdBQWlCLFdBQVc7UUFtQnZCLENBQUM7UUFhRCxDQUFDO1FBRUYsTUFBYSxTQUFTO1lBZ0JsQixZQUFtQixPQUdsQjtnQkFIa0IsWUFBTyxHQUFQLE9BQU8sQ0FHekI7Z0JBWE8sV0FBTSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ3ZCLGlCQUFZLEdBQXNCLEVBQUUsQ0FBQztnQkFXekMsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztnQkFFdEIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUU3QyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFFNUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUVsQixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7b0JBQzFDLEtBQUssRUFBRSxJQUFJO29CQUNYLEtBQUssRUFBRSxXQUFXLENBQUMsVUFBVSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUM7aUJBQ3RELENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBdEJELE9BQU87Z0JBQ0gsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUM5QyxJQUFJLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQztZQUMzQixDQUFDO1lBd0NELEVBQUUsQ0FBSSxJQUFZLEVBQUUsRUFBcUI7Z0JBQ3JDLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDbEQsQ0FBQztZQUVELE9BQU8sQ0FBSSxJQUFZLEVBQUUsSUFBTztnQkFDNUIsMEZBQTBGO2dCQUMxRixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQU8sSUFBSSxDQUFDLENBQUM7WUFDdEMsQ0FBQztZQUVPLFdBQVcsQ0FBQyxLQUF5QjtnQkFDekMsSUFBSSxVQUFVLEdBQUcsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbEYsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEQsQ0FBQztZQUVPLFlBQVksQ0FBQyxJQUFjO2dCQUMvQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkMsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNsRCxDQUFDO1lBRU8sU0FBUyxDQUFDLElBQWM7Z0JBQzVCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN4QixJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQy9DLENBQUM7WUFFTyxVQUFVLENBQUMsS0FBeUIsRUFBRSxJQUF1QjtnQkFDakUsSUFBSSxVQUFVLEdBQUcsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbEYsSUFBSSxTQUFTLEdBQUcsQ0FBQyxPQUFPLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2hHLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3hDLElBQUksUUFBUSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdkQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLENBQUM7WUFFTyxPQUFPLENBQUMsS0FBeUIsRUFBRSxJQUFjLEVBQUUsU0FBaUI7Z0JBQ3hFLElBQUksVUFBVSxHQUFHLENBQUMsT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2xGLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3hDLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzNDLElBQUksUUFBUSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNuRSxDQUFDO1lBRU8sUUFBUSxDQUFDLElBQWMsRUFBRSxRQUFlO2dCQUM1QyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2pDLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3BFLElBQUksUUFBUSxHQUFHLFNBQVMsSUFBSSxJQUFJLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3hGLENBQUM7WUFFTyxZQUFZLENBQUMsV0FBc0IsRUFBRSxXQUFzQixFQUFFLFVBQW9CLEVBQUUsV0FBbUI7Z0JBQzFHLElBQUksUUFBUSxHQUFHLENBQUMsV0FBVyxJQUFJLFVBQVUsQ0FBQztnQkFDMUMsV0FBVyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUN4RCxRQUFRLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUNuRCxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRTtvQkFDMUIsTUFBTSxFQUFFLFdBQVc7b0JBQ25CLE1BQU0sRUFBRSxXQUFXO29CQUNuQixJQUFJLEVBQUUsVUFBVTtvQkFDaEIsS0FBSyxFQUFFLFdBQVc7aUJBQ3JCLENBQUMsQ0FBQztZQUVQLENBQUM7WUFFTyxZQUFZLENBQUMsS0FBZ0IsRUFBRSxJQUFjO2dCQUNqRCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDckIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUU7b0JBQzFCLEtBQUssRUFBRSxLQUFLO29CQUNaLElBQUksRUFBRSxJQUFJO2lCQUNiLENBQUMsQ0FBQztZQUNQLENBQUM7WUFFTyxVQUFVLENBQUMsSUFBOEI7Z0JBQzdDLE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBVyxFQUFzQixFQUFFLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQztnQkFFckUsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ2QsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUMxQixJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQzlCO3FCQUFNO29CQUNILElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDOUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2lCQUNsQztZQUNMLENBQUM7WUFHTyxHQUFHLENBQUMsSUFHWDtnQkFFRyxJQUFJLFNBQVMsR0FBYztvQkFDdkIsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO29CQUNqQixTQUFTLEVBQUUsSUFBSTtvQkFDZixLQUFLLEVBQUUsSUFBSTtvQkFDWCxhQUFhLEVBQUUsSUFBSTtvQkFDbkIsV0FBVyxFQUFFLElBQUk7aUJBQ3BCLENBQUM7Z0JBRUYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBRTVCLElBQUksQ0FBQyxFQUFFO29CQUNILFNBQVMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxFQUFFO3dCQUU1RCxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO3dCQUVyQyxJQUFJLFlBQVksR0FBRyxJQUFJLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFFdEUsSUFBSSxVQUFVLEdBQUcsSUFBSSxVQUFVLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO3dCQUU1RCxJQUFJLFVBQVUsR0FBRyxFQUFFLENBQUM7d0JBQ3BCLElBQUksUUFBUSxHQUFHLElBQUksWUFBWSxDQUMzQixHQUFHLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsRUFDM0YsR0FBRyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ2xDLENBQUM7d0JBRUYsSUFBSSxJQUFJLEdBQUcsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7d0JBQ3JFLElBQUksS0FBSyxHQUFHLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQzt3QkFFOUMsT0FBTzs0QkFDSCxJQUFJLEVBQUUsSUFBSTs0QkFDVixLQUFLLEVBQUUsS0FBSzt5QkFDZixDQUFDO29CQUNOLENBQUMsQ0FBQyxDQUFDO29CQUVILFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2lCQUMxRDtnQkFFRCxJQUFJLENBQUMsRUFBRTtvQkFDSCxJQUFJLFlBQVksR0FBRyxJQUFJLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUVwRSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFO3dCQUMxQixJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQzt3QkFDNUMsU0FBUyxDQUFDLGFBQWEsR0FBRzs0QkFDdEIsSUFBSSxFQUFFLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxZQUFZLENBQUM7NEJBQ3JDLEtBQUssRUFBRSxJQUFJLE9BQU8sRUFBRTt5QkFDdkIsQ0FBQzt3QkFDRixJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztxQkFDNUM7b0JBQ0QsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRTt3QkFDeEIsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7d0JBQzFDLFNBQVMsQ0FBQyxXQUFXLEdBQUc7NEJBQ3BCLElBQUksRUFBRSxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDOzRCQUNyQyxLQUFLLEVBQUUsSUFBSSxPQUFPLEVBQUU7eUJBQ3ZCLENBQUM7d0JBQ0YsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7cUJBQzFDO2lCQUNKO2dCQUVELE9BQU8sU0FBUyxDQUFDO1lBQ3JCLENBQUM7WUFFTyxNQUFNLENBQUMsS0FBZ0I7Z0JBRTNCO29CQUNJLElBQUksT0FBTyxHQUFHLEdBQUcsRUFBRTt3QkFDZixJQUFJLEtBQUssR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDbkMsS0FBSyxDQUFDLGFBQWEsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQzt3QkFDMUQsS0FBSyxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQzt3QkFFbkQsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdEcsT0FBTyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDOUIsQ0FBQyxDQUFDO29CQUNGLElBQUksSUFBSSxHQUFHLE9BQU8sRUFBRSxDQUFDO29CQUVyQixJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRTt3QkFDbEIsS0FBSyxDQUFDLFNBQVMsR0FBRzs0QkFDZCxTQUFTLEVBQUUsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksZ0JBQWdCLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7NEJBQ3pFLFFBQVEsRUFBRSxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO3lCQUMvRSxDQUFDO3dCQUNGLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO3FCQUNwQzt5QkFBTTt3QkFDSCxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQzNDLEtBQUssQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztxQkFDL0M7aUJBRUo7Z0JBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLEVBQUU7b0JBQ3hCLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxTQUFTLEdBQUcsRUFBRSxDQUFDLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTyxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUM7Z0JBQy9ELENBQUMsQ0FBQyxDQUFDO2dCQUVILEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxFQUFFO29CQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO29CQUM5QyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU8sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsU0FBUyxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRSxDQUFDLENBQUMsQ0FBQztnQkFFSCxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNuRCxDQUFDO1lBRU8sV0FBVyxDQUFDLEtBQWdCO2dCQUNoQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUM5RCxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ1QsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO2dCQUMvQyxDQUFDLENBQUMsQ0FBQztnQkFFSCxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDdkIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7d0JBQ2hDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQzt3QkFDVCxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7b0JBQ2hELENBQUMsQ0FBQyxDQUFDO2dCQUNQLENBQUMsQ0FBQyxDQUFDO2dCQUVILElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUN4QixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTt3QkFDaEMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUNULENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztvQkFDaEQsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDO1lBRUQsSUFBSSxDQUFDLE1BQVksRUFBRSxPQUFnQixFQUFFLE9BRXBDO2dCQUVHLHFDQUFxQztnQkFDckMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUVwQixJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFBRTtvQkFDekMsSUFBSSxPQUFPLEtBQUssS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTO3dCQUFFLE9BQU8sSUFBSSxDQUFDO29CQUN2RCxJQUFJLE9BQU8sS0FBSyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVE7d0JBQUUsT0FBTyxJQUFJLENBQUM7b0JBQ3RELElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssT0FBTyxFQUFFO3dCQUNuQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssT0FBTyxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssT0FBTyxDQUFDLENBQUM7cUJBQ3hGO2dCQUNMLENBQUMsQ0FBQyxDQUFDO2dCQUVILElBQUksV0FBVyxFQUFFO29CQUNiLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQzlCLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRTt3QkFDakUsaUJBQWlCLEVBQUUsSUFBSSxrQkFBa0IsQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztxQkFDakYsQ0FBQyxDQUFDO2lCQUNOO3FCQUFNO29CQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQztvQkFDdEMsT0FBTztpQkFDVjtnQkFFRCxJQUFJLG1CQUE0QixDQUFDO2dCQUNqQyxJQUFJLGlCQUF5QixDQUFDO2dCQUM5QixJQUFJLFdBQVcsR0FBRyxJQUFJLElBQUksV0FBVyxDQUFDO2dCQUN0QyxJQUFJLFVBQVUsR0FBRyxJQUFJLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxVQUFVLEdBQUcsSUFBSSxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLElBQUksY0FBcUIsQ0FBQztnQkFDMUIsSUFBSSxNQUFlLENBQUM7Z0JBRXBCLElBQUksSUFBSSxHQUFHLEdBQUcsRUFBRTtvQkFDWixJQUFJLFVBQVUsR0FBRyxVQUFVLEtBQUssVUFBVSxDQUFDO29CQUMzQyxJQUFJLFdBQVcsR0FBRyxXQUFXLEtBQUssV0FBVyxDQUFDO29CQUM5QyxJQUFJLGtCQUFrQixHQUFHLFVBQVUsSUFBSSxDQUFDLG1CQUFtQixJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsSUFBSSxDQUFDLFVBQVUsQ0FBQztvQkFDaEcsSUFBSSxnQkFBZ0IsR0FBRyxVQUFVLElBQUksQ0FBQyxtQkFBbUIsSUFBSSxPQUFPLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQyxVQUFVLElBQUksVUFBVSxDQUFDLENBQUM7b0JBQzdHLElBQUksZUFBZSxHQUFHLENBQUMsQ0FBQyxVQUFVLElBQUksQ0FBQyxVQUFVLENBQUM7b0JBRWxELElBQUksVUFBVSxFQUFFO3dCQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLENBQUMsQ0FBQztxQkFDbEQ7b0JBRUQsSUFBSSxrQkFBa0IsRUFBRTt3QkFDcEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUM7cUJBQzlDO29CQUVELElBQUksZUFBZSxFQUFFO3dCQUNqQixJQUFJLFdBQVcsR0FBRyxpQkFBaUIsQ0FBQzt3QkFDcEMsSUFBSSxXQUFXLEdBQUcsQ0FBQzs0QkFBRSxXQUFXLElBQUksQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDMUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztxQkFDeEU7b0JBRUQsSUFBSSxnQkFBZ0IsRUFBRTt3QkFDbEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLENBQUM7cUJBQzdDO29CQUVELENBQUMsV0FBVyxJQUFJLFdBQVcsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUN4RCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUV6QixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDaEUsQ0FBQyxDQUFDO2dCQUVGLElBQUksT0FBTyxHQUFHO29CQUVWLE1BQU0sQ0FBQyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLEVBQUU7d0JBQ2xDLG9CQUFvQjt3QkFDcEIsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUM7d0JBQzlDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDO3dCQUMvQyxVQUFVLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLGlCQUFpQixHQUFHLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNoSCxJQUFJLENBQUMsR0FBWSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQzt3QkFDekMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLGtCQUFrQixDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDcEUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNiLENBQUMsQ0FBQztvQkFFRixNQUFNLENBQUMsRUFBRSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxFQUFFO3dCQUNqQyxJQUFJLE1BQU0sRUFBRTs0QkFDUixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQzs0QkFDMUIsTUFBTSxHQUFHLElBQUksQ0FBQzt5QkFDakI7d0JBQ0QsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsS0FBSyxpQkFBaUI7NEJBQUUsT0FBTzt3QkFDN0QsdUNBQXVDO3dCQUN2QyxJQUFJLFNBQVMsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDO3dCQUV0QyxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQzt3QkFDNUMsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUM7d0JBQ2hELGNBQWMsR0FBYyxTQUFTLENBQUMsU0FBUyxDQUFDLFFBQVMsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDO3dCQUU3RixpREFBaUQ7d0JBQ2pELElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO3dCQUMzQixJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO3dCQUN4QixJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7d0JBRTlDLElBQUksS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7d0JBQ3pDLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQzt3QkFDckIsS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO3dCQUNyQixJQUFJLE9BQU8sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUMvQixLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQzt3QkFDakIsS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUM7d0JBQ2pCLElBQUksV0FBVyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBRW5DLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO3dCQUU5RixXQUFXLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUU7NEJBQ3JDLFVBQVUsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDOzRCQUM3RSxPQUFPLENBQUMsQ0FBQyxVQUFVLENBQUM7d0JBQ3hCLENBQUMsQ0FBQyxDQUFDO3dCQUVILElBQUksQ0FBQyxXQUFXLEVBQUU7NEJBQ2QsVUFBVSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7eUJBQ2pGO3dCQUVELElBQUksRUFBRSxDQUFDO29CQUNYLENBQUMsQ0FBQztvQkFFRixNQUFNLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsRUFBRTt3QkFDNUIsMkRBQTJEO3dCQUMzRCxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQzt3QkFDM0IsSUFBSSxDQUFDLEdBQVksSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUM7d0JBQ3pDLElBQUksVUFBVSxHQUFVLENBQUMsQ0FBQyxRQUFRLENBQUM7d0JBQ25DLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7d0JBQ3hCLElBQUksUUFBUSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFFeEUsa0VBQWtFO3dCQUNsRSxJQUFJLENBQUMsTUFBTSxFQUFFOzRCQUNULE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxVQUFVLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsR0FBRyxpQkFBaUIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQzdJLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3lCQUMxQjs2QkFBTTs0QkFDSCxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDOzRCQUM3QixNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7NEJBQ2QsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO3lCQUNuQztvQkFDTCxDQUFDLENBQUM7b0JBRUYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLEVBQUU7d0JBQzNCLHVDQUF1QztvQkFDM0MsQ0FBQyxDQUFDO29CQUVGLE1BQU0sQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxFQUFFO3dCQUMxQixtQ0FBbUM7d0JBQ25DLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztvQkFDckMsQ0FBQyxDQUFDO2lCQUVMLENBQUM7WUFFTixDQUFDO1NBRUo7UUE5WlkscUJBQVMsWUE4WnJCLENBQUE7SUFFTCxDQUFDLEVBbGNnQixXQUFXLEdBQVgsbUJBQVcsS0FBWCxtQkFBVyxRQWtjM0I7SUFFRCxTQUFnQixHQUFHO1FBRWYsSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQ2IsUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsRUFDOUI7WUFDSSxNQUFNLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUM7WUFDMUIsSUFBSSxFQUFFLEVBQUU7WUFDUixPQUFPLEVBQUUsU0FBUztTQUNyQixDQUFDLENBQUM7UUFHUDtZQUVJLElBQUksTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDdkIsZ0JBQWdCLEVBQUUsSUFBSTtnQkFDdEIsbUJBQW1CLEVBQUUsS0FBSztnQkFDMUIsZUFBZSxFQUFFLElBQUksZ0JBQWdCLENBQUMsZUFBZSxDQUFDO2dCQUN0RCxZQUFZLEVBQUUsSUFBSSxrQkFBa0IsQ0FBQyxpQkFBaUIsQ0FBQzthQUMxRCxDQUFDLENBQUM7WUFFSCxJQUFJLFNBQVMsR0FBRyxJQUFJLFdBQVcsQ0FBQyxTQUFTLENBQUM7Z0JBQ3RDLEdBQUcsRUFBRSxHQUFHO2dCQUNSLEtBQUssRUFBRSxLQUFLO2FBQ2YsQ0FBQyxDQUFDO1lBRUgsaUJBQWlCO1lBQ2pCLFNBQVMsQ0FBQyxFQUFFLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLFNBQVMsQ0FBQyxFQUFFLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBRXBFLG1CQUFtQjtZQUNuQixTQUFTLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztZQUNwRSxTQUFTLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUM5RCxTQUFTLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUNoRSxTQUFTLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUMxRCxTQUFTLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUU1RCxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7Z0JBQ2pCLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUN4QixDQUFDLENBQUMsQ0FBQztZQUVILFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQVMsRUFBRSxFQUFFO2dCQUN0QyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNqQixTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFO29CQUNqQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7aUJBQzFCLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1NBRU47SUFDTCxDQUFDO0lBaERELGtCQWdEQzs7Ozs7SUMzc0JELE1BQXFCLFNBQVM7UUFHMUIsWUFBWSxHQUFXO1lBQ25CLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVELEtBQUssQ0FBSSxJQUFPO1lBQ1osT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBQUEsQ0FBQztLQUVMO0lBWEQsNEJBV0M7SUFFRCxTQUFnQixHQUFHO1FBQ2YsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3RUFBd0UsQ0FBQyxDQUFDO0lBQzFGLENBQUM7SUFGRCxrQkFFQzs7Ozs7SUNkRDs7T0FFRztJQUNILE1BQXFCLFVBQVcsU0FBUSx5QkFBSTtRQUV4Qzs7V0FFRztRQUNILEtBQUssQ0FBQyxJQUlMO1lBQ0csSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDakIsZ0JBQWdCLEVBQUUsSUFBSTtnQkFDdEIsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLGlCQUFpQixFQUFFLElBQUk7Z0JBQ3ZCLGdCQUFnQixFQUFFLElBQUk7Z0JBQ3RCLGtCQUFrQixFQUFFLEVBQUU7Z0JBQ3RCLDRCQUE0QixFQUFFLG9CQUFvQjtnQkFDbEQsb0JBQW9CLEVBQUUsaUJBQWlCO2dCQUN2QyxxQkFBcUIsRUFBRSxjQUFjO2dCQUNyQyxDQUFDLEVBQUUsT0FBTzthQUNiLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFVCxHQUFHLENBQUMsS0FBSyxHQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVoRSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLENBQUM7S0FDSjtJQTFCRCw2QkEwQkM7SUFFRCxTQUFnQixHQUFHO1FBQ2YsSUFBSSxVQUFVLENBQUMscUdBQXFHLENBQUM7YUFDaEgsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUM7YUFDaEYsSUFBSSxDQUFDLENBQUMsS0FNTixFQUFFLEVBQUU7WUFDRCxtQ0FBbUM7WUFDbkMsSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFO2dCQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUN0QztpQkFBTTtnQkFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQzthQUMvQjtZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQWxCRCxrQkFrQkM7Ozs7O0lDakRELE1BQXFCLGdCQUFpQixTQUFRLHlCQUFJO1FBRTlDLEtBQUssQ0FBQyxJQWNMO1lBQ0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2NBeUNFO1lBQ0YsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDakIsZUFBZSxFQUFFLG1DQUFtQztnQkFDcEQsZ0JBQWdCLEVBQUUsS0FBSztnQkFDdkIsQ0FBQyxFQUFFLE9BQU87YUFDYixFQUFFLElBQUksQ0FBQyxDQUFDO1lBRVQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5QixDQUFDO0tBQ0o7SUFuRUQsbUNBbUVDO0lBRUQsU0FBZ0IsR0FBRztRQUNmLElBQUksZ0JBQWdCLENBQUMsc0hBQXNILENBQUM7YUFDdkksS0FBSyxDQUFDO1lBQ0gsVUFBVSxFQUFFLHFCQUFxQjtZQUNqQyxnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLEtBQUssRUFBRSxJQUFJO1NBQ2QsQ0FBQzthQUNELElBQUksQ0FBQyxDQUFDLEtBOEJOLEVBQUUsRUFBRTtZQUNELG1DQUFtQztZQUNuQyxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7Z0JBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3RDO2lCQUFNO2dCQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQy9CO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDakIsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBOUNELGtCQThDQzs7Ozs7SUNuSEQsTUFBcUIsT0FBTztRQUl4QixZQUFZLEdBQVc7WUFDbkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRUQsT0FBTyxDQUFDLElBUVA7WUFDRyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUNqQixDQUFDLEVBQUUsT0FBTztnQkFDVixRQUFRLEVBQUUsU0FBUztnQkFDbkIsV0FBVyxFQUFFLEtBQUs7YUFDckIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVULE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsQ0FBQztLQUNKO0lBekJELDBCQXlCQztJQUVELFNBQWdCLEdBQUc7UUFDZixJQUFJLE9BQU8sQ0FBQyw2RUFBNkUsQ0FBQzthQUNyRixPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsb0NBQW9DLEVBQUUsQ0FBQzthQUN2RCxJQUFJLENBQUMsQ0FBQyxLQU1OLEVBQUUsRUFBRTtZQUNELG1DQUFtQztZQUNuQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3hELE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkIsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBZEQsa0JBY0M7Ozs7O0lDeU5ELG9aQUFvWjtJQUVwWix1UUFBdVE7SUFDdlEsU0FBZ0IsR0FBRyxDQUFDLEtBQUssR0FBRyxrQkFBa0I7UUFDMUMsUUFBUSxDQUFDO1FBQUMsNEVBQTRFLENBQUE7UUFFdEYsSUFBSSxRQUFRLEdBQUc7WUFDWCxPQUFPLEVBQUU7Z0JBQ0wsTUFBTSxFQUFFLEdBQUc7Z0JBQ1gsYUFBYSxFQUFFLFVBQVU7Z0JBQ3pCLFNBQVMsRUFBRSxnRkFBZ0YsRUFBRSxTQUFTLEVBQUUsRUFBRTthQUM3RztTQUNKLENBQUM7UUFFRixJQUFJLElBQUksR0FBRyxJQUFJLFNBQVMsQ0FBQztZQUNyQixLQUFLLEVBQUUsS0FBSztZQUNaLDhEQUE4RDtZQUM5RCw0Q0FBNEM7WUFDNUMsa0ZBQWtGO1lBQ2xGLHdFQUF3RTtZQUN4RSx3Q0FBd0M7WUFDeEMsS0FBSyxFQUFFLEtBQUs7U0FDZixDQUFDLENBQUM7UUFFSCx1Q0FBdUM7UUFDdkMsSUFBSSxFQUFFLEdBQXlCLGVBQWUsQ0FBQztRQUMvQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRTlCLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFcEMsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDL0QsUUFBUSxDQUFDO1FBQ2IsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNsQixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDeEQsUUFBUSxDQUFDO1FBQ2IsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNsQixDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQU01QyxFQUFFLEVBQUU7WUFDRCxRQUFRLENBQUM7WUFDVCx5QkFBeUI7WUFDekIsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7WUFDM0IsdUNBQXVDO1lBQ3ZDLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDO1FBQ2pELENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQWxERCxrQkFrREM7SUFBQSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lTMVRGLFNBQWdCLElBQUksQ0FBSSxDQUFJO1FBQzFCLE9BQVksTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBRkQsb0JBRUM7Ozs7Ozs7OztJRUFELE1BQWEsT0FBTztRQUFwQjtZQUNVLFdBQU0sR0FBZ0QsRUFBRSxDQUFDO1FBbUJuRSxDQUFDO1FBbEJDLE9BQU87WUFDTCxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNuQixDQUFDO1FBQ0QsRUFBRSxDQUFDLEtBQWEsRUFBRSxFQUF5QjtZQUN6QyxNQUFNLFFBQVEsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNqRSxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xCLE9BQU87Z0JBQ0wsTUFBTSxFQUFFLEdBQUcsRUFBRTtvQkFDWCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNuQyxJQUFJLEtBQUssR0FBRyxDQUFDO3dCQUFFLE9BQU87b0JBQ3RCLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixDQUFDO2FBQ0YsQ0FBQztRQUNKLENBQUM7UUFDRCxPQUFPLENBQUMsS0FBYSxFQUFFLEdBQUcsSUFBUztZQUNqQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7Z0JBQUUsT0FBTyxLQUFLLENBQUM7WUFDdEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzVELENBQUM7S0FDRjtJQXBCRCwwQkFvQkM7Ozs7O0lDbEJELE1BQWEsVUFBVTtRQUlyQjs7V0FFRztRQUNIO1lBQ0UsSUFBSSxDQUFDLEdBQUcsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUM5QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksaUJBQU8sRUFBRSxDQUFDO1FBQy9CLENBQUM7UUFFRCxPQUFPO1lBQ0wsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNwQixDQUFDO1FBRUQsU0FBUyxDQUFDLEtBQWEsRUFBRSxFQUF5QjtZQUNoRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsT0FBTyxDQUFDLEtBQWEsRUFBRSxHQUFHLElBQVM7WUFDakMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUM5QyxDQUFDO0tBQ0Y7SUF4QkQsZ0NBd0JDOzs7Ozs7Ozs7SUV4QkQ7O09BRUc7SUFDSCxNQUFhLGtCQUFrQjtRQUEvQjtZQUNVLFlBQU8sR0FBRyxJQUFJLGlCQUFPLEVBQUUsQ0FBQztZQUN4QixjQUFTLEdBQXNELEVBQUUsQ0FBQztRQXdDNUUsQ0FBQztRQXZDQyxPQUFPO1lBQ0wsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN6QixDQUFDO1FBQ0QsRUFBRSxDQUFDLEtBQWEsRUFBRSxFQUF5QjtZQUN6QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBQ08sT0FBTyxDQUFDLE9BQWU7WUFDN0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFDTyxTQUFTLENBQUMsTUFBb0I7WUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFDRCxNQUFNLENBQUMsS0FBYTtZQUNsQixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN2RSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztpQkFDakIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNYLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDbkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbkMsQ0FBQyxDQUFDO2lCQUNELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBRWhELE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ3ZCLE1BQU07cUJBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUNkLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3ZCLENBQUMsQ0FBQztxQkFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQ2IsSUFBSSxDQUFDLE1BQU07d0JBQUUsTUFBTSxtQkFBbUIsQ0FBQztvQkFDdkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDekIsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFSyxHQUFHLENBQUMsUUFBb0Q7O2dCQUM1RCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoQyxDQUFDO1NBQUE7S0FDRjtJQTFDRCxnREEwQ0M7Ozs7O0lDN0NELFNBQVMsS0FBSyxDQUFDLElBQVk7UUFDdkIsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQyxHQUFHLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM1QixPQUFPLEdBQUcsQ0FBQyxVQUF5QixDQUFDO0lBQ3pDLENBQUM7SUFFRCxTQUFTLFNBQVMsQ0FBQyxNQUFtQixFQUFFLE1BQW1CO1FBQ3ZELE9BQU8sTUFBTSxDQUFDLFVBQVU7WUFBRSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNwRSxDQUFDO0lBRUQsU0FBUyxVQUFVLENBQUMsTUFBbUIsRUFBRSxNQUFtQjtRQUN4RCxPQUFPLE1BQU0sQ0FBQyxTQUFTO1lBQ25CLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDakUsQ0FBQztJQUVELFNBQWdCLGFBQWEsQ0FDekIsTUFBMEIsRUFDMUIsT0FBcUI7UUFFckIsZ0NBQWdDO1FBQ2hDLE1BQU0sZUFBZSxHQUFHLENBQUMsVUFBNkIsRUFBRSxFQUFFO1lBQ3RELE1BQU0sWUFBWSxHQUFHLENBQUMsU0FBaUIsRUFBRSxFQUFFO2dCQUN2QyxPQUFPLGVBQWUsU0FBUyw4RkFBOEYsQ0FBQztZQUNsSSxDQUFDLENBQUM7WUFDRixPQUFPLFlBQVksQ0FBQyxDQUFDLFVBQVUsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxTQUFTLENBQUMsQ0FBQztRQUNwRSxDQUFDLENBQUM7UUFFRixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsS0FBSzthQUN2QixHQUFHLENBQ0EsSUFBSSxDQUFDLEVBQUUsQ0FDSCxzQkFBc0IsT0FBTyxDQUFDLFdBQVcsWUFDckMsSUFBSSxDQUFDLFlBQ1QsS0FBSyxlQUFlLENBQ2hCLElBQUksQ0FBQyxZQUFZLENBQ3BCLDBCQUNHLE9BQU8sQ0FBQyxXQUNaLGFBQWEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsT0FBTyxRQUFRLENBQ2pFO2FBQ0EsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRWQscUJBQXFCO1FBQ3JCLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsUUFBUSxNQUFNLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFFcEUsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FDMUIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQzdCLENBQUM7UUFDbkIsV0FBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUN4QixLQUFLLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUNuQixLQUFLLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDakMsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQTRCLENBQUM7Z0JBQ3JELElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEtBQUssTUFBTSxDQUFDLGFBQWE7b0JBQUUsT0FBTztnQkFDdkQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEUsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUF2Q0Qsc0NBdUNDOzs7OztJQzFERCxTQUFnQixTQUFTLENBQUMsU0FBaUIsRUFBRSxHQUFXO1FBQ3BELElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxTQUFTLElBQUksQ0FBQztZQUN2RCxNQUFNLG9CQUFvQixDQUFDO1FBQy9CLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDOUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDaEIsS0FBSyxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUM7UUFDdEIsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQVBELDhCQU9DOzs7OztJQ1BELFNBQWdCLFNBQVMsQ0FBQyxTQUFpQixFQUFFLEdBQVc7UUFDcEQsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoRCxTQUFTLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNqQyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUpELDhCQUlDOzs7OztJQ09ELE1BQU0sR0FBRyxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW1DWCxDQUFDO0lBRUYsTUFBTSxHQUFHLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTZDWCxDQUFDO0lBRUYsTUFBYSxrQkFBbUIsU0FBUSx1QkFBVTtRQVk5QyxZQUNXLE9BUU47WUFFRCxLQUFLLEVBQUUsQ0FBQztZQVZELFlBQU8sR0FBUCxPQUFPLENBUWI7WUFHRCxxQkFBUyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMxQixxQkFBUyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUUxQixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLHVDQUFrQixFQUFFLENBQUM7WUFFdkMsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRztnQkFDbEQsS0FBSyxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO2dCQUN0QyxNQUFNLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUM7Z0JBQ3hDLE1BQU0sRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQztnQkFDeEMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO2FBQ3pDLENBQUMsQ0FBQztZQUNILEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7WUFFOUQsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQzdDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUMsQ0FBQztZQUU1QyxXQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDOUIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLFNBQVMsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9CLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDekIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNqQyxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7Z0JBQzVCLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNwQyxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDLE9BQXFCLEVBQUUsRUFBRTtnQkFDaEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDL0MsaUVBQWlFO2dCQUNqRSxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsS0FBSyxPQUFPLENBQUMsVUFBVTtvQkFBRSxPQUFPO2dCQUN4RCw2QkFBYSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNsRCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7UUFFTyxnQkFBZ0I7WUFDcEIsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQTRCLENBQUM7WUFDckQsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sS0FBSyxNQUFNLENBQUMsYUFBYTtnQkFBRSxPQUFPO1lBQ3JELElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFTyxhQUFhO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3BELENBQUM7UUFFRDs7V0FFRztRQUNJLG1CQUFtQjtZQUN0QixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBRU0sWUFBWTtZQUNmLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU8sY0FBYztZQUNsQixJQUFJO2dCQUNBLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxVQUFVLEtBQUssSUFBSSxDQUFDLGVBQWU7b0JBQUUsT0FBTztnQkFDaEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxlQUFlLEdBQUcsVUFBVSxDQUFDO2FBQ3JDO1lBQUMsT0FBTyxFQUFFLEVBQUU7Z0JBQ1QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3JDO1FBQ0wsQ0FBQztRQUVNLEdBQUcsQ0FBQyxTQUFzRDtZQUM3RCxTQUFTLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFTSxHQUFHLENBQUMsUUFBb0Q7WUFDM0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVNLE1BQU0sQ0FBQyxLQUFhO1lBQ3ZCLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDNUIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzFCLENBQUM7S0FDSjtJQTdHRCxnREE2R0M7SUFFRCxTQUFTLEtBQUssQ0FBQyxJQUFZO1FBQ3ZCLElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEMsR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDNUIsT0FBTyxHQUFHLENBQUMsVUFBeUIsQ0FBQztJQUN6QyxDQUFDO0lBRUQsU0FBUyxhQUFhLENBQUMsTUFBeUIsRUFBRSxFQUFVO1FBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQ2QsS0FBSyxDQUFDLHdDQUF3QyxFQUFFLGdCQUFnQixDQUFDLENBQ3BFLENBQUM7SUFDTixDQUFDOzs7OztJQ2pORCxNQUFNLGNBQWMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQztJQUVqRCxNQUFNLFlBQVksR0FBRzs7OztDQUlwQixDQUFDO0lBRUYsTUFBTSxVQUFVLEdBQUc7Ozs7Ozs7OztzQkFTRyxjQUFjOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBeUJuQyxDQUFDO0lBRUYscUJBQVMsQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDbkMscUJBQVMsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFFakMsTUFBYSxrQkFBa0I7UUFFM0IsVUFBVSxDQUFDLE1BQTBCO1lBQ2pDLE1BQU0sTUFBTSxHQUFHLENBQUMsUUFBZ0IsRUFBRSxJQUFZLEVBQUUsRUFBRTtnQkFDOUMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FDcEIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQzlCLENBQUM7Z0JBQ25CLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUMxQyxPQUFPLEtBQUssQ0FBQztZQUNqQixDQUFDLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxDQUFDLFVBQWtCLEVBQUUsRUFBRTtnQkFDbEMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FDcEIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxVQUFVLEVBQUUsQ0FBQyxDQUNoRCxDQUFDO2dCQUNuQixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDaEQsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNyRSxDQUFDLENBQUM7WUFFRixNQUFNLFNBQVMsR0FBNkIsRUFBRSxDQUFDO1lBRS9DLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtnQkFDbEMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNoRSxDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxTQUFTLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO2dCQUNyQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuRSxDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxTQUFTLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxPQUFxQixFQUFFLEVBQUU7Z0JBQ2hFLFNBQVMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEdBQUcsT0FBTyxDQUFDO2dCQUN6QyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hDLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLFNBQVMsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLE9BQXFCLEVBQUUsRUFBRTtnQkFDL0QsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUM3QyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztLQUNKO0lBeENELGdEQXdDQzs7Ozs7SUM1RkQsU0FBUyxRQUFRLENBQXFCLEVBQUssRUFBRSxJQUFJLEdBQUcsRUFBRTtRQUNsRCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixJQUFJLFFBQVEsR0FBRyxDQUFDLEdBQUcsSUFBUyxFQUFFLEVBQUU7WUFDNUIsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hCLENBQUMsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDO1FBQ0YsT0FBZ0IsUUFBUyxDQUFDO0lBQzlCLENBQUM7SUFFRCxTQUFTLEtBQUssQ0FDVixPQUF1QyxFQUN2QyxPQUFzQztRQUV0QyxJQUFJLENBQUMsT0FBTztZQUFFLE9BQU8sS0FBSyxDQUFDO1FBQzNCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSztZQUFFLE9BQU8sS0FBSyxDQUFDO1FBQ2pDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNoQixJQUFJLFFBQVEsQ0FBQyxhQUFhLEtBQUssT0FBTztZQUFFLE9BQU8sSUFBSSxDQUFDO1FBQ3BELElBQUksRUFBQyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsU0FBUyxDQUFBO1lBQUUsT0FBTyxLQUFLLENBQUM7UUFDdEMsUUFBUSxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQ3ZCLEtBQUssTUFBTTtnQkFDUCxPQUFPLENBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLENBQUM7b0JBQ3pDLEtBQUssQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsT0FBTyxDQUFDLENBQzdDLENBQUM7WUFDTjtnQkFDSSxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsc0JBQXNCLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDN0Q7SUFDTCxDQUFDO0lBRUQsTUFBYSx1QkFBdUI7UUFDaEMsVUFBVSxDQUFDLE1BQTBCO1lBQ2pDLE1BQU0saUJBQWlCLEdBQUc7Z0JBQ3RCLEtBQUssRUFBRSxHQUFHLEVBQUU7b0JBQ1IsTUFBTSxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQ2pDLENBQUM7Z0JBQ0QsS0FBSyxFQUFFLEdBQUcsRUFBRTtvQkFDUixNQUFNLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDakMsQ0FBQztnQkFDRCxPQUFPLEVBQUUsR0FBRyxFQUFFO29CQUNWLE1BQU0sRUFBRSxhQUFhLEVBQUUsR0FBRyxRQUFRLENBQUM7b0JBQ25DLElBQ0ksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLHNCQUFzQixFQUFFO3dCQUN6QyxTQUFTLEVBQUUsSUFBSTtxQkFDbEIsQ0FBQyxFQUNKO3dCQUNFLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUU7NEJBQ3hCLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO3lCQUM1QjtxQkFDSjtnQkFDTCxDQUFDO2dCQUNELFNBQVMsRUFBRSxHQUFHLEVBQUU7b0JBQ1osTUFBTSxFQUFFLGFBQWEsRUFBRSxHQUFHLFFBQVEsQ0FBQztvQkFDbkMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO2dCQUNuRSxDQUFDO2FBQ0osQ0FBQztZQUNGLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsRUFBRTtnQkFDbEQsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQy9CLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDckMsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUN2QixPQUFPO2lCQUNWO1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFDSCxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQ2hELHVDQUF1QztnQkFDdkMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNsQyxPQUFPLElBQUksQ0FBQyxNQUFNLEVBQUU7b0JBQ2hCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQWlCLENBQUM7b0JBQzNDLElBQUksQ0FBQyxNQUFNO3dCQUFFLE9BQU87b0JBRXBCLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUU7d0JBQ3JDLEtBQUssQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQzt3QkFDakMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLENBQUM7d0JBQzdCLE1BQU07cUJBQ1Q7b0JBQ0QsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTt3QkFDbkMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUNkLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO3dCQUM3QixNQUFNO3FCQUNUO2lCQUNKO1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLFdBQVcsR0FBRztnQkFDaEIsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtnQkFDckMsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUNaLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRTtvQkFDdkMsU0FBUyxFQUFFLE1BQU07aUJBQ3BCLENBQUM7YUFDVCxDQUFDO1lBRUYsSUFBSSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDcEQsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLEdBQUcsRUFBRTtnQkFDN0IsTUFBTSxrQkFBa0IsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3hELElBQUksa0JBQWtCLEtBQUssZ0JBQWdCO29CQUFFLE9BQU87Z0JBQ3BELE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDdEIsZ0JBQWdCLEdBQUcsa0JBQWtCLENBQUM7WUFDMUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFekIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFO2dCQUM5QyxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ3pCLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQy9CLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDdkIsT0FBTztpQkFDVjtnQkFDRCxVQUFVLEVBQUUsQ0FBQztZQUNqQixDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7S0FDSjtJQTlFRCwwREE4RUM7Ozs7O0lDcEdELFNBQWdCLHdCQUF3QixDQUFDLE9BR3hDO1FBQ0MsTUFBTSxFQUFFLFNBQVMsRUFBRSxLQUFLLEtBQWdCLE9BQU8sRUFBckIsZ0RBQXFCLENBQUM7UUFDaEQsTUFBTSxNQUFNLEdBQUcsSUFBSSx1Q0FBa0IsQ0FBQztZQUNwQyxLQUFLO1lBQ0wsTUFBTSxFQUFFO2dCQUNOLEtBQUssRUFBRSxtQkFBbUI7Z0JBQzFCLE1BQU0sRUFBRSxnQkFBZ0I7Z0JBQ3hCLE1BQU0sRUFBRSxnQkFBZ0I7Z0JBQ3hCLE9BQU8sRUFBRSxvQkFBb0I7YUFDOUI7U0FDRixDQUFDLENBQUM7UUFDSCxPQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUM1RCxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksaURBQXVCLEVBQUUsQ0FBQyxDQUFDO1FBQzFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBa0IsRUFBRSxDQUFDLENBQUM7UUFFckMsT0FBTyxNQUFvQyxDQUFDO0lBQzlDLENBQUM7SUFuQkQsNERBbUJDOzs7OztJQ3hCRCxTQUFTLFNBQVMsQ0FBQyxLQUFLLEdBQUcsSUFBSTtRQUMzQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRCxNQUFhLFlBQVk7UUFFckIsWUFDVyxPQU1OO1lBTk0sWUFBTyxHQUFQLE9BQU8sQ0FNYjtZQUVELElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUN2QixPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBSUQsTUFBTSxDQUFDLFdBQWdCO1lBQ25CLElBQUksT0FBTyxXQUFXLEtBQUssUUFBUTtnQkFBRSxXQUFXLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQztZQUN2RSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLG1CQUFtQixXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7Z0JBQzdCLFVBQVUsQ0FBQyxHQUFHLEVBQUU7b0JBQ1osSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRTt3QkFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7eUJBQ3BDO3dCQUNELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FDdEMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQzNDLENBQUM7d0JBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FDUCxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxVQUFVLEtBQUssQ0FBQyxNQUFNLFFBQVEsQ0FDbkQsQ0FBQzt3QkFDRixNQUFNLEVBQUUsY0FBYyxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQzt3QkFDeEMsSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLGNBQWMsRUFBRTs0QkFDL0IsS0FBSyxDQUFDLE1BQU0sQ0FDUixjQUFjLEVBQ2QsS0FBSyxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQ2hDLENBQUM7eUJBQ0w7d0JBQ0QsSUFBSSxDQUFDOzRCQUNELFdBQVcsRUFBRSxJQUFJLENBQUMsSUFBSTs0QkFDdEIsVUFBVSxFQUFFLFdBQVc7NEJBQ3ZCLEtBQUssRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7eUJBQ3pELENBQUMsQ0FBQztxQkFDTjtnQkFDTCxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25FLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztLQUNKO0lBOUNELG9DQThDQzs7Ozs7SUNoREQsZ1JBQWdSO0lBQ2hSLE1BQWEsa0JBQWtCO1FBRTNCO1lBQ0ksSUFBSSxDQUFDLElBQUksR0FBRyxvQkFBb0IsQ0FBQztRQUNyQyxDQUFDO1FBRU8sZUFBZSxDQUFDLElBQXdGO1lBQzVHLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxnQ0FDN0MsWUFBWSxLQUNmLE9BQU8sRUFBRSxZQUFZLENBQUMsSUFBSSxFQUMxQixHQUFHLEVBQUUsWUFBWSxDQUFDLFFBQVEsRUFDMUIsUUFBUSxFQUFFLElBQUksRUFDZCxZQUFZLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FDM0IsQ0FBQSxDQUFDLENBQUM7WUFDSixPQUFPO2dCQUNILFdBQVcsRUFBRSxJQUFJLENBQUMsSUFBSTtnQkFDdEIsVUFBVSxFQUFFLEVBQUU7Z0JBQ2QsS0FBSzthQUNSLENBQUM7UUFDTixDQUFDO1FBRU8sb0NBQW9DLENBQUMsSUFPNUM7WUFDRyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUMsZ0NBQzVDLFlBQVksS0FDZixPQUFPLEVBQUUsWUFBWSxDQUFDLE9BQU8sRUFDN0IsR0FBRyxFQUFFLFlBQVksQ0FBQyxPQUFPLEVBQ3pCLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUSxFQUMvQixZQUFZLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FDM0IsQ0FBQSxDQUFDLENBQUM7WUFDSixPQUFPO2dCQUNILFdBQVcsRUFBRSxJQUFJLENBQUMsSUFBSTtnQkFDdEIsVUFBVSxFQUFFLEVBQUU7Z0JBQ2QsS0FBSzthQUNSLENBQUM7UUFDTixDQUFDO1FBSUssTUFBTSxDQUFDLFdBQWdCOztnQkFDekIsSUFBSSxPQUFPLFdBQVcsS0FBSyxRQUFRO29CQUFFLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUErQixDQUFDLENBQUM7Z0JBQ3pGLE1BQU0sYUFBYSxHQUFHLE1BQU0sS0FBSyxDQUFDLDJGQUEyRixXQUFXLEVBQUUsQ0FBQyxDQUFDO2dCQUM1SSxNQUFNLFlBQVksR0FBRyxNQUFNLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDaEQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDcEQsUUFBUSxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUM7Z0JBQ2xDLE9BQU8sUUFBUSxDQUFDO1lBQ3BCLENBQUM7U0FBQTtRQUVLLE1BQU0sQ0FBQyxJQUFzQjs7Z0JBQy9CLE1BQU0sYUFBYSxHQUFHLE1BQU0sS0FBSyxDQUFDLHdHQUF3RyxJQUFJLENBQUMsT0FBTyx3QkFBd0IsQ0FBQyxDQUFDO2dCQUNoTCxNQUFNLFlBQVksR0FBRyxNQUFNLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDaEQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG9DQUFvQyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUN6RSxRQUFRLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQy9CLE9BQU8sUUFBUSxDQUFDO1lBQ3BCLENBQUM7U0FBQTtLQUVKO0lBOURELGdEQThEQzs7Ozs7SUM1REQsU0FBUyxRQUFRLENBQUMsSUFBWTtRQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLE9BQU8sS0FBSzthQUNQLEdBQUcsQ0FDQSxJQUFJLENBQUMsRUFBRSxDQUNILElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRTtZQUNsQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUN0QzthQUNBLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNuQixDQUFDO0lBRUQsU0FBUyxDQUNMLE1BQU0sRUFDTjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBOEJILENBQ0EsQ0FBQztJQUVGLFNBQVMsU0FBUyxDQUFDLFNBQWlCLEVBQUUsR0FBVztRQUM3QyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsU0FBUyxJQUFJLENBQUM7WUFDdkQsTUFBTSxvQkFBb0IsQ0FBQztRQUMvQixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzlDLEtBQUssQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQ2hCLEtBQUssQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDO1FBQ3RCLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFRCxTQUFTLFNBQVMsQ0FBQyxLQUFLLEdBQUcsSUFBSTtRQUMzQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRCxTQUFTLGdCQUFnQjtRQUNyQixNQUFNLElBQUksR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxTQUFTLGdCQUFnQjtRQUNyQixNQUFNLElBQUksR0FBRyxnREFBZ0QsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDekUsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxTQUFTLGtCQUFrQjtRQUN2QixNQUFNLElBQUksR0FBRyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEQsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxTQUFTLGFBQWE7UUFDbEIsT0FBTyxHQUFHLENBQUM7WUFDUCxTQUFTLEVBQUUsSUFBSSxnQkFBZ0IsRUFBRSxJQUFJLGdCQUFnQixFQUFFLElBQUksa0JBQWtCLEVBQUUsRUFBRSxDQUFDO0lBQzFGLENBQUM7SUFFRCxTQUFTLGlCQUFpQjtRQUN0QixNQUFNLEtBQUssR0FBc0I7WUFDN0IsU0FBUztZQUNULFVBQVU7WUFDVixNQUFNO1lBQ04sV0FBVztTQUNkLENBQUM7UUFDRixPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVELFNBQVMsY0FBYyxDQUFDLElBQUksR0FBRyxJQUFJO1FBQy9CLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQzthQUNiLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDUCxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDaEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNULEdBQUcsRUFBRSxNQUFNLEdBQUcsRUFBRTtZQUNoQixRQUFRLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQztZQUNwQyxZQUFZLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ25DLE9BQU8sRUFBRSxhQUFhLEVBQUU7U0FDM0IsQ0FBQyxDQUFDLENBQUM7SUFDWixDQUFDO0lBRUQsU0FBZ0IsR0FBRztRQUNmLElBQUk7WUFDQSxNQUFNLE1BQU0sR0FBRyxnQ0FBd0IsQ0FBQztnQkFDcEMsU0FBUyxFQUFFO29CQUNQLElBQUksMkJBQVksQ0FBQzt3QkFDYixFQUFFLEVBQUUsVUFBVTt3QkFDZCxRQUFRLEVBQUUsY0FBYyxDQUFDLEdBQUcsQ0FBQzt3QkFDN0IsS0FBSyxFQUFFLElBQUk7d0JBQ1gsY0FBYyxFQUFFLENBQUM7d0JBQ2pCLFNBQVMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7NEJBQ3RELEdBQUc7NEJBQ0gsWUFBWTs0QkFDWixRQUFROzRCQUNSLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDO3lCQUM3QixDQUFDO3FCQUNMLENBQUM7b0JBQ0YsSUFBSSwyQkFBWSxDQUFDO3dCQUNiLEVBQUUsRUFBRSxVQUFVO3dCQUNkLFFBQVEsRUFBRSxjQUFjLENBQUMsR0FBRyxDQUFDO3dCQUM3QixLQUFLLEVBQUUsR0FBRzt3QkFDVixjQUFjLEVBQUUsQ0FBQzt3QkFDakIsU0FBUyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQzs0QkFDdEQsR0FBRzs0QkFDSCxZQUFZOzRCQUNaLFFBQVE7NEJBQ1IsT0FBTyxFQUFFLE9BQU8sQ0FBQyxXQUFXLEVBQUU7eUJBQ2pDLENBQUM7cUJBQ0wsQ0FBQztvQkFDRixJQUFJLDJCQUFZLENBQUM7d0JBQ2IsRUFBRSxFQUFFLGFBQWE7d0JBQ2pCLFFBQVEsRUFBRSxjQUFjLENBQUMsRUFBRSxDQUFDO3dCQUM1QixLQUFLLEVBQUUsRUFBRTt3QkFDVCxjQUFjLEVBQUUsQ0FBQzt3QkFDakIsU0FBUyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQzs0QkFDdEQsR0FBRzs0QkFDSCxZQUFZOzRCQUNaLFFBQVE7NEJBQ1IsT0FBTyxFQUFFLE9BQU8sQ0FBQyxXQUFXLEVBQUU7eUJBQ2pDLENBQUM7cUJBQ0wsQ0FBQztvQkFDRixJQUFJLDJCQUFZLENBQUM7d0JBQ2IsRUFBRSxFQUFFLFVBQVU7d0JBQ2QsY0FBYyxFQUFFLENBQUM7d0JBQ2pCLFFBQVEsRUFBRSxjQUFjLENBQUMsR0FBRyxDQUFDO3dCQUM3QixLQUFLLEVBQUUsSUFBSTt3QkFDWCxTQUFTLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDOzRCQUN0RCxHQUFHOzRCQUNILFlBQVk7NEJBQ1osUUFBUTs0QkFDUixPQUFPLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBRTt5QkFDakMsQ0FBQztxQkFDTCxDQUFDO29CQUNGLElBQUksdUNBQWtCLEVBQUU7aUJBQzNCO2dCQUNELEtBQUssRUFBRSxHQUFHO2FBQ2IsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUFrQixFQUFFLENBQUMsQ0FBQztZQUVyQyxRQUFRLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFakUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQy9CLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ25DLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxJQUFzQixFQUFFLEVBQUU7Z0JBQ3ZELE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEMsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsRUFBRSxDQUFDLElBQXNCLEVBQUUsRUFBRTtnQkFDeEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDckMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3JCLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUMvQjtRQUFDLE9BQU8sRUFBRSxFQUFFO1lBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQ2pDO2dCQUFTO1lBQ04sRUFBRTtTQUNMO0lBQ0wsQ0FBQztJQWhGRCxrQkFnRkM7Ozs7O0lDOUxELFNBQWdCLEdBQUc7UUFDakIsSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUMsT0FBTztZQUFFLE9BQU87UUFFckIsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUN0QixPQUFPLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFjLEVBQUUsRUFBRTtZQUNsQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN6QixJQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzdDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDM0QsT0FBTyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2hELENBQUMsQ0FBQztJQUNKLENBQUM7SUFYRCxrQkFXQzs7Ozs7SUNYRCxTQUFnQixHQUFHO1FBQ2YsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUN4QixJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLFFBQVEsWUFBWSxDQUFDO1FBQ2hELElBQUksSUFBSSxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBc0JWLENBQUM7UUFFRixJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzdDLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRWxDLE1BQU0sQ0FBQyxTQUFTLElBQUk7Ozs7Ozs7S0FPbkIsQ0FBQztRQUVGLElBQUksTUFBTSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0MsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFbEMsTUFBTSxDQUFDLFNBQVMsR0FBRyxJQUFJO2FBQ2xCLEtBQUssQ0FBQyxHQUFHLENBQUM7YUFDVixHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDbEIsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQixTQUFTO2FBQ1IsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsOEJBQThCLElBQUksR0FBRyxHQUFHLGFBQWEsR0FBRyxZQUFZLENBQUM7YUFDaEYsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBR2hCLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUMsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQXJERCxrQkFxREM7SUFBQSxDQUFDOzs7OztJQzlDRixNQUFxQixNQUFNO1FBQTNCO1lBQ1UsV0FBTSxHQUEyQixFQUFFLENBQUM7UUFpQjlDLENBQUM7UUFmQyxTQUFTLENBQUMsS0FBYSxFQUFFLFFBQWtCO1lBQ3pDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUVqRCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFbEQsT0FBTztnQkFDTCxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQzthQUMvQyxDQUFDO1FBQ0osQ0FBQztRQUVELE9BQU8sQ0FBQyxLQUFhLEVBQUUsSUFBSSxHQUFHLEVBQUU7WUFDOUIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO2dCQUFFLE9BQU87WUFDaEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNqRCxDQUFDO0tBRUY7SUFsQkQseUJBa0JDO0lBRUQsU0FBZ0IsR0FBRztRQUNqQixJQUFJLEtBQUssR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ3pCLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM3RCxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBSkQsa0JBSUM7Ozs7O0lDZEQsSUFBSSxLQUFLLEdBQUcsSUFBSSxnQkFBSyxFQUFFLENBQUM7SUFFeEIsSUFBSSxNQUFNLEdBQUcsQ0FBQyxRQUFrQixFQUFFLEVBQUU7UUFDaEMsSUFBSSxNQUFNLEdBQXVCLEVBQUUsQ0FBQztRQUNwQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN0QyxNQUFNLENBQUMsSUFBSSxDQUFjLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3pDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQyxDQUFDO0lBRUYsSUFBSSxJQUFJLEdBQUc7Ozs7Q0FJVixDQUFDO0lBR0YsU0FBUyxRQUFRO1FBQ2IsbUNBQW1DO1FBQ25DLEtBQUssQ0FBQyxTQUFTLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1lBQ3hDLElBQUksUUFBUSxHQUF3QixRQUFRLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3hFLElBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFDOUIsSUFBSSxNQUFNLEdBQWUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUU5QyxJQUFJLEdBQUcsSUFBSSxNQUFNO2dCQUFFLE1BQU0sR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXJDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDdkIsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDO2dCQUNuQixJQUFJLE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLFdBQVcsRUFBRTtvQkFDdkMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7aUJBQzNEO3FCQUFNO29CQUNILElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTt3QkFDMUIsSUFBSSxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxRQUFRLEVBQUU7NEJBQ2pDLEtBQUssQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDO3lCQUN4Qzs2QkFBTTs0QkFDSCxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQzt5QkFDdkM7cUJBQ0o7eUJBQU07d0JBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO3FCQUM1RDtpQkFDSjtnQkFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNwQixRQUFRLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQzthQUN2QjtRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUVqRCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDL0QsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVqRyxDQUFDO0lBRUQsTUFBcUIsTUFBTTtRQUl2QixZQUFZLE9BQW9CO1lBQzVCLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sRUFBRTtnQkFDdkIsTUFBTSxFQUFFLElBQUksS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQzthQUM5QixDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNuQixDQUFDO1FBRUQsT0FBTztRQUNQLFVBQVUsQ0FBQyxHQUFHLEdBQUcsMkVBQTJFO1lBQ3hGLElBQUksS0FBSyxHQUFHLElBQUksMEJBQTBCLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3BELElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pCLE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxPQUFPO1FBQ1AsZUFBZSxDQUFDLEdBQUcsR0FBRyxvR0FBb0c7WUFDdEgsSUFBSSxLQUFLLEdBQUcsSUFBSSw0QkFBNEIsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsRCxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RCLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pCLE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxPQUFPO1FBQ1AsZUFBZSxDQUFDLEdBQUcsR0FBRyxvR0FBb0c7WUFDdEgsSUFBSSxLQUFLLEdBQUcsSUFBSSxZQUFZLENBQUMsR0FBRyxFQUFFO2dCQUM5QixJQUFJLEVBQUUsWUFBWSxDQUFDLGFBQWE7Z0JBQ2hDLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUM7YUFDbkMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekIsT0FBTyxLQUFLLENBQUM7UUFDakIsQ0FBQztRQUVELE9BQU87UUFDUCxVQUFVLENBQUMsR0FBRyxHQUFHLG9HQUFvRztZQUNqSCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXRDLElBQUksYUFBYSxHQUFnQyxFQUFFLENBQUM7WUFDcEQsYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLGlCQUFpQixFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFDaEUsYUFBYSxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUM7WUFDbEMsYUFBYSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7WUFDN0IsYUFBYSxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQztZQUNwQyxhQUFhLENBQUMsaUJBQWlCLEdBQUcsR0FBRyxDQUFDO1lBRXRDLElBQUksZUFBZSxHQUFHLElBQUksZUFBZSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRXpELEtBQUssQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLENBQUM7WUFFbkMsT0FBTyxLQUFLLENBQUM7UUFDakIsQ0FBQztRQUVELE9BQU87UUFDUCxDQUFDO0tBRUo7SUF6REQseUJBeURDO0lBR0QsU0FBZ0IsR0FBRztRQUVmLFFBQVEsRUFBRSxDQUFDO1FBRVgsSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4QyxJQUFJLEdBQUcsR0FBRyxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN6Qix3QkFBd0I7UUFDeEIsR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2pCLG1CQUFtQjtRQUNuQix3QkFBd0I7UUFDeEIsS0FBSyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFnQyxFQUFFLEVBQUU7WUFDOUQsSUFBSSxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksWUFBWSxFQUFFLENBQUMsQ0FBQztZQUM5QyxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsQ0FBQyxDQUFDLENBQUM7UUFFSCxLQUFLLENBQUMsU0FBUyxDQUFDLGNBQWMsRUFBRSxDQUFDLE1BQXdDLEVBQUUsRUFBRTtZQUN6RSxJQUFJLElBQUksR0FBRyxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQzVDLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QixHQUFHLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUN4QyxDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUMsTUFBa0IsRUFBRSxFQUFFO1lBQ2xELElBQUksSUFBSSxHQUFHLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDNUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxDQUFDO0lBRVAsQ0FBQztJQS9CRCxrQkErQkM7Ozs7SUNqS0QsT0FBUztRQUNMLGtCQUFrQixFQUFFO1lBQ2hCLE1BQU0sRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLElBQUk7U0FDckMsRUFBRSxZQUFZLEVBQUU7WUFDYjtnQkFDSSxTQUFTLEVBQUUsc0RBQXNEO2dCQUNqRSxVQUFVLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUUsa0JBQWtCLEVBQUU7Z0JBQ2hFLE9BQU8sRUFBRSxHQUFHO2dCQUNaLFlBQVksRUFBRTtvQkFDVixVQUFVLEVBQUUsT0FBTztvQkFDbkIsUUFBUSxFQUFFLEdBQUc7b0JBQ2IsT0FBTyxFQUFFLEdBQUc7b0JBQ1osWUFBWSxFQUFFLHNEQUFzRDtvQkFDcEUsV0FBVyxFQUFFLCtDQUErQztvQkFDNUQsWUFBWSxFQUFFLG1CQUFtQjtvQkFDakMsV0FBVyxFQUFFLGVBQWUsRUFBRSxNQUFNLEVBQUUsRUFBRTtvQkFDeEMsV0FBVyxFQUFFLEVBQUU7b0JBQ2YsWUFBWSxFQUFFLHNEQUFzRDtvQkFDcEUsT0FBTyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLEVBQUU7b0JBQ2pELFFBQVEsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsR0FBRztvQkFDbkQsVUFBVSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxFQUFFO29CQUMvQyxXQUFXLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLE1BQU07b0JBQ3pELE9BQU8sRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxFQUFFO29CQUM1RCxXQUFXLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRTtvQkFDOUQsUUFBUSxFQUFFLG1CQUFtQixFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRTtvQkFDckUsVUFBVSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxFQUFFO29CQUNyRCxXQUFXLEVBQUUsbUJBQW1CLEVBQUUsUUFBUSxFQUFFLGdCQUFnQjtvQkFDNUQsWUFBWSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLE9BQU87b0JBQ2xFLFdBQVcsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsS0FBSztvQkFDeEQsVUFBVSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUUsa0JBQWtCO29CQUNoRSxVQUFVLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsa0JBQWtCO29CQUMvRCxNQUFNLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLEVBQUUsQ0FBQyxpQkFBaUI7b0JBQ3JELE1BQU0sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLEVBQUUsa0JBQWtCO29CQUN0RCxRQUFRLEVBQUUsRUFBRTtpQkFDZjtnQkFDRCxRQUFRLEVBQUU7b0JBQ04sTUFBTSxFQUFFLENBQUMsa0JBQWtCO29CQUMzQixNQUFNLEVBQUUsa0JBQWtCO29CQUMxQixNQUFNLEVBQUUsQ0FBQyxrQkFBa0I7b0JBQzNCLE1BQU0sRUFBRSxrQkFBa0I7aUJBQzdCO2FBQ0o7U0FBQztLQUNULENBQUE7Ozs7SUMxQ0QsT0FBUztRQUNMLGFBQWEsRUFBRTtZQUNYO2dCQUNJLE1BQU0sRUFBRSwrQ0FBK0M7Z0JBQ3ZELFVBQVUsRUFBRSxrRUFBa0U7Z0JBQzlFLGNBQWMsRUFBRSxLQUFLO2FBQ3hCLEVBQUU7Z0JBQ0MsTUFBTSxFQUFFLG1FQUFtRTtnQkFDM0UsVUFBVSxFQUFFLHNFQUFzRTtnQkFDbEYsY0FBYyxFQUFFLEtBQUs7YUFDeEIsRUFBRTtnQkFDQyxNQUFNLEVBQUUsb0hBQW9IO2dCQUM1SCxVQUFVLEVBQUUsMEVBQTBFO2dCQUN0RixjQUFjLEVBQUUsS0FBSzthQUN4QjtTQUFDO0tBQ1QsQ0FBQzs7QUNmRixJQUFJLFFBQVEsR0FBRztJQUNYLE1BQU0sRUFBRTtRQUNKLEdBQUcsRUFBRSwyRkFBMkY7UUFDaEcsSUFBSSxFQUFFLEtBQUs7S0FDZDtJQUNELE1BQU0sRUFBRTtRQUNKLEdBQUcsRUFBRSwyRkFBMkY7UUFDaEcsSUFBSSxFQUFFLEtBQUs7S0FDZDtJQUNELE9BQU8sRUFBRTtRQUNMLFVBQVUsRUFBRSxVQUFVO1FBQ3RCLFdBQVcsRUFBRSxXQUFXO1FBQ3hCLGtCQUFrQixFQUFFLGtCQUFrQjtRQUN0QyxrQkFBa0IsRUFBRSxrQkFBa0I7UUFDdEMsT0FBTyxFQUFFLE1BQU07S0FDbEI7Q0FDSixDQUFBOzs7O0lDaEJELFNBQVMsV0FBVztRQUNsQixJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDO2FBQzVCLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO2FBQ25ELEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1QixPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVELE1BQU0sUUFBUSxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0EwRmhCLENBQUM7SUFLRixNQUFNLGlCQUFpQixHQUFHLENBQUMsQ0FBQztJQVE1QixTQUFTLEtBQUssQ0FDWixPQUF1QyxFQUN2QyxPQUFzQztRQUV0QyxJQUFJLENBQUMsT0FBTztZQUFFLE9BQU8sS0FBSyxDQUFDO1FBQzNCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSztZQUFFLE9BQU8sS0FBSyxDQUFDO1FBQ2pDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNoQixJQUFJLFFBQVEsQ0FBQyxhQUFhLEtBQUssT0FBTztZQUFFLE9BQU8sSUFBSSxDQUFDO1FBQ3BELElBQUksRUFBQyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsU0FBUyxDQUFBO1lBQUUsT0FBTyxLQUFLLENBQUM7UUFDdEMsUUFBUSxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQ3pCLEtBQUssTUFBTTtnQkFDVCxPQUFPLENBQ0wsS0FBSyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLENBQUM7b0JBQ3pDLEtBQUssQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsT0FBTyxDQUFDLENBQzNDLENBQUM7WUFDSjtnQkFDRSxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsc0JBQXNCLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDekQ7SUFDSCxDQUFDO0lBRUQsU0FBZSxPQUFPLENBQUMsT0FBb0IsRUFBRSxRQUFRLEdBQUcsR0FBRzs7WUFDekQsT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQ3ZCLFdBQVcsRUFDWCxZQUFZLFFBQVEsb0JBQW9CLENBQ3pDLENBQUM7WUFDRixNQUFNLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN0QixPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDbkIsQ0FBQztLQUFBO0lBRUQsU0FBUyxLQUFLLENBQUMsT0FBdUM7UUFDcEQsSUFBSSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsS0FBSztZQUFFLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN0QyxDQUFDO0lBRUQsU0FBZSxLQUFLLENBQUMsUUFBUSxHQUFHLElBQUk7O1lBQ2xDLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7Z0JBQy9CLFVBQVUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDN0IsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQUE7SUFFRDs7Ozs7T0FLRztJQUVILElBQUksTUFBTSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDN0MsTUFBTSxDQUFDLFNBQVMsR0FBRzs7Ozs7Ozs7O2dDQVNhLFdBQVcsRUFBRTsrQkFDZCxXQUFXLEVBQUU7NkJBQ2YsV0FBVyxFQUFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW9LekMsQ0FBQztJQUNGLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRWxDLFNBQVMsS0FBSyxDQUFDLElBQVk7UUFDekIsSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4QyxHQUFHLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM1QixPQUFPLEdBQUcsQ0FBQyxVQUF5QixDQUFDO0lBQ3ZDLENBQUM7SUFFRCxTQUFTLElBQUksQ0FBQyxLQUFhO1FBQ3pCLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVELFNBQXNCLEdBQUc7O1lBQ3ZCLE1BQU0saUJBQWlCLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsyQ0FrRWUsUUFBUTtpQkFDNUMsSUFBSSxFQUFFO2lCQUNOLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDO2lCQUN2QixPQUFPLENBQUMsV0FBVyxFQUFFLDBCQUEwQixDQUFDOzs7Q0FHdEQsQ0FBQztZQUNBLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3RDLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFxQixDQUFDO1lBQ2hFLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFxQixDQUFDO1lBQ2pFLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFxQixDQUFDO1lBQzNELElBQUksV0FBVyxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFtQixDQUFDO1lBRXpFLE1BQU0sWUFBWSxHQUFHLENBQUMsU0FBaUIsRUFBRSxFQUFFO2dCQUN6QyxPQUFPLDZDQUE2QyxTQUFTLG9HQUFvRyxDQUFDO1lBQ3BLLENBQUMsQ0FBQztZQUVGLE1BQU0sYUFBYSxHQUFHLENBQUMsU0FBaUIsRUFBRSxFQUFFLENBQzFDLHVCQUF1QixTQUFTLHNFQUFzRSxDQUFDO1lBRXpHLE1BQU0saUJBQWlCLEdBQUcsR0FBUyxFQUFFO2dCQUNuQyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUNwQixRQUFRLENBQUMsZ0JBQWdCLENBQUMscUJBQXFCLENBQUMsQ0FDaEMsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNO29CQUFFLE9BQU87Z0JBQzFCLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7Z0JBQzdELE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNsQixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLENBQUMsQ0FBQSxDQUFDO1lBRUYsSUFBSSxRQUFRLEdBQUcsRUFBOEIsQ0FBQztZQUU5QyxTQUFlLE1BQU0sQ0FBQyxVQUFrQixFQUFFLGVBQXVCOztvQkFDL0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsZUFBZSxHQUFHLENBQUMsQ0FBQztvQkFDbEQsSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUNwQyxJQUFJLENBQUMsUUFBUSxFQUFFO3dCQUNiLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQzs0QkFDeEQsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJOzRCQUNaLFFBQVEsRUFBRSxHQUFHLFVBQVUsSUFBSSxDQUFDLEVBQUU7eUJBQy9CLENBQUMsQ0FBQyxDQUFDO3dCQUNKLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxRQUFRLENBQUM7cUJBQ2pDO29CQUNELElBQUksV0FBVyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FDcEMsQ0FBQyxDQUFDLElBQUk7eUJBQ0gsS0FBSyxDQUFDLFFBQVEsQ0FBQzt5QkFDZixJQUFJLENBQ0gsQ0FBQyxDQUFDLEVBQUUsQ0FDRixDQUFDLENBQUMsQ0FBQzt3QkFDSCxDQUFDOzRCQUNDLGVBQWUsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUN2RSxDQUNKLENBQUM7b0JBQ0YsTUFBTSxLQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7b0JBQ3hELDBDQUEwQztvQkFDMUMsT0FBTyxXQUFXLENBQUM7Z0JBQ3JCLENBQUM7YUFBQTtZQUVELFNBQVMsS0FBSyxDQUNaLFVBQWtCLEVBQ2xCLFVBQXNCLEVBQ3RCLE1BQW9CO2dCQUVwQixJQUFJLE1BQTZCLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRTtvQkFDWixNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FDN0IsMEJBQTBCLFVBQVUsQ0FBQyxRQUFRLElBQUksQ0FDbEQsQ0FBQztpQkFDSDtnQkFDRCxJQUFJLENBQUMsTUFBTSxFQUFFO29CQUNYLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUN2QyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUU7d0JBQ1osTUFBTSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztxQkFDbEQ7eUJBQU07d0JBQ0wsV0FBVyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztxQkFDakM7b0JBQ0QsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO29CQUM3QyxNQUFNLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQztvQkFDMUIsV0FBVyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7b0JBQ3pDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO3dCQUNwQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQ25CLFFBQVEsRUFBRSxDQUFDO29CQUNiLENBQUMsQ0FBQyxDQUFDO29CQUNILE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO3dCQUNwQyxNQUFNLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3RELENBQUMsQ0FBQyxDQUFDO29CQUNILE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO3dCQUNuQyxNQUFNLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3pELENBQUMsQ0FBQyxDQUFDO2lCQUNKO2dCQUVELElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUV2QyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUM7Z0JBQzVDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO2dCQUNwQixNQUFNLENBQUMsU0FBUyxHQUFHLGVBQWUsVUFBVSxFQUFFLENBQUM7Z0JBQy9DLE1BQU0sQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQztnQkFDL0IsTUFBTSxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUNuQyxPQUFPLE1BQU0sQ0FBQztZQUNoQixDQUFDO1lBRUQsU0FBUyxNQUFNLENBQUMsVUFBc0I7Z0JBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFFRCxTQUFTLFFBQVE7Z0JBQ2YsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ2pCLFdBQVcsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO2dCQUMzQixLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDaEIsQ0FBQztZQUVELElBQUksZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO1lBQzFCLE1BQU0sa0JBQWtCLEdBQUcsR0FBRyxFQUFFO2dCQUM5QixJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO2dCQUM5QixJQUFJLGdCQUFnQixLQUFLLFdBQVc7b0JBQUUsT0FBTztnQkFDN0MsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDO2dCQUMvQixJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLGlCQUFpQixFQUFFO29CQUMxQyxPQUFPLENBQUMsMEJBQTBCO2lCQUNuQztnQkFFRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQ2hCLENBQUMsV0FBVyxFQUFFLGNBQWMsRUFBRSxlQUFlLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBTSxZQUFZLEVBQUMsRUFBRTtvQkFDdEUsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUNwQyxJQUFJLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUMsWUFBWSxVQUFVLEVBQUUsQ0FBQyxDQUFDO29CQUN2RSxJQUFJLENBQUMsaUJBQWlCLEVBQUU7d0JBQ3RCLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQzt3QkFDckQsV0FBVyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO3dCQUMzQyxJQUFJLGFBQWEsR0FBRyxLQUFLLENBQ3ZCLHdCQUF3QixVQUFVLEtBQUssWUFBWSxRQUFRLENBQzVELENBQUM7d0JBQ0YsV0FBVyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztxQkFDeEM7eUJBQU07d0JBQ0wsb0RBQW9EO3dCQUNwRCxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7NEJBQzNDLEtBQUssQ0FBQyxJQUFJLENBQ1IsTUFBTSxDQUFDLGdCQUFnQixDQUFDLElBQUksUUFBUSxJQUFJLFVBQVUsRUFBRSxDQUFDLENBQ3RELENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQzt3QkFDdkQsQ0FBQyxDQUFDLENBQUM7cUJBQ0o7b0JBQ0QsSUFBSSxhQUFhLEdBQUcsaUJBQWlCLENBQUMsa0JBQWlDLENBQUM7b0JBRXhFLGFBQWEsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUMzQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUMvQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUV4QyxJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDOUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRTt3QkFDekIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUU7NEJBQ3ZCLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQzs0QkFDdkIsaUJBQWlCLENBQUMsTUFBTSxFQUFFLENBQUM7eUJBQzVCO3dCQUNELFdBQVcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7NEJBQy9CLEtBQUssQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLGFBQWEsQ0FBQyxDQUFDO3dCQUMvQyxDQUFDLENBQUMsQ0FBQzt3QkFDSCxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUMzQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUM1QyxhQUFhLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDeEMsb0RBQW9EO3dCQUNwRCxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7NEJBQzNDLEtBQUssQ0FBQyxJQUFJLENBQ1IsTUFBTSxDQUFDLGdCQUFnQixDQUFDLElBQUksUUFBUSxJQUFJLFVBQVUsY0FBYyxDQUFDLENBQ2xFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO2dDQUNmLE9BQU8sQ0FBQyxJQUFtQixDQUFDLENBQUM7NEJBQy9CLENBQUMsQ0FBQyxDQUFDO3dCQUNMLENBQUMsQ0FBQyxDQUFDO29CQUNMLENBQUMsQ0FBQyxDQUFDO29CQUNILE9BQU8sT0FBTyxDQUFDO2dCQUNqQixDQUFDLENBQUEsQ0FBQyxDQUNILENBQUM7WUFDSixDQUFDLENBQUM7WUFFRixNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsR0FBUyxFQUFFO2dCQUNyQyxJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBZSxDQUFDO2dCQUN0RCxJQUFJO29CQUNGLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUM1QixLQUFLO3lCQUNGLGFBQWEsQ0FBQyxLQUFLLENBQUM7eUJBQ3BCLEtBQUssQ0FBQyxXQUFXLENBQ2hCLFdBQVcsRUFDWCx3Q0FBd0MsQ0FDekMsQ0FBQztvQkFDSixLQUFLLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ3ZDLE1BQU0sa0JBQWtCLEVBQUUsQ0FBQztpQkFDNUI7d0JBQVM7b0JBQ1IsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDOUQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQy9CLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztpQkFDckM7WUFDSCxDQUFDLENBQUEsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUVSLE1BQU0sV0FBVyxHQUFHO2dCQUNsQixTQUFTLEVBQUUsR0FBRyxFQUFFLENBQ2QsS0FBSyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsQ0FBQztnQkFDN0QsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUU7YUFDekIsQ0FBQztZQUVGLE1BQU0saUJBQWlCLEdBQUc7Z0JBQ3hCLEtBQUssRUFBRSxHQUFHLEVBQUU7b0JBQ1YsSUFBSSxFQUFFLGFBQWEsRUFBRSxHQUFHLFFBQVEsQ0FBQztvQkFDakMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUN2QixDQUFDO2dCQUNELEtBQUssRUFBRSxHQUFHLEVBQUU7b0JBQ1YsSUFBSSxFQUFFLGFBQWEsRUFBRSxHQUFHLFFBQVEsQ0FBQztvQkFDakMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUN2QixDQUFDO2dCQUNELE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ1osSUFBSSxFQUFFLGFBQWEsRUFBRSxHQUFHLFFBQVEsQ0FBQztvQkFDakMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsc0JBQXNCLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRTt3QkFDckUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7NEJBQ2hCLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQzt5QkFDaEI7cUJBQ0Y7Z0JBQ0gsQ0FBQztnQkFDRCxTQUFTLEVBQUUsR0FBRyxFQUFFO29CQUNkLElBQUksRUFBRSxhQUFhLEVBQUUsR0FBRyxRQUFRLENBQUM7b0JBQ2pDLEtBQUssQ0FBQyxhQUFhLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDakUsQ0FBQzthQUNGLENBQUM7WUFFRixXQUFXLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFO2dCQUM1QyxJQUFJLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDakMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNyQyxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3ZCLE9BQU87aUJBQ1I7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUVILEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO2dCQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQy9CLENBQUMsQ0FBQyxDQUFDO1lBRUgsS0FBSyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsRUFBRTtnQkFDdEMsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUMzQixXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUMvQixLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3ZCLE9BQU87aUJBQ1I7Z0JBQ0QsVUFBVSxFQUFFLENBQUM7WUFDZixDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO2dCQUNwQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdkIsQ0FBQyxDQUFDLENBQUM7WUFFSCxRQUFRLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUU3RCxLQUFLLENBQUMsS0FBSyxHQUFHLFlBQVksQ0FBQztZQUMzQixNQUFNLFVBQVUsRUFBRSxDQUFDO1lBQ25CLGlCQUFpQixFQUFFLENBQUM7WUFFcEIsTUFBTSxZQUFZLEdBQUc7Z0JBQ25CLE1BQU0sRUFBRSxHQUFHLEVBQUU7b0JBQ1gsUUFBUSxFQUFFLENBQUM7Z0JBQ2IsQ0FBQzthQUNGLENBQUM7WUFFRixNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFO2dCQUN2QyxJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzVCLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ2hDLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDdkIsT0FBTztpQkFDUjtxQkFBTTtvQkFDTCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDekI7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FBQTtJQTVVRCxrQkE0VUM7O0FDcnFCRDs7Ozs7Ozs7R0FRRzs7OztJQXFCSCxJQUFJLGVBQWUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsR0FBRyxJQUFJLGVBQWUsQ0FBQyxxRkFBcUYsQ0FBQyxDQUFDO0lBRW5LOztPQUVHO0lBQ0gsSUFBSSxVQUFVLEdBQUcsQ0FBQyxNQUFrQixFQUFFLEVBQUU7UUFFcEMsSUFBSSxDQUFDLEdBQUcsSUFBSSxRQUFRLEVBQUUsQ0FBQztRQUV2QixNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQVUsRUFBRSxFQUFFO1lBRXZDLElBQUksUUFBUSxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMzQyxJQUFJLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDM0MsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUUxQyxNQUFNLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUvQyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BVzlCLEVBQUUsRUFBRTtnQkFDRCxJQUFJLGFBQWEsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3RSxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUM7Z0JBQ2pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRTtvQkFBRSxRQUFRLElBQUksYUFBYSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRTdHLENBQUMsQ0FBQyxPQUFPLENBQUM7b0JBQ04sUUFBUSxFQUFFLFFBQVE7aUJBQ3JCLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsQ0FBQztJQUNiLENBQUMsQ0FBQTtJQUVELFNBQWdCLEdBQUc7UUFFZixJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUU7WUFDckIsT0FBTyxFQUFFLFdBQVc7WUFDcEIsTUFBTSxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO1lBQ3ZCLElBQUksRUFBRSxFQUFFO1NBQ1gsQ0FBQyxDQUFDO1FBRUgsSUFBSSxRQUFRLEdBQUcsSUFBSSxRQUFRLENBQUM7WUFDeEIsR0FBRyxFQUFFLEdBQUc7WUFDUixZQUFZLEVBQUUsTUFBTTtTQUN2QixDQUFDLENBQUM7UUFFSCxJQUFJLFdBQVcsR0FBRyxJQUFJLFdBQVcsQ0FBQztZQUM5QixHQUFHLEVBQUUsR0FBRztZQUNSLHFCQUFxQixFQUFFLElBQUk7WUFDM0IsZUFBZSxFQUFFLEtBQUssQ0FBQyxhQUFhO1lBQ3BDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxNQUFNO1NBQ2xDLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBRzNDLFdBQVcsQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUMsSUFJOUIsRUFBRSxFQUFFO1lBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDN0IsUUFBUSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRTtnQkFDeEIsS0FBSyxPQUFPO29CQUNSLE1BQU07Z0JBQ1YsS0FBSyxVQUFVO29CQUNYLGtCQUFrQjtvQkFDbEIsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBMEIsRUFBRSxFQUFFO3dCQUNuRSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQzFDLENBQUMsQ0FBQyxDQUFDO29CQUVILHdCQUF3QjtvQkFDeEIsSUFBSSxPQUFPLEdBQUcsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO29CQUN0QyxPQUFPLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztvQkFDekIsT0FBTyxDQUFDLFNBQVMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDcEMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUEyQixFQUFFLEVBQUU7d0JBQzdELE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUM1QyxPQUFPLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzt3QkFDeEIsZUFBZSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUEyQixFQUFFLEVBQUU7NEJBQzdELE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUNsRCxDQUFDLENBQUMsQ0FBQTtvQkFDTixDQUFDLENBQUMsQ0FBQztvQkFFSCxNQUFNO2dCQUNWO29CQUNJLE1BQU07YUFDYjtZQUNELElBQUksS0FBSyxFQUFFO2dCQUNQLElBQUksTUFBTSxHQUFHLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDcEMsTUFBTSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQ3ZCLE1BQU0sQ0FBQyxzQkFBc0IsR0FBRyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7Z0JBQ3JELE1BQU0sQ0FBQyxVQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3BDLE1BQU0sQ0FBQyxtQkFBbUIsR0FBRyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7Z0JBQ2xELE1BQU0sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdkIsTUFBTSxDQUFDLElBQUksR0FBRyxlQUFlLENBQUMsVUFBVSxDQUFDO2dCQUN6QyxlQUFlLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLGtCQUE4QixFQUFFLEVBQUU7b0JBQzlELElBQUksTUFBTSxHQUFHLElBQUksZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLElBQUksZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLElBQUksS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNqTCxJQUFJLFFBQVEsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDbkUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9DLENBQUMsQ0FBQyxDQUFDO2FBQ047UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBckVELGtCQXFFQzs7QUM1SUQsb0NBQW9DO0FBQ3BDLG9HQUFvRztBQUNwRyxnQ0FBZ0M7Ozs7SUErQmhDLElBQUksTUFBTSxHQUFHO1FBQ1QsS0FBSyxFQUFFLENBQUM7Z0JBQ0osSUFBSSxFQUFFLEtBQUs7Z0JBQ1gsS0FBSyxFQUFFLElBQUksS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFDLEVBQUUsRUFBQyxFQUFFLENBQUMsQ0FBQzthQUNoQyxFQUFDO2dCQUNFLElBQUksRUFBRSxPQUFPO2dCQUNiLEtBQUssRUFBRSxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBQyxHQUFHLEVBQUMsRUFBRSxDQUFDLENBQUM7YUFDaEMsRUFBQztnQkFDRSxJQUFJLEVBQUUsTUFBTTtnQkFDWixLQUFLLEVBQUUsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUMsRUFBRSxFQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ2hDLENBQUM7S0FDTCxDQUFDO0lBRUYsU0FBUyxPQUFPLENBQXdCLENBQXNCO1FBQzFELElBQUksQ0FBQyxHQUFhLEVBQUUsQ0FBQztRQUVyQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMvQixDQUFDLENBQUMsSUFBSSxDQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3JCO1FBRUQsT0FBTyxDQUFDLENBQUM7SUFDYixDQUFDO0lBQUEsQ0FBQztJQUVGLFNBQWdCLFNBQVMsQ0FBQyxTQUFzQixFQUFFLE1BSWpEO1FBRUcsSUFBSSxPQUFPLEdBQUcsSUFBSSxZQUFZLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRWxELE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1lBRTdCLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ2hELE9BQU8sQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO3dCQUNoRCxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLE1BQU0sQ0FBQyxDQUFDO3dCQUN4QyxPQUFPLENBQUMsYUFBYSxFQUFFLENBQUM7d0JBQ3hCLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDM0IsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVMLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtvQkFDM0QsT0FBTyxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTt3QkFDckQsUUFBUSxDQUFDO3dCQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO3dCQUNuQyxPQUFPLENBQUMsYUFBYSxFQUFFLENBQUM7d0JBQ3hCLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDM0IsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUVULENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQTVCRCw4QkE0QkM7SUFFRDs7TUFFRTtJQUNGLE1BQU0sWUFBWTtRQU9kLFlBQW1CLFNBQXNCLEVBQVMsTUFJakQ7WUFKa0IsY0FBUyxHQUFULFNBQVMsQ0FBYTtZQUFTLFdBQU0sR0FBTixNQUFNLENBSXZEO1lBVE8sYUFBUSxHQUFHLHdEQUF3RCxDQUFDO1lBVXhFLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzRCxZQUFZLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVELElBQUksTUFBTTtZQUNOLE9BQW9CLElBQUksQ0FBQyxTQUFTLENBQUMsc0JBQXNCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0UsQ0FBQztRQUVELElBQUksUUFBUTtZQUNSLE9BQW9CLElBQUksQ0FBQyxTQUFTLENBQUMsc0JBQXNCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0UsQ0FBQztRQUVELGFBQWE7WUFDVCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFO2dCQUN6QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ2pDO1FBQ0wsQ0FBQztRQUVELFlBQVk7WUFDUixJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFMUUsSUFBSSxDQUFDLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRTtnQkFDckIsTUFBTSxDQUFDLFNBQVMsSUFBSSxHQUFHLENBQUM7WUFDNUIsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRVQsSUFBSSxZQUFZLEdBQUcsQ0FBQyxJQUFZLEVBQUUsRUFBRTtnQkFDaEMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2xDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsSUFBSSxHQUFHLFFBQVEsQ0FBQztnQkFDbkMsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDeEIsQ0FBQyxDQUFDO1lBRUYsSUFBSSxZQUFZLEdBQUcsR0FBRyxFQUFFO2dCQUNwQixhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pCLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25DLENBQUMsQ0FBQTtZQUVELFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQy9CLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7aUJBQzVDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ1AsWUFBWSxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQy9CLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUU7cUJBQ2pDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtvQkFFWCxZQUFZLEVBQUUsQ0FBQztvQkFFZixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7d0JBQ3JCLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO3FCQUNuQztvQkFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTt3QkFDekIscUJBQXFCO3dCQUNyQjs0QkFDSSxJQUFJLFNBQVMsR0FBZ0IsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7NEJBQzNFLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDOzRCQUNuQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7eUJBQ3RGO3dCQUNELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLEtBQUssQ0FBQyxVQUFVLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNuSCxDQUFDLENBQUMsQ0FBQztvQkFFSCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBRWpCLENBQUMsQ0FBQztxQkFDRCxLQUFLLENBQUMsR0FBRyxFQUFFO29CQUNSLE1BQU0sR0FBRyxHQUFHLHNCQUFzQixDQUFDO29CQUNuQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDOUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNsQixhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2pCLE1BQU0sR0FBRyxDQUFDO2dCQUNkLENBQUMsQ0FBQyxDQUFDO1lBQ1gsQ0FBQyxDQUFDO2lCQUNELEtBQUssQ0FBQyxHQUFHLEVBQUU7Z0JBQ1IsTUFBTSxHQUFHLEdBQUcsd0JBQXdCLENBQUM7Z0JBQ3JDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM5QyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2xCLE1BQU0sR0FBRyxDQUFDO1lBQ2QsQ0FBQyxDQUFDLENBQUM7UUFFWCxDQUFDO1FBRUQsVUFBVSxDQUFDLEdBQTBDO1lBQ2pELElBQUksTUFBTSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO2dCQUN2QyxTQUFTLEVBQUUsbUJBQW1CO2dCQUM5QixTQUFTLEVBQUUsR0FBRyxDQUFDLElBQUk7YUFDdEIsQ0FBQyxDQUFDO1lBQ0gsRUFBRSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDekMsWUFBWSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFTyxLQUFLO1lBQ1QsSUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFtQixRQUFRLENBQUMsc0JBQXNCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNyRixRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUVqQixJQUFJLElBQUksR0FBRyxHQUFHLEVBQUU7b0JBQ1osSUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7b0JBQ2pFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbkYsQ0FBQyxDQUFDO2dCQUNGLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2xDLElBQUksRUFBRSxDQUFDO1lBRVgsQ0FBQyxDQUFDLENBQUE7UUFDTixDQUFDO1FBR08sZUFBZSxDQUFDLFNBQXFDO1lBQ3pELE9BQU8sR0FBRyxTQUFTLENBQUMsWUFBWSxLQUFLLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUN4RCxDQUFDO1FBRU8sb0JBQW9CLENBQUMsRUFBVSxFQUFFLEdBQVEsRUFBRSxLQUE2QixFQUFFLE1BQU0sR0FBRyxNQUFNO1lBQzdGLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQSxFQUFFLENBQUEsQ0FBQyxDQUFDLElBQUksS0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RCxJQUFJLE1BQU0sR0FBRyxJQUFJLGtCQUFrQixDQUFDO2dCQUNoQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ25CLE1BQU0sRUFBRSxFQUFFO2dCQUNWLFNBQVMsRUFBRSxDQUFDO2dCQUNaLFNBQVMsRUFBRSxDQUFDO2dCQUNaLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixPQUFPLEVBQUUsa0JBQWtCLENBQUMsWUFBWTtnQkFDeEMsU0FBUyxFQUFFO29CQUNQLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSztvQkFDbkIsT0FBTyxFQUFFLENBQUM7b0JBQ1YsTUFBTSxFQUFFLFNBQVM7b0JBQ2pCLE9BQU8sRUFBRSxjQUFjO2lCQUMxQjthQUNKLENBQUMsQ0FBQztZQUVILDZCQUE2QjtZQUM3Qiw4QkFBOEI7WUFDOUIsZUFBZTtZQUNmLDZCQUE2QjtZQUM3Qiw2QkFBNkI7WUFDN0IsNEJBQTRCO1lBQzVCLFFBQVE7WUFDUixLQUFLO1lBRUwsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO1lBRXJCLElBQUksVUFBVSxHQUFHLElBQUksZ0JBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6RSxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7WUFFekIsSUFBSSxXQUFXLEdBQUcsUUFBUSxDQUFDLEdBQUcsRUFBRTtnQkFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO2dCQUN6QyxJQUFJLFVBQVUsR0FBaUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2xHLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsWUFBWSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDckQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtvQkFDNUUsT0FBTyxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzFELENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRVIsSUFBSSxZQUFZLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUV0QyxJQUFJLFdBQVcsR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO1lBRXBDLFdBQVcsQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7WUFDckMsV0FBVyxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQztZQUNyQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTztZQUU5QixJQUFJLENBQUMsR0FBRyxJQUFJLGdCQUFnQixDQUFDO2dCQUN6QixHQUFHLEVBQUUsR0FBRztnQkFDUixZQUFZLEVBQUUsK0ZBQStGO2dCQUM3RyxnR0FBZ0c7Z0JBQ2hHLE9BQU8sRUFBRSxLQUFLO2dCQUNkLFlBQVksRUFBRSxLQUFLO2dCQUNuQixTQUFTLEVBQUUsS0FBSztnQkFDaEIsYUFBYSxFQUFFLEtBQUs7Z0JBQ3BCLHVCQUF1QixFQUFFLEtBQUs7Z0JBQzlCLHNCQUFzQixFQUFFLEtBQUs7Z0JBQzdCLFFBQVEsRUFBRSxLQUFLO2dCQUNmLGtCQUFrQixFQUFFLEtBQUs7Z0JBQ3pCLGVBQWUsRUFBRSxLQUFLO2dCQUN0Qix5QkFBeUIsRUFBRSxLQUFLO2dCQUNoQyxzQkFBc0IsRUFBRSxLQUFLO2dCQUM3QixhQUFhLEVBQUUsS0FBSztnQkFDcEIsaUJBQWlCLEVBQUUsS0FBSztnQkFDeEIscUJBQXFCLEVBQUUsS0FBSztnQkFDNUIsVUFBVSxFQUFPLE1BQU07Z0JBQ3ZCLFVBQVUsRUFBTyxNQUFNO2dCQUN2QixRQUFRLEVBQU8sTUFBTTtnQkFDckIsZUFBZSxFQUFPLE1BQU07Z0JBQzVCLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2pDLFdBQVcsRUFBRSxVQUFVO2dCQUN2QixXQUFXLEVBQUUsV0FBVztnQkFDeEIsS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsaUJBQWlCLEVBQUUsWUFBWTthQUNsQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRVAsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdEIsQ0FBQyxDQUFDLGVBQWUsR0FBRyxHQUFHLEVBQUU7Z0JBQ3JCLGNBQWM7WUFDbEIsQ0FBQyxDQUFDO1lBRUYsSUFBSSxXQUFXLEdBQWlCLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBUSxDQUFDLHNCQUFzQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pHLFdBQVcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXBDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUd0QixFQUFFLEVBQUU7Z0JBQ0gsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMzRCxJQUFJLElBQUksR0FBUSxTQUFTLENBQUM7Z0JBQzFCLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUM7Z0JBQ3RFLElBQUksR0FBRyx1RkFBdUYsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBRTFHLElBQUksSUFBSSxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUVwRixJQUFJLFFBQVEsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLGdGQUFnRixDQUFDLENBQUM7Z0JBQ3BILEVBQUUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBRXBGLElBQUksUUFBUSxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztnQkFDbEUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFM0IsT0FBTyxJQUFJLENBQUM7WUFDaEIsQ0FBQyxDQUFDLENBQUM7WUFFSCxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBMEMsRUFBRSxFQUFFO2dCQUNqRSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN4QyxDQUFDLENBQUMsQ0FBQztZQUVILENBQUMsQ0FBQyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFVLEVBQUUsRUFBRTtZQUN6QyxDQUFDLENBQUMsQ0FBQztZQUVILENBQUMsQ0FBQyxFQUFFLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO2dCQUMxQixFQUFFO1lBQ04sQ0FBQyxDQUFDLENBQUM7WUFFSCxDQUFDLENBQUMsRUFBRSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtnQkFDMUIsaUJBQWlCO1lBQ3JCLENBQUMsQ0FBQyxDQUFDO1lBRUgsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7Z0JBQzNCLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQ2pFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBTSxFQUFDLENBQUMsRUFBRSxFQUFFO29CQUN6QixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDMUMsSUFBSSxTQUFTLEVBQUU7d0JBQ1gsZ0VBQWdFO3dCQUNoRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7cUJBQ3RGO2dCQUNMLENBQUMsQ0FBQyxDQUFBO1lBQ04sQ0FBQyxDQUFDLENBQUM7WUFFSCxDQUFDLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtnQkFDM0IsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUMsc0JBQXNCLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO2dCQUM3RixNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQy9FLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQ2YsSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDMUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQzlCLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZCLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxDQUFDLENBQUM7WUFFSCxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFWjtnQkFDSSxJQUFJLGNBQWMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN0RCxjQUFjLENBQUMsU0FBUyxHQUFHLG1CQUFtQixDQUFDO2dCQUMvQyxjQUFjLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQztnQkFDdEMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyRSxNQUFNLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUNuQyxjQUFjLENBQUMsT0FBTyxHQUFHLEdBQUcsRUFBRTtvQkFDMUIsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNWLElBQUksQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7d0JBQ3hELEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDO3dCQUN0QixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7d0JBQ3BCLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO3dCQUNiLFFBQVEsRUFBRSxDQUFDO29CQUNmLENBQUMsQ0FBQyxDQUFDO2dCQUNQLENBQUMsQ0FBQzthQUNMO1lBRUQsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO2dCQUNkLElBQUksU0FBUyxHQUFrQixDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUM1QyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ1YsU0FBUyxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxJQUF1QixFQUFFLEVBQUU7b0JBQ3BELElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssb0JBQW9CLEVBQUU7d0JBQ3hDLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDeEQsSUFBSSxTQUFTLEVBQUU7NEJBQ1gsSUFBSSxNQUFNLEdBQUcsSUFBSSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7NEJBRXZELGdFQUFnRTs0QkFDaEUsSUFBSSxTQUFTLENBQUMsbUJBQW1CLEVBQUU7Z0NBQy9CLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFJLEdBQUcsQ0FBQztnQ0FDdEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUMsR0FBRyxFQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7NkJBQ25EOzRCQUNELENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7eUJBQ3ZCO3FCQUNKO2dCQUNMLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLFFBQVEsR0FBRyxHQUFHLEVBQUU7Z0JBRWhCLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQ2hGLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUMzQixPQUFPO3dCQUNILElBQUksRUFBRSxHQUFHO3dCQUNULFNBQVMsRUFBRSxDQUFDO3dCQUNaLE9BQU8sRUFBRSxJQUFJLE9BQU8sQ0FBQzs0QkFDakIsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFROzRCQUNwQixVQUFVLEVBQUU7Z0NBQ1IsS0FBSyxFQUFFLEdBQUc7Z0NBQ1YsU0FBUyxFQUFFLENBQUM7NkJBQ2Y7eUJBQ0osQ0FBQztxQkFDTCxDQUFDO2dCQUNOLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFUixDQUFDLENBQUM7WUFFRixRQUFRLEVBQUUsQ0FBQztZQUVYLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVoQyxLQUFLLENBQUMsU0FBUyxDQUFDLGtCQUFrQixFQUFFLENBQUMsTUFBVyxFQUFFLEtBQVUsRUFBRSxJQUFhLEVBQUUsTUFBc0UsRUFBRSxDQUFhLEVBQUUsRUFBRTtnQkFDbEssSUFBSSxPQUFPLEdBQXFCLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzNFLElBQUksT0FBTyxJQUFJLENBQUMsRUFBRTtvQkFDZCxJQUFJLEtBQUssR0FBcUIsUUFBUSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDekUsSUFBSSxPQUFPLEtBQUssS0FBSyxFQUFFO3dCQUNuQixXQUFXLEVBQUUsQ0FBQzt3QkFDZCxPQUFPO3FCQUNWO29CQUNELElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyRCxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ3pELElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzVCLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDO29CQUNuRCxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDNUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUMxQixVQUFVLENBQUMsR0FBRyxFQUFFO3dCQUNaLE9BQU8sQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO3dCQUNuQixPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTs0QkFDdEIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDN0IsQ0FBQyxDQUFDLENBQUM7d0JBQ0gsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7d0JBQ2pCLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFOzRCQUNwQiwrQkFBK0I7NEJBQy9CLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7d0JBQzNCLENBQUMsQ0FBQyxDQUFDO29CQUNQLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztpQkFDVjtxQkFBTTtvQkFDSCxJQUFJLEtBQUssR0FBcUIsUUFBUSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDekUsSUFBSSxDQUFDLEtBQUssS0FBSzt3QkFBRSxXQUFXLEVBQUUsQ0FBQztpQkFDbEM7WUFDTCxDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sQ0FBQyxDQUFDO1FBQ2IsQ0FBQztRQUVPLGFBQWEsQ0FBQyxLQUE2QjtZQUMvQyxPQUFPO21GQUNvRSxLQUFLLENBQUMsVUFBVTtpQkFDbEYsS0FBSyxDQUFDLGdCQUFnQixJQUFJLEtBQUssQ0FBQyxVQUFVO3VCQUNwQyxLQUFLLENBQUMsVUFBVSxnQkFBZ0IsQ0FBQztRQUNwRCxDQUFDO0tBQ0oifQ==