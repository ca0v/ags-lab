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
define("labs/widgets/auto-complete/Geometry", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/SearchResultItem", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/SearchResult", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/AutoCompleteProviderContract", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/RemoveEventHandler", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/WidgetContract", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/WidgetExtensionContract", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/AutoCompleteWidgetContract", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("labs/widgets/auto-complete/keys", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function keys(o) {
        return Object.keys(o);
    }
    exports.keys = keys;
});
define("labs/widgets/auto-complete/Dictionary", ["require", "exports"], function (require, exports) {
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
define("labs/widgets/auto-complete/Widget", ["require", "exports", "labs/widgets/auto-complete/Channel"], function (require, exports, Channel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Widget {
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
    exports.Widget = Widget;
});
define("labs/widgets/auto-complete/AutoCompleteEngineContract", ["require", "exports"], function (require, exports) {
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
define("labs/widgets/auto-complete/renderResults", ["require", "exports"], function (require, exports) {
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
define("labs/widgets/auto-complete/injectCss", ["require", "exports"], function (require, exports) {
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
define("labs/widgets/auto-complete/injectSvg", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function injectSvg(namespace, svg) {
        const container = document.createElement("div");
        container.innerHTML = svg.trim();
        document.body.appendChild(container.firstChild);
    }
    exports.injectSvg = injectSvg;
});
define("labs/widgets/auto-complete/AutoCompleteWidget", ["require", "exports", "labs/widgets/auto-complete/keys", "labs/widgets/auto-complete/Widget", "labs/widgets/auto-complete/AutoCompleteEngine", "labs/widgets/auto-complete/renderResults", "labs/widgets/auto-complete/injectCss", "labs/widgets/auto-complete/injectSvg"], function (require, exports, keys_1, Widget_1, AutoCompleteEngine_1, renderResults_1, injectCss_1, injectSvg_1) {
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
    class AutoCompleteWidget extends Widget_1.Widget {
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
define("labs/widgets/auto-complete/AnimationExtension", ["require", "exports", "labs/widgets/auto-complete/injectCss"], function (require, exports, injectCss_2) {
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
define("labs/widgets/auto-complete/KeyboardWidgetExtension", ["require", "exports"], function (require, exports) {
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
define("labs/widgets/auto-complete/index", ["require", "exports", "labs/widgets/auto-complete/AnimationExtension", "labs/widgets/auto-complete/AutoCompleteWidget", "labs/widgets/auto-complete/KeyboardWidgetExtension"], function (require, exports, AnimationExtension_1, AutoCompleteWidget_1, KeyboardWidgetExtension_1) {
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
define("labs/widgets/auto-complete/MockProvider", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function randomInt(range = 1000) {
        return Math.floor(range * Math.random());
    }
    class MockProvider {
        constructor(options) {
            this.options = options;
            this.name = options.id;
        }
        search(searchValue) {
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
define("labs/ags-widget-viewer", ["require", "exports", "labs/widgets/auto-complete/index", "labs/widgets/auto-complete/MockProvider", "labs/widgets/auto-complete/AnimationExtension"], function (require, exports, index_1, MockProvider_1, AnimationExtension_2) {
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
                            key: key + "sluggard_provider",
                            address_type: address_type || ["park"],
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
                            key: key + "fast_provider",
                            address_type: address_type || ["business"],
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
                            key: key + "fast_provider",
                            address_type: address_type || ["address"],
                            location,
                            address: address.toLowerCase()
                        })
                    }),
                    new MockProvider_1.MockProvider({
                        id: "MockSlow",
                        maxResultCount: 6,
                        database: createDatabase(500),
                        delay: 2000,
                        transform: ({ key, location, address }) => ({
                            key: key + "slow_provider",
                            address_type: [randomAddressType()],
                            location,
                            address: address.toUpperCase()
                        })
                    })
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGFicy9hamF4LnRzIiwiLi4vbGFicy9hZ3MtZmVhdHVyZS1wcm94eS50cyIsIi4uL2xhYnMvYWdzLWNhdGFsb2ctcHJveHkudHMiLCIuLi9hcHAudHMiLCIuLi9pcHMvc2VydmljZXMudHMiLCIuLi9sYWJzL2Fncy1mZWF0dXJlLXF1ZXJ5LXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtZmluZC1hZGRyZXNzLXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtZmluZC1wcm94eS50cyIsIi4uL2xhYnMvYWdzLWdlb21ldHJ5LXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtbHJzLXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtbWFwLWV4cG9ydC1wcm94eS50cyIsIi4uL2xhYnMvYWdzLW1hcC1maW5kLXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtbWFwLWlkZW50aWZ5LXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtbWFwLXF1ZXJ5LXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtcmV2ZXJzZS1nZW9jb2RlLXByb3h5LnRzIiwiLi4vbGFicy9kYXRhL3JvdXRlMDEudHMiLCIuLi9sYWJzL2Fncy1yb3V0ZS1lZGl0b3IudHMiLCIuLi9sYWJzL2Fncy1zb2x2ZS1wcm94eS50cyIsIi4uL2xhYnMvYWdzLXJvdXRlLXNvbHZlLXByb3h5LnRzIiwiLi4vbGFicy9hZ3Mtc2VydmljZWFyZWEtc29sdmUtcHJveHkudHMiLCIuLi9sYWJzL2Fncy1zdWdnZXN0LXByb3h5LnRzIiwiLi4vbGFicy9hZ3Mtd2VibWFwLnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvR2VvbWV0cnkudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9TZWFyY2hSZXN1bHRJdGVtLnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvU2VhcmNoUmVzdWx0LnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvQXV0b0NvbXBsZXRlUHJvdmlkZXJDb250cmFjdC50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL1JlbW92ZUV2ZW50SGFuZGxlci50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL1dpZGdldENvbnRyYWN0LnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvV2lkZ2V0RXh0ZW5zaW9uQ29udHJhY3QudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9BdXRvQ29tcGxldGVXaWRnZXRDb250cmFjdC50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL2tleXMudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9EaWN0aW9uYXJ5LnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvQ2hhbm5lbC50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL1dpZGdldC50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL0F1dG9Db21wbGV0ZUVuZ2luZUNvbnRyYWN0LnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvQXV0b0NvbXBsZXRlRW5naW5lLnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvcmVuZGVyUmVzdWx0cy50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL2luamVjdENzcy50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL2luamVjdFN2Zy50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL0F1dG9Db21wbGV0ZVdpZGdldC50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL0FuaW1hdGlvbkV4dGVuc2lvbi50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL0tleWJvYXJkV2lkZ2V0RXh0ZW5zaW9uLnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvaW5kZXgudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9Nb2NrUHJvdmlkZXIudHMiLCIuLi9sYWJzL2Fncy13aWRnZXQtdmlld2VyLnRzIiwiLi4vbGFicy9jb25zb2xlLnRzIiwiLi4vbGFicy9pbmRleC50cyIsIi4uL2xhYnMvcHVic3ViLnRzIiwiLi4vbGFicy9tYXBsZXQudHMiLCIuLi9sYWJzL2RhdGEvZmluZEFkZHJlc3NDYW5kaWRhdGVzX3Jlc3BvbnNlLnRzIiwiLi4vbGFicy9kYXRhL3N1Z2dlc3RfcmVzcG9uc2UudHMiLCIuLi9sYWJzL3FhcWMvbWFwcGluZ3MudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS50cyIsIi4uL3V4L2dlb2Rlc2ljLXBsYW5hci11eC50cyIsIi4uL3V4L3JvdXRpbmctcHJvdG90eXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0dBRUc7O0lBRUgsWUFBWSxDQUFDO0lBRWIsTUFBTSxJQUFJO1FBUU4sWUFBbUIsR0FBVztZQUFYLFFBQUcsR0FBSCxHQUFHLENBQVE7WUFOdkIsWUFBTyxHQUFHO2dCQUNiLFFBQVEsRUFBRSxJQUFJO2dCQUNkLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixRQUFRLEVBQUUsSUFBSTthQUNqQixDQUFBO1FBR0QsQ0FBQztRQUVPLEtBQUssQ0FBSSxJQUFVLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHO1lBQ3ZDLE9BQU8sSUFBSSxPQUFPLENBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBRXRDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxRQUFRLENBQUM7Z0JBQzVCLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENB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