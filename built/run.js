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
        subscribe(topic, cb) {
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
        /**
         * Invoke search on all providers
         * @param value search value
         */
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
        locate(value) {
            return __awaiter(this, void 0, void 0, function* () {
                this.channel.publish("start");
                const provider = this.providers.find(p => p.name === value.provider_id);
                return provider.search(value);
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
        appendAll(widget.ux.results, asDom(`<div>${asHtml.trim()}</div>`));
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
            search.addEventListener("click", () => this.onSearch());
            setBackground(this.ux.search, "icon-search");
            setBackground(this.ux.cancel, "icon-close");
            keys_1.keys(this.ux).forEach(className => {
                const item = this.ux[className];
                item.title = options.titles[className] || className;
                item.classList.add(className);
                this.dom.appendChild(item);
            });
            this.engine.subscribe("start", () => {
                this.publish("start-search");
            });
            this.engine.subscribe("complete", () => {
                this.publish("complete-search");
            });
            this.engine.subscribe("success", (results) => {
                this.publish("receive-search-result", results);
                // only render results if the input hash matches the results hash
                if (this.getSearchHash() !== results.searchHash)
                    return;
                renderResults_1.renderResults(this, results);
                this.publish("update-search-result", results);
            });
        }
        /**
         * Notify that user selected a result item
         */
        onResultSelected() {
            const result = document.activeElement;
            if (this.ux.results !== result.parentElement)
                return;
            this.publish("selectresult", JSON.parse(result.dataset.d));
        }
        setSearchHash(value) {
            this._hash = value;
        }
        getSearchHash() {
            return (this._hash || this.ux.input.value.trim().toUpperCase());
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
        /**
         * User clicked "search" button, perform a location query
         */
        onSearch() {
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
        onInputChanged() {
            try {
                const searchText = this.ux.input.value.trim();
                if (searchText === this.priorSearchText)
                    return;
                this.setSearchHash(searchText);
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
        /**
         * Update the search text
         * @param value Value to assign to the search area
         */
        search(value) {
            this.ux.input.value = value;
            this.ux.input.focus();
            this.onInputChanged();
        }
        locate(value) {
            // responses are associated with requests through a hash of the input value
            this.setSearchHash(value.key);
            return this.engine.locate(value);
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
            console.log(`${this.options.id} searching for: ${searchValue}`);
            return new Promise((good, bad) => {
                if (typeof searchValue !== "string") {
                    good({ provider_id: this.name, searchHash: searchValue, items: [] });
                }
                ;
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
    function asQueryString(args) {
        return Object.keys(args).map(key => `${key}=${args[key]}`).join("&");
    }
    // https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?f=json&text=greenville&maxSuggestions=6&location=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%2C%22x%22%3A-10797990.606947355%2C%22y%22%3A4579425.812870008%7D
    class AgsLocatorProvider {
        constructor() {
            this.name = "AgsLocatorProvider";
        }
        mapSuggestResponseData(data) {
            const items = data.suggestions.map(responseItem => (Object.assign(Object.assign({}, responseItem), { provider_id: this.name, address: responseItem.text, key: responseItem.magicKey, location: null, address_type: ["address"] })));
            return {
                provider_id: this.name,
                searchHash: "",
                items
            };
        }
        mapFindAddressCandidatesResponseData(data) {
            const items = data.candidates.map(responseItem => (Object.assign(Object.assign({}, responseItem), { provider_id: this.name, address: responseItem.address, key: responseItem.address, location: responseItem.location, address_type: ["address"] })));
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
                const args = {
                    category: "Address,Postal",
                    text: searchValue,
                    maxLocations: 3,
                    maxSuggestions: 3,
                    countryCode: "USA"
                };
                const fetchResponse = yield fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?f=json&${asQueryString(args)}`);
                const responseData = yield fetchResponse.json();
                const response = this.mapSuggestResponseData(responseData);
                response.searchHash = searchValue;
                return response;
            });
        }
        locate(item) {
            return __awaiter(this, void 0, void 0, function* () {
                const args = {
                    category: "Address,Postal",
                    SingleLine: item.address,
                    maxLocations: 3,
                    maxSuggestions: 3,
                    countryCode: "USA",
                    magicKey: item.key,
                };
                const fetchResponse = yield fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&${asQueryString(args)}`);
                const responseData = yield fetchResponse.json();
                const response = this.mapFindAddressCandidatesResponseData(responseData);
                response.searchHash = item.key;
                return response;
            });
        }
    }
    exports.AgsLocatorProvider = AgsLocatorProvider;
});
define("labs/ags-widget-viewer", ["require", "exports", "labs/widgets/auto-complete/index", "labs/widgets/auto-complete/extensions/AnimationExtension", "labs/widgets/auto-complete/providers/AgsLocatorProvider"], function (require, exports, index_1, AnimationExtension_2, AgsLocatorProvider_1) {
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
                    // new MockProvider({
                    //     id: "Sluggard",
                    //     database: createDatabase(500),
                    //     delay: 4000,
                    //     maxResultCount: 6,
                    //     transform: ({ key, location, address, address_type }) => ({
                    //         key,
                    //         address_type,
                    //         location,
                    //         address: camelize(address)
                    //     })
                    // }),
                    // new MockProvider({
                    //     id: "MockFast",
                    //     database: createDatabase(500),
                    //     delay: 100,
                    //     maxResultCount: 6,
                    //     transform: ({ key, location, address, address_type }) => ({
                    //         key,
                    //         address_type,
                    //         location,
                    //         address: address.toLowerCase()
                    //     })
                    // }),
                    // new MockProvider({
                    //     id: "MockFastest",
                    //     database: createDatabase(50),
                    //     delay: 10,
                    //     maxResultCount: 1,
                    //     transform: ({ key, location, address, address_type }) => ({
                    //         key,
                    //         address_type,
                    //         location,
                    //         address: address.toLowerCase()
                    //     })
                    // }),
                    // new MockProvider({
                    //     id: "MockSlow",
                    //     maxResultCount: 6,
                    //     database: createDatabase(500),
                    //     delay: 2000,
                    //     transform: ({ key, location, address, address_type, provider_id }) => ({
                    //         provider_id,
                    //         key,
                    //         address_type,
                    //         location,
                    //         address: address.toUpperCase()
                    //     })
                    // }),
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
            /**
             * request a search to be performed using that item
             */
            widget.subscribe("selectresult", (item) => __awaiter(this, void 0, void 0, function* () {
                console.log("item selected: ", item);
                if (!!item.location) {
                    console.log("location", item.location);
                    widget.dispose();
                }
                else {
                    const searchResult = yield widget.locate(item);
                    console.log("location:", searchResult.items[0].location);
                    widget.dispose();
                }
            }));
            //widget.search("N MAIN AVE");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGFicy9hamF4LnRzIiwiLi4vbGFicy9hZ3MtZmVhdHVyZS1wcm94eS50cyIsIi4uL2xhYnMvYWdzLWNhdGFsb2ctcHJveHkudHMiLCIuLi9hcHAudHMiLCIuLi9pcHMvc2VydmljZXMudHMiLCIuLi9sYWJzL2Fncy1mZWF0dXJlLXF1ZXJ5LXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtZmluZC1hZGRyZXNzLXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtZmluZC1wcm94eS50cyIsIi4uL2xhYnMvYWdzLWdlb21ldHJ5LXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtbHJzLXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtbWFwLWV4cG9ydC1wcm94eS50cyIsIi4uL2xhYnMvYWdzLW1hcC1maW5kLXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtbWFwLWlkZW50aWZ5LXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtbWFwLXF1ZXJ5LXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtcmV2ZXJzZS1nZW9jb2RlLXByb3h5LnRzIiwiLi4vbGFicy9kYXRhL3JvdXRlMDEudHMiLCIuLi9sYWJzL2Fncy1yb3V0ZS1lZGl0b3IudHMiLCIuLi9sYWJzL2Fncy1zb2x2ZS1wcm94eS50cyIsIi4uL2xhYnMvYWdzLXJvdXRlLXNvbHZlLXByb3h5LnRzIiwiLi4vbGFicy9hZ3Mtc2VydmljZWFyZWEtc29sdmUtcHJveHkudHMiLCIuLi9sYWJzL2Fncy1zdWdnZXN0LXByb3h5LnRzIiwiLi4vbGFicy9hZ3Mtd2VibWFwLnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvdHlwaW5ncy9HZW9tZXRyeS50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL3R5cGluZ3MvU2VhcmNoUmVzdWx0SXRlbS50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL3R5cGluZ3MvU2VhcmNoUmVzdWx0LnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvdHlwaW5ncy9BdXRvQ29tcGxldGVQcm92aWRlckNvbnRyYWN0LnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvdHlwaW5ncy9SZW1vdmVFdmVudEhhbmRsZXIudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS90eXBpbmdzL1dpZGdldENvbnRyYWN0LnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvdHlwaW5ncy9XaWRnZXRFeHRlbnNpb25Db250cmFjdC50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL3R5cGluZ3MvQXV0b0NvbXBsZXRlV2lkZ2V0Q29udHJhY3QudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9mdW4va2V5cy50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL3R5cGluZ3MvRGljdGlvbmFyeS50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL0NoYW5uZWwudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9XaWRnZXRCYXNlLnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvdHlwaW5ncy9BdXRvQ29tcGxldGVFbmdpbmVDb250cmFjdC50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL0F1dG9Db21wbGV0ZUVuZ2luZS50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL2Z1bi9yZW5kZXJSZXN1bHRzLnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvZnVuL2luamVjdENzcy50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL2Z1bi9pbmplY3RTdmcudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9BdXRvQ29tcGxldGVXaWRnZXQudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9leHRlbnNpb25zL0FuaW1hdGlvbkV4dGVuc2lvbi50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL2V4dGVuc2lvbnMvS2V5Ym9hcmRXaWRnZXRFeHRlbnNpb24udHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9pbmRleC50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL3Byb3ZpZGVycy9Nb2NrUHJvdmlkZXIudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9wcm92aWRlcnMvQWdzTG9jYXRvclByb3ZpZGVyLnRzIiwiLi4vbGFicy9hZ3Mtd2lkZ2V0LXZpZXdlci50cyIsIi4uL2xhYnMvY29uc29sZS50cyIsIi4uL2xhYnMvaW5kZXgudHMiLCIuLi9sYWJzL3B1YnN1Yi50cyIsIi4uL2xhYnMvbWFwbGV0LnRzIiwiLi4vbGFicy9kYXRhL2ZpbmRBZGRyZXNzQ2FuZGlkYXRlc19yZXNwb25zZS50cyIsIi4uL2xhYnMvZGF0YS9zdWdnZXN0X3Jlc3BvbnNlLnRzIiwiLi4vbGFicy9xYXFjL21hcHBpbmdzLnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUudHMiLCIuLi91eC9nZW9kZXNpYy1wbGFuYXItdXgudHMiLCIuLi91eC9yb3V0aW5nLXByb3RvdHlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztHQUVHOztJQUVILFlBQVksQ0FBQztJQUViLE1BQU0sSUFBSTtRQVFOLFlBQW1CLEdBQVc7WUFBWCxRQUFHLEdBQUgsR0FBRyxDQUFRO1lBTnZCLFlBQU8sR0FBRztnQkFDYixRQUFRLEVBQUUsSUFBSTtnQkFDZCxTQUFTLEVBQUUsS0FBSztnQkFDaEIsUUFBUSxFQUFFLElBQUk7YUFDakIsQ0FBQTtRQUdELENBQUM7UUFFTyxLQUFLLENBQUksSUFBVSxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRztZQUN2QyxPQUFPLElBQUksT0FBTyxDQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUV0QyxJQUFJLENBQUMsVUFB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