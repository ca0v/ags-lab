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
    exports.run = void 0;
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
    exports.run = void 0;
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
    exports.Routing = void 0;
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
    exports.run = void 0;
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
    exports.run = void 0;
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
    exports.run = void 0;
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
    exports.run = void 0;
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
    exports.run = void 0;
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
    exports.run = void 0;
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
    exports.run = void 0;
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
    exports.run = void 0;
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
    exports.run = void 0;
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
    exports.run = void 0;
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
    exports.run = exports.RouteViewer = void 0;
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
    exports.run = void 0;
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
    exports.run = void 0;
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
    exports.run = void 0;
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
    exports.run = void 0;
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
    exports.run = void 0;
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
define("labs/widgets/auto-complete/fun/keys", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.keys = void 0;
    function keys(o) {
        return Object.keys(o);
    }
    exports.keys = keys;
});
define("labs/widgets/auto-complete/Channel", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Channel = void 0;
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
    exports.WidgetBase = void 0;
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
define("labs/widgets/auto-complete/AutoCompleteEngine", ["require", "exports", "labs/widgets/auto-complete/Channel"], function (require, exports, Channel_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AutoCompleteEngine = void 0;
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
    exports.renderResults = void 0;
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
    exports.injectCss = void 0;
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
    exports.injectSvg = void 0;
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
    exports.AutoCompleteWidget = void 0;
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
    exports.AnimationExtension = void 0;
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
    exports.KeyboardWidgetExtension = void 0;
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
    exports.createAutoCompleteWidget = void 0;
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
    exports.MockProvider = void 0;
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
    exports.AgsLocatorProvider = void 0;
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
    exports.run = void 0;
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
    exports.run = void 0;
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
    exports.run = void 0;
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
    exports.run = void 0;
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
    exports.run = void 0;
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
define("labs/sandbox/4326/index", ["require", "exports", "esri/map", "esri/SpatialReference", "esri/dijit/Scalebar", "esri/layers/GraphicsLayer", "esri/graphic", "esri/geometry/Point", "esri/geometry/Extent", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/Color", "esri/geometry/projection", "esri/layers/FeatureLayer", "esri/symbols/SimpleFillSymbol", "esri/renderers/SimpleRenderer", "dojo/domReady!"], function (require, exports, map_1, SpatialReference_1, Scalebar_1, GraphicsLayer_1, graphic_1, Point_1, Extent_1, SimpleMarkerSymbol_1, SimpleLineSymbol_1, Color_1, projection, FeatureLayer_1, SimpleFillSymbol_1, SimpleRenderer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.run = void 0;
    const range = (n) => new Array(n).fill(n).map((_, i) => i);
    const createMarker = (color) => new SimpleMarkerSymbol_1.default("solid", 8, new SimpleLineSymbol_1.default(), new Color_1.default([color, color, color, 1]));
    const srs3857 = new SpatialReference_1.default({ wkid: 3421 });
    const srs4326 = new SpatialReference_1.default({ wkid: 4326 });
    const baselineResolution = 156543.03408771486;
    const baselineScale = 591657527.591555;
    const lods3857 = range(5)
        .map((i) => i)
        .map((i) => {
        const level = i;
        const resolution = baselineResolution / Math.pow(2, level);
        const scale = baselineScale / Math.pow(2, level);
        return { level, resolution, scale, levelValue: "level" };
    });
    function run() {
        return __awaiter(this, void 0, void 0, function* () {
            yield projection.load();
            const center = projection.project(new Point_1.default(-85, 35, srs4326), srs3857);
            const extent = new Extent_1.default({
                xmin: center.x - 1000,
                ymin: center.y - 1000,
                xmax: center.x + 1000,
                ymax: center.y + 1000,
                spatialReference: srs3857,
            });
            // new Extent({"xmin":-3805207,"ymin":-3763687,"xmax":3692296,"ymax":1775125,"spatialReference":{"wkid":102003}})
            const map = new map_1.default("map", {
                //basemap: "streets",
                // minScale: lods3857[0].scale, // map computes it's own levels
                // maxScale: lods3857[lods3857.length - 1].scale,
                // scale: lods3857[0].scale,
                center,
                extent,
                lods: lods3857,
                zoom: 0,
            });
            // trick to get the map to work properly
            map.basemapLayerIds &&
                map.on("load", () => {
                    setTimeout(() => map.removeLayer(map.getLayer(map.basemapLayerIds[0])), 0);
                    //map.removeLayer(layer);
                });
            map.on("click", () => __awaiter(this, void 0, void 0, function* () {
                console.log("level", map.getLevel());
                console.log("scale", map.getScale());
                console.log("zoom", map.getZoom());
                // reporting 4326 but I want 3857
                console.log("spatialReference", map.spatialReference);
            }));
            new Scalebar_1.default({ map: map, scalebarUnit: "dual" });
            const layer = new FeatureLayer_1.default("https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3", { definitionExpression: "1=1" });
            // other layers to use...world regions:
            // var layer = new FeatureLayer("https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer/2");
            // countries:
            // var layer = new FeatureLayer("https://wwtw.esriuk.com/ArcGIS/rest/services/CG/WorldCountries/MapServer/0");
            const outline = new SimpleLineSymbol_1.default("solid", new Color_1.default([255, 255, 255, 1]), 1);
            const fill = new SimpleFillSymbol_1.default("solid", outline, new Color_1.default([64, 64, 64, 0.5]));
            layer.setRenderer(new SimpleRenderer_1.default(fill));
            map.addLayer(layer); // somehow this allows the map to take on srs3857
            map.on("load", () => {
                const graphicsLayer = new GraphicsLayer_1.default();
                // these only appear when there is a basemap
                [-85, -85.01, -84.99]
                    .map((x) => projection.project(new Point_1.default(x, 36.0, srs4326), map.spatialReference))
                    .forEach((p, i) => graphicsLayer.add(new graphic_1.default(p, createMarker(i * 10), {})));
                // these appear at all times
                [36, 36.01, 35.99]
                    .map((y) => projection.project(new Point_1.default(-85, y, srs4326), map.spatialReference))
                    .forEach((p, i) => graphicsLayer.add(new graphic_1.default(p, createMarker(i * 10), {})));
                map.addLayer(graphicsLayer);
            });
        });
    }
    exports.run = run;
});
define("labs/widgets/auto-complete", ["require", "exports", "dojo/debounce", "labs/data/suggest_response"], function (require, exports, debounce, mockSuggestResponse) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.run = void 0;
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
    exports.run = void 0;
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
    exports.getRoutes = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGFicy9hamF4LnRzIiwiLi4vbGFicy9hZ3MtZmVhdHVyZS1wcm94eS50cyIsIi4uL2xhYnMvYWdzLWNhdGFsb2ctcHJveHkudHMiLCIuLi9hcHAudHMiLCIuLi9pcHMvc2VydmljZXMudHMiLCIuLi9sYWJzL2Fncy1mZWF0dXJlLXF1ZXJ5LXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtZmluZC1hZGRyZXNzLXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtZmluZC1wcm94eS50cyIsIi4uL2xhYnMvYWdzLWdlb21ldHJ5LXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtbHJzLXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtbWFwLWV4cG9ydC1wcm94eS50cyIsIi4uL2xhYnMvYWdzLW1hcC1maW5kLXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtbWFwLWlkZW50aWZ5LXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtbWFwLXF1ZXJ5LXByb3h5LnRzIiwiLi4vbGFicy9hZ3MtcmV2ZXJzZS1nZW9jb2RlLXByb3h5LnRzIiwiLi4vbGFicy9kYXRhL3JvdXRlMDEudHMiLCIuLi9sYWJzL2Fncy1yb3V0ZS1lZGl0b3IudHMiLCIuLi9sYWJzL2Fncy1zb2x2ZS1wcm94eS50cyIsIi4uL2xhYnMvYWdzLXJvdXRlLXNvbHZlLXByb3h5LnRzIiwiLi4vbGFicy9hZ3Mtc2VydmljZWFyZWEtc29sdmUtcHJveHkudHMiLCIuLi9sYWJzL2Fncy1zdWdnZXN0LXByb3h5LnRzIiwiLi4vbGFicy9hZ3Mtd2VibWFwLnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvZnVuL2tleXMudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9DaGFubmVsLnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvV2lkZ2V0QmFzZS50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL0F1dG9Db21wbGV0ZUVuZ2luZS50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL2Z1bi9yZW5kZXJSZXN1bHRzLnRzIiwiLi4vbGFicy93aWRnZXRzL2F1dG8tY29tcGxldGUvZnVuL2luamVjdENzcy50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL2Z1bi9pbmplY3RTdmcudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9BdXRvQ29tcGxldGVXaWRnZXQudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9leHRlbnNpb25zL0FuaW1hdGlvbkV4dGVuc2lvbi50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL2V4dGVuc2lvbnMvS2V5Ym9hcmRXaWRnZXRFeHRlbnNpb24udHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9pbmRleC50cyIsIi4uL2xhYnMvd2lkZ2V0cy9hdXRvLWNvbXBsZXRlL3Byb3ZpZGVycy9Nb2NrUHJvdmlkZXIudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS9wcm92aWRlcnMvQWdzTG9jYXRvclByb3ZpZGVyLnRzIiwiLi4vbGFicy9hZ3Mtd2lkZ2V0LXZpZXdlci50cyIsIi4uL2xhYnMvY29uc29sZS50cyIsIi4uL2xhYnMvaW5kZXgudHMiLCIuLi9sYWJzL3B1YnN1Yi50cyIsIi4uL2xhYnMvbWFwbGV0LnRzIiwiLi4vbGFicy9kYXRhL2ZpbmRBZGRyZXNzQ2FuZGlkYXRlc19yZXNwb25zZS50cyIsIi4uL2xhYnMvZGF0YS9zdWdnZXN0X3Jlc3BvbnNlLnRzIiwiLi4vbGFicy9xYXFjL21hcHBpbmdzLnRzIiwiLi4vbGFicy9zYW5kYm94LzQzMjYvaW5kZXgudHMiLCIuLi9sYWJzL3dpZGdldHMvYXV0by1jb21wbGV0ZS50cyIsIi4uL3V4L2dlb2Rlc2ljLXBsYW5hci11eC50cyIsIi4uL3V4L3JvdXRpbmctcHJvdG90eXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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