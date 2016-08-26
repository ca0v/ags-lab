var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */
define("labs/ajax", ["require", "exports"], function (require, exports) {
    "use strict";
    var Ajax = (function () {
        function Ajax(url) {
            this.url = url;
            this.options = {
                use_json: true,
                use_jsonp: false,
                use_cors: true
            };
        }
        Ajax.prototype.jsonp = function (args, url) {
            if (url === void 0) { url = this.url; }
            return new Promise(function (resolve, reject) {
                args["callback"] = "define";
                var uri = url + "?" + Object.keys(args).map(function (k) { return (k + "=" + args[k]); }).join('&');
                require([uri], function (data) { return resolve(data); });
            });
        };
        // http://www.html5rocks.com/en/tutorials/cors/    
        Ajax.prototype.ajax = function (method, args, url) {
            if (url === void 0) { url = this.url; }
            var isData = method === "POST" || method === "PUT";
            var isJson = this.options.use_json;
            var isCors = this.options.use_cors;
            var promise = new Promise(function (resolve, reject) {
                var client = new XMLHttpRequest();
                if (isCors)
                    client.withCredentials = true;
                var uri = url;
                var data = null;
                if (args) {
                    if (isData) {
                        data = JSON.stringify(args);
                    }
                    else {
                        uri += '?';
                        var argcount = 0;
                        for (var key in args) {
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
                client.onload = function () {
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
        };
        Ajax.prototype.stub = function (result) {
            return new Promise(function (resolve, reject) {
                resolve(result);
            });
        };
        Ajax.prototype.get = function (args) {
            if (this.options.use_jsonp)
                return this.jsonp(args);
            return this.ajax('GET', args);
        };
        Ajax.prototype.post = function (args) {
            return this.ajax('POST', args);
        };
        Ajax.prototype.put = function (args) {
            return this.ajax('PUT', args);
        };
        Ajax.prototype.delete = function (args) {
            return this.ajax('DELETE', args);
        };
        return Ajax;
    }());
    return Ajax;
});
/**
 * http://sampleserver6.arcgisonline.com/arcgis/rest/services/Military/FeatureServer
 */
define("labs/ags-feature-proxy", ["require", "exports", "dojo/_base/lang", "labs/ajax"], function (require, exports, lang, Ajax) {
    "use strict";
    var FeatureServer = (function () {
        function FeatureServer(url) {
            this.ajax = new Ajax(url);
        }
        FeatureServer.prototype.about = function (data) {
            var req = lang.mixin({
                f: "pjson"
            }, data);
            return this.ajax.get(req);
        };
        FeatureServer.prototype.aboutLayer = function (layer) {
            var ajax = new Ajax(this.ajax.url + "/" + layer);
            var req = lang.mixin({
                f: "pjson"
            }, {});
            return ajax.get(req);
        };
        return FeatureServer;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = FeatureServer;
    function run() {
        var service = new FeatureServer("//sampleserver6.arcgisonline.com/arcgis/rest/services/Military/FeatureServer");
        service
            .about()
            .then(function (value) {
            console.log("about", value);
            console.log("currentVersion", value.currentVersion);
            service.aboutLayer(2).then(function (value) {
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
    var Catalog = (function () {
        function Catalog(url) {
            this.ajax = new Ajax(url);
        }
        Catalog.prototype.about = function (data) {
            var req = lang.mixin({
                f: "pjson"
            }, data);
            return this.ajax.get(req);
        };
        Catalog.prototype.aboutFolder = function (folder) {
            var ajax = new Ajax(this.ajax.url + "/" + folder);
            var req = lang.mixin({
                f: "pjson"
            }, {});
            return ajax.get(req);
        };
        return Catalog;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Catalog;
    function run() {
        var url = "//sampleserver6.arcgisonline.com/arcgis/rest/services";
        var service = new Catalog(url);
        service
            .about()
            .then(function (value) {
            console.log("about", value);
            value.services.filter(function (s) { return s.type === "FeatureServer"; }).forEach(function (s) {
                var featureService = new ags_feature_proxy_1.default(url + "/" + s.name + "/FeatureServer");
                featureService.about().then(function (s) { return console.log("featureServer", s); });
            });
            value.folders.forEach(function (f) {
                service.aboutFolder(f).then(function (value) {
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
    var __DEV__ = 0;
    var test = (function () {
        function test() {
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
        return test;
    }());
    var Routing = (function () {
        function Routing(api) {
            this.api = api;
        }
        Routing.prototype.auth = function (id) {
            var ajax = new Ajax(this.api + "/auth?username=" + id.username + "&password=" + id.password);
            return ajax.get();
        };
        Routing.prototype.forceSampleRoutes = function () {
            //if (!__DEV__) throw "you must set __DEV__ first";
            var extent = [-115.24, 36.16, -115.22, 36.18];
            var routeItems = test.ips_route_response.data.filter(function (r) { return r.employeeId === "1003"; });
            var count = routeItems.length;
            var randomLocation = function (i) { return ({
                x: extent[0] + Math.random() * (extent[2] - extent[0]) * (1 + i % count) / count,
                y: extent[1] + Math.random() * (extent[2] - extent[0]) * (1 + i % count) / count
            }); };
            var ajax = new Ajax(this.api + "/routing/routes");
            var routes = routeItems.map(function (route, i) { return ({
                employeeId: route.employeeId,
                routeDate: new Date().toISOString(),
                startLocation: randomLocation(i),
                endLocation: randomLocation(i),
                routeItems: route.routeItems.map(function (item) { return ({
                    activity: item.activity,
                    ordinalIndex: item.ordinalIndex,
                    location: randomLocation(i)
                }); })
            }); });
            var result = [];
            var d = new Deferred();
            var x = new Deferred();
            x.reject;
            var doit = function () {
                if (!routes.length) {
                    d.resolve(result);
                    return;
                }
                ajax.post(routes.pop())
                    .then(function (routes) {
                    result.push(routes.data);
                    doit();
                });
            };
            doit();
            return d.promise;
        };
        Routing.prototype.createRoutes = function () {
            if (__DEV__)
                throw "you must set __DEV__ first";
            var ajax = new Ajax(this.api + "/routing/routes");
            return ajax.post();
        };
        Routing.prototype.getRoutes = function (args) {
            if (args === void 0) { args = {}; }
            var ajax = new Ajax(this.api + "/routing/routes");
            ajax.options.use_cors = true;
            ajax.options.use_json = true;
            ajax.options.use_jsonp = false;
            var params = lang.mixin({ routeDate: new Date(), employeeId: "" }, args);
            params.routeDate = params.routeDate.toISOString().substring(0, 10);
            return (__DEV__ ? ajax.stub(test.ips_route_response) : ajax.get(params)).then(function (routes) {
                routes.data.forEach(function (r, i) {
                    r.employeeFullName = r.employeeFullName || r.employeeId;
                });
                if (__DEV__) {
                    // spoof some locations
                    var extent_1 = [-115.24, 36.16, -115.22, 36.18];
                    var count_1 = routes.data.length;
                    var randomLocation_1 = function (i) { return ({
                        x: extent_1[0] + Math.random() * (extent_1[2] - extent_1[0]) * (1 + i % count_1) / count_1,
                        y: extent_1[1] + Math.random() * (extent_1[2] - extent_1[0]) * (1 + i % count_1) / count_1
                    }); };
                    routes.data.forEach(function (r, i) {
                        r.startLocation = randomLocation_1(i);
                        r.endLocation = randomLocation_1(i);
                        r.routeItems.forEach(function (ri) { return ri.location = randomLocation_1(i); });
                    });
                }
                return routes;
            });
        };
        Routing.prototype.optimizeRoute = function (routeId) {
            if (__DEV__)
                throw "you must set __DEV__ first";
            var ajax = new Ajax(this.api + "/routing/routes/optimize");
            return ajax.put({
                Id: routeId,
                Parameters: {}
            });
        };
        Routing.prototype.updateRoute = function (routeId, routeItems) {
            if (__DEV__)
                throw "you must set __DEV__ first";
            console.log("updateRoute", routeId, routeItems);
            var ajax = new Ajax(this.api + "/routing/routes/orderchanged");
            return ajax.put({
                Id: routeId,
                Items: routeItems
            });
        };
        return Routing;
    }());
    exports.Routing = Routing;
});
/**
 * http://sampleserver6.arcgisonline.com/arcgis/sdk/rest/index.html#//02ss0000002r000000
 */
define("labs/ags-feature-query-proxy", ["require", "exports", "dojo/_base/lang", "labs/ajax"], function (require, exports, lang, Ajax) {
    "use strict";
    var Query = (function () {
        function Query(url) {
            this.ajax = new Ajax(url);
        }
        Query.prototype.query = function (data) {
            var req = lang.mixin({
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
        };
        return Query;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Query;
    function run() {
        new Query("https://sampleserver6.arcgisonline.com/arcgis/rest/services/Military/FeatureServer/3/query")
            .query({
            outFields: ["symbolname"],
            returnDistinctValues: true
        })
            .then(function (value) {
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
    var FindAddress = (function () {
        function FindAddress(url) {
            this.ajax = new Ajax(url);
        }
        FindAddress.prototype.find = function (data) {
            var req = lang.mixin({
                outFields: "*",
                outSRS: "wkid:4326",
                maxLocations: 1,
                distance: 1e5,
                forStorage: false,
                f: "pjson"
            }, data);
            return this.ajax.get(req);
        };
        return FindAddress;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = FindAddress;
    function run() {
        new FindAddress("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates")
            .find({
            singleLine: "50 Datastream Plz, Greenville, South Carolina, 29605",
            location: "-82.41,34.79",
            category: "Address"
        })
            .then(function (value) {
            console.log("location", value.candidates.map(function (c) { return c.location; }));
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
    var Find = (function () {
        function Find(url) {
            this.ajax = new Ajax(url);
        }
        Find.prototype.find = function (data) {
            var req = lang.mixin({
                outFields: "*",
                outSRS: "wkid:4326",
                maxLocations: 1,
                distance: 1e5,
                forStorage: false,
                f: "pjson"
            }, data);
            return this.ajax.get(req);
        };
        return Find;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Find;
    function run() {
        new Find("//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find")
            .find({
            text: "50 Datastream Plz, Greenville, South Carolina, 29605",
            location: "-82.41,34.79",
            category: "Address"
        })
            .then(function (value) {
            console.log("location", value.locations.map(function (c) { return c.name; }));
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
    // see http://resources.esri.com/help/9.3/ArcGISDesktop/ArcObjects/esriGeometry/esriSRUnitType.htm
    var esriSRUnitType;
    (function (esriSRUnitType) {
        esriSRUnitType[esriSRUnitType["Meter"] = 9001] = "Meter";
        esriSRUnitType[esriSRUnitType["Kilometer"] = 9036] = "Kilometer";
    })(esriSRUnitType || (esriSRUnitType = {}));
    var Geometry = (function () {
        function Geometry(url) {
            this.ajax = new Ajax(url);
        }
        Geometry.prototype.lengths = function (data) {
            var req = lang.mixin({
                sr: 4326,
                calculationType: "geodesic",
                lengthUnit: esriSRUnitType.Meter,
                f: "pjson"
            }, data);
            req.polylines = JSON.stringify(req.polylines);
            return this.ajax.get(req);
        };
        Geometry.prototype.buffer = function (data) {
            var req = lang.mixin({
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
        };
        return Geometry;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Geometry;
    function run() {
        new Geometry("//sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer/lengths")
            .lengths({
            polylines: [{ "paths": [[[-117, 34], [-116, 34], [-117, 33]], [[-115, 44], [-114, 43], [-115, 43]]] }]
        })
            .then(function (value) {
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
            .then(function (value) {
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
    var Lrs = (function () {
        function Lrs(url) {
            this.ajax = new Ajax(url);
            this.ajax.options.use_jsonp = true;
        }
        Lrs.prototype.geometryToMeasure = function (data) {
            var req = lang.mixin({
                inSR: 4326,
                outSR: 4326,
                f: "pjson"
            }, data);
            req.locations = JSON.stringify(req.locations);
            return this.ajax.get(req);
        };
        Lrs.prototype.measureToGeometry = function (data) {
            var req = lang.mixin({
                outSR: 4326,
                f: "pjson"
            }, data);
            req.locations = JSON.stringify(req.locations);
            return this.ajax.get(req);
        };
        Lrs.prototype.translate = function (data) {
            var req = lang.mixin({
                tolerance: 0,
                f: "pjson"
            }, data);
            req.locations = JSON.stringify(req.locations);
            req.targetNetworkLayerIds = ("[" + req.targetNetworkLayerIds + "]");
            return this.ajax.get(req);
        };
        Lrs.prototype.queryAttributeSet = function (data) {
            var req = lang.mixin({
                outSR: 4326,
                f: "pjson"
            }, data);
            req.locations = JSON.stringify(req.locations);
            req.attributeSet = JSON.stringify(req.attributeSet);
            return this.ajax.get(req);
        };
        Lrs.prototype.checkEvents = function (data) {
            var req = lang.mixin({
                f: "pjson"
            }, data);
            return this.ajax.get(req);
        };
        Lrs.prototype.geometryToStation = function (data) {
            var req = lang.mixin({
                f: "pjson"
            }, data);
            return this.ajax.get(req);
        };
        Lrs.prototype.stationToGeometry = function (data) {
            var req = lang.mixin({
                f: "pjson"
            }, data);
            return this.ajax.get(req);
        };
        return Lrs;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
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
        }).then(function (value) {
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
        }).then(function (value) {
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
        }).then(function (value) {
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
        }).then(function (value) {
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
    /**
     * mapserver export
     */
    var Export = (function () {
        function Export(url) {
            this.ajax = new Ajax(url);
            this.ajax.options.use_jsonp = true;
        }
        Export.prototype.export = function (data) {
            var req = lang.mixin({
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
        };
        return Export;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Export;
    function run() {
        new Export("//sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/export")
            .export({
            bbox: [-82.4, 34.85, -82.25, 35]
        })
            .then(function (value) {
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
    /**
     * mapserver find
     */
    var Find = (function () {
        function Find(url) {
            this.ajax = new Ajax(url);
            this.ajax.options.use_jsonp = true;
        }
        Find.prototype.find = function (data) {
            var req = lang.mixin({
                sr: 4326,
                f: "pjson"
            }, data);
            req.layers = req.layers.join(",");
            return this.ajax.get(req);
        };
        return Find;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Find;
    function run() {
        new Find("//sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/find")
            .find({
            searchText: "island",
            layers: ["0"]
        })
            .then(function (value) {
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
    /**
     * mapserver identify
     */
    var Identify = (function () {
        function Identify(url) {
            this.ajax = new Ajax(url);
            this.ajax.options.use_jsonp = true;
        }
        Identify.prototype.identify = function (data) {
            var req = lang.mixin({
                sr: 4326,
                tolerance: 10,
                f: "pjson"
            }, data);
            req.mapExtent = req.mapExtent.join(",");
            req.imageDisplay = (req.imageDisplay.width + "," + req.imageDisplay.height + "," + req.imageDisplay.dpi);
            return this.ajax.get(req);
        };
        return Identify;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
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
            .then(function (value) {
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
    /**
     * mapserver query
     */
    var Query = (function () {
        function Query(url) {
            this.ajax = new Ajax(url);
            this.ajax.options.use_jsonp = true;
        }
        Query.prototype.query = function (data) {
            var req = lang.mixin({
                inSR: 4326,
                outSR: 4326,
                f: "pjson"
            }, data);
            if (req.outFields)
                req.outFields = req.outFields.join(",");
            return this.ajax.get(req);
        };
        return Query;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Query;
    function run() {
        new Query("//sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StateCityHighway_USA/MapServer/1/query")
            .query({
            text: "South Carolina"
        })
            .then(function (value) { return console.log("query", value); });
    }
    exports.run = run;
});
/**
 * http://resources.arcgis.com/EN/HELP/REST/APIREF/INDEX.HTML?REVERSE.HTML
 */
define("labs/ags-reverse-geocode-proxy", ["require", "exports", "dojo/_base/lang", "labs/ajax"], function (require, exports, lang, Ajax) {
    "use strict";
    var ReverseGeocode = (function () {
        function ReverseGeocode(url) {
            this.ajax = new Ajax(url);
            this.ajax.options.use_jsonp = true;
        }
        ReverseGeocode.prototype.reverseGeocode = function (data) {
            var req = lang.mixin({
                outSRS: "wkid:4326",
                distance: 10,
                langCode: "en",
                forStorage: false,
                returnIntersection: false,
                f: "pjson"
            }, data);
            return this.ajax.get(req);
        };
        return ReverseGeocode;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = ReverseGeocode;
    function run() {
        new ReverseGeocode("//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode")
            .reverseGeocode({
            location: "-82.407548,34.790207"
        })
            .then(function (value) {
            console.log("ReverseGeocode", value.address);
            console.log(value);
        });
    }
    exports.run = run;
});
define("labs/data/route01", ["require", "exports"], function (require, exports) {
    "use strict";
    var center = {
        "x": -115.256673787042,
        "y": 36.194162517804
    };
    var route = {
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
            }],
        "responseStatus": {
            "severity": "Success"
        }
    };
    route.data.forEach(function (data, j) {
        data.startLocation = data.endLocation = {
            x: center.x + 0.001 * (1 - Math.random()),
            y: center.y + 0.001 * (1 - Math.random())
        };
        data.routeItems.forEach(function (item, i) {
            item.location.x = center.x + 0.001 * (1 + i * Math.random() + j);
            item.location.y = center.y + 0.001 * (1 + i + j * Math.random());
        });
    });
    return route;
});
define("labs/ags-route-editor", ["require", "exports", "labs/data/route01", "esri/map", "esri/layers/GraphicsLayer", "esri/graphic", "esri/geometry/Point", "esri/geometry/Polyline", "esri/SpatialReference", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/TextSymbol", "esri/Color", "esri/InfoTemplate", "dojo/_base/event", "esri/symbols/Font", "esri/toolbars/edit", "esri/geometry/Extent"], function (require, exports, route, Map, GraphicsLayer, Graphic, Point, Polyline, SpatialReference, SimpleMarkerSymbol, SimpleLineSymbol, TextSymbol, Color, InfoTemplate, event, Font, Edit, Extent) {
    "use strict";
    var epsg4326 = new SpatialReference("4326");
    var epsg3857 = new SpatialReference("102100");
    var delta = 32;
    var colors = [new Color("#ffa800"), new Color("#1D5F8A"), new Color("yellow")];
    var white = new Color("white");
    var red = new Color("red");
    var editorLineStyle = {
        color: [0, 255, 0],
        width: 3,
        type: "esriSLS",
        style: "esriSLSDash"
    };
    var editorVertexStyle = {
        color: [0, 255, 0, 60],
        size: delta * 3 / 4,
        type: "esriSMS",
        style: "esriSMSCircle",
        outline: {
            color: [0, 255, 0, 255],
            width: 3,
            type: "esriSLS",
            style: "esriSLSSolid"
        }
    };
    var editorGhostVertexStyle = JSON.parse(JSON.stringify(editorVertexStyle));
    editorGhostVertexStyle.color = [255, 255, 255, 255];
    editorGhostVertexStyle.size /= 4;
    editorGhostVertexStyle.outline.width /= 2;
    function first(arr, filter) {
        var result;
        return arr.some(function (v) { result = v; return filter(v); }) ? result : undefined;
    }
    function indexOf(arr, filter) {
        var result;
        return arr.some(function (v, i) { result = i; return filter(v); }) ? result : undefined;
    }
    function asGeom(location) {
        return new Point(location.x, location.y);
    }
    var RouteViewer;
    (function (RouteViewer) {
        ;
        ;
        var RouteView = (function () {
            function RouteView(options) {
                var _this = this;
                this.options = options;
                var map = options.map;
                var layer = this.layer = new GraphicsLayer();
                options.map.addLayer(layer);
                this.routes = [];
                this.orphans = [];
                route.data.map(function (data, colorIndex) { return _this.add({
                    route: data,
                    color: colors[colorIndex % colors.length]
                }); }).forEach(function (route) { return _this.redraw(route); });
            }
            RouteView.prototype.removeRoute = function (route) {
                var routeIndex = (typeof route === "number") ? route : this.routes.indexOf(route);
                return this.routes.splice(routeIndex, 1)[0];
            };
            RouteView.prototype.removeOrphan = function (stop) {
                var index = this.orphans.indexOf(stop);
                this.orphans.splice(index, 1);
            };
            RouteView.prototype.addOrphan = function (stop) {
                this.orphans.push(stop);
            };
            RouteView.prototype.removeStop = function (route, stop) {
                var routeIndex = (typeof route === "number") ? route : this.routes.indexOf(route);
                var stopIndex = (typeof stop === "number") ? stop : this.routes[routeIndex].stops.indexOf(stop);
                console.log("removeStop from route " + routeIndex + " at position " + stopIndex);
                return this.routes[routeIndex].stops.splice(stopIndex, 1)[0];
            };
            RouteView.prototype.addStop = function (route, stop, stopIndex) {
                var routeIndex = (typeof route === "number") ? route : this.routes.indexOf(route);
                console.log("addStop to route " + routeIndex + " at position " + stopIndex);
                return this.routes[routeIndex].stops.splice(stopIndex, 0, stop)[0];
            };
            RouteView.prototype.moveStop = function (stop, location) {
                stop.stop.setGeometry(location);
                stop.label.setGeometry(location);
            };
            RouteView.prototype.addToLayer = function (info) {
                var isStop = function (object) { return 'stop' in object; };
                if (isStop(info)) {
                    this.layer.add(info.stop);
                    this.layer.add(info.label);
                }
                else {
                    this.layer.add(info.underlay);
                    this.layer.add(info.routeLine);
                }
            };
            RouteView.prototype.add = function (args) {
                var _this = this;
                var routeInfo = {
                    color: args.color,
                    routeLine: null,
                    stops: null,
                    startLocation: null,
                    endLocation: null
                };
                this.routes.push(routeInfo);
                if (1) {
                    routeInfo.stops = args.route.routeItems.map(function (item, itemIndex) {
                        var geometry = asGeom(item.location);
                        var circleSymbol = new SimpleMarkerSymbol({
                            type: "esriSMS",
                            style: "esriSMSCircle",
                            size: delta,
                            color: routeInfo.color,
                            outline: {
                                type: "esriSLS",
                                style: "esriSLSSolid",
                                color: white,
                                width: delta / 8
                            }
                        });
                        var textSymbol = new TextSymbol({
                            text: (1 + itemIndex + ""),
                            font: new Font(delta / 2),
                            color: white,
                            yoffset: -delta / 6,
                            haloColor: args.color,
                            haloSize: 1
                        });
                        var attributes = {};
                        var template = new InfoTemplate(function () { return (args.route.employeeFullName + " " + item.activity.moniker + " " + item.activity.primaryKey); }, function () { return ("" + JSON.stringify(item)); });
                        var stop = new Graphic(geometry, circleSymbol, attributes, template);
                        var label = new Graphic(geometry, textSymbol);
                        return {
                            stop: stop,
                            label: label
                        };
                    });
                    routeInfo.stops.forEach(function (stop) { return _this.addToLayer(stop); });
                }
                if (1) {
                    var lineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, white, delta / 8);
                    var circleSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, delta, lineSymbol, args.color);
                    var textSymbol = new TextSymbol({ text: "X" });
                    if (args.route.startLocation) {
                        var geom = asGeom(args.route.startLocation);
                        routeInfo.startLocation = {
                            stop: new Graphic(geom, circleSymbol),
                            label: new Graphic(geom, textSymbol)
                        };
                        this.addToLayer(routeInfo.startLocation);
                    }
                    if (args.route.endLocation) {
                        var geom = asGeom(args.route.endLocation);
                        routeInfo.endLocation = {
                            stop: new Graphic(geom, circleSymbol),
                            label: new Graphic(geom, textSymbol)
                        };
                        this.addToLayer(routeInfo.endLocation);
                    }
                }
                return routeInfo;
            };
            RouteView.prototype.redraw = function (route) {
                route.stops.forEach(function (stop, itemIndex) {
                    stop.stop.symbol.color = route.color;
                    stop.label.symbol.text = (1 + itemIndex + "");
                    stop.stop.getShapes().forEach(function (s) { return s.moveToFront(); });
                    stop.label.getShapes().forEach(function (s) { return s.moveToFront(); });
                    stop.stop.draw();
                    stop.label.draw();
                });
                {
                    var getGeom = function () {
                        var stops = [].concat(route.stops);
                        route.startLocation && stops.unshift(route.startLocation);
                        route.endLocation && stops.push(route.endLocation);
                        var path = stops.map(function (stop) { return stop.stop.geometry; }).map(function (p) { return [p.getLongitude(), p.getLatitude()]; });
                        return new Polyline(path);
                    };
                    if (!route.routeLine) {
                        route.routeLine = {
                            routeLine: new Graphic(getGeom(), new SimpleLineSymbol(SimpleLineSymbol.STYLE_SHORTDOT, route.color, 4)),
                            underlay: new Graphic(getGeom(), new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, white, 6))
                        };
                        this.addToLayer(route.routeLine);
                    }
                    else {
                        route.routeLine.underlay.setGeometry(getGeom());
                        route.routeLine.routeLine.setGeometry(route.routeLine.underlay.geometry);
                    }
                    route.routeLine.routeLine.getShapes().forEach(function (s) { return s.moveToBack(); });
                    route.routeLine.underlay.getShapes().forEach(function (s) { return s.moveToBack(); });
                }
                this.orphans.forEach(function (stop, itemIndex) {
                    stop.label.symbol.text = (1 + itemIndex + "");
                    stop.stop.symbol.color = red;
                    stop.stop.draw();
                    stop.label.draw();
                });
            };
            RouteView.prototype.edit = function (editor, graphic, options) {
                var _this = this;
                // ensures callbacks are unregistered
                editor.deactivate();
                var activeRoute = first(this.routes, function (route) {
                    if (graphic === route.routeLine.routeLine)
                        return true;
                    if (graphic === route.routeLine.underlay)
                        return true;
                    if (graphic.geometry.type === "point") {
                        return !!first(route.stops, function (stop) { return stop.stop === graphic || stop.label === graphic; });
                    }
                });
                if (activeRoute) {
                    editor.activate(Edit.EDIT_VERTICES, activeRoute.routeLine.routeLine);
                }
                else {
                    console.log("cannot determine route");
                    return;
                }
                var isActiveVertexMinor;
                var activeVertexIndex;
                var targetRoute = null && activeRoute;
                var activeStop = null && activeRoute.stops[0];
                var targetStop = null && activeRoute.stops[0];
                var activeLocation;
                var doit = function () {
                    console.log("change");
                    var isSameStop = activeStop === targetStop;
                    var isSameRoute = targetRoute === activeRoute;
                    var isRemoveActiveStop = activeStop && !isActiveVertexMinor && !options.moveStop && !isSameStop;
                    var isMoveActiveStop = activeStop && !isActiveVertexMinor && options.moveStop && (!targetStop || isSameStop);
                    var isAddTargetStop = !!targetStop && !isSameStop;
                    var isOrphan = !targetRoute && targetStop;
                    if (isSameStop) {
                        console.log("dnd onto same stop does nothing");
                    }
                    if (isRemoveActiveStop) {
                        _this.removeStop(activeRoute, activeStop);
                        _this.addOrphan(activeStop);
                    }
                    if (isAddTargetStop) {
                        targetRoute && _this.removeStop(targetRoute, targetStop);
                        isOrphan && _this.removeOrphan(targetStop);
                        _this.addStop(activeRoute, targetStop, activeVertexIndex - (activeRoute.startLocation ? 1 : 0));
                    }
                    if (isMoveActiveStop) {
                        _this.moveStop(activeStop, activeLocation);
                    }
                    !isSameRoute && targetRoute && _this.redraw(targetRoute);
                    _this.redraw(activeRoute);
                    _this.edit(editor, activeRoute.routeLine.routeLine, options);
                };
                var handles = [
                    editor.on("vertex-move-start", function (args) {
                        // were on the move!
                        isActiveVertexMinor = args.vertexinfo.isGhost;
                        activeVertexIndex = args.vertexinfo.pointIndex;
                        activeStop = !isActiveVertexMinor && activeRoute.stops[activeVertexIndex - (activeRoute.startLocation ? 1 : 0)];
                    }),
                    editor.on("vertex-move-stop", function (args) {
                        if (args.vertexinfo.pointIndex !== activeVertexIndex)
                            return;
                        // does it intersect with another stop?
                        console.log("vertext-move-stop");
                        var routeLine = activeRoute.routeLine;
                        var pointIndex = args.vertexinfo.pointIndex;
                        var segmentIndex = args.vertexinfo.segmentIndex;
                        activeLocation = routeLine.routeLine.geometry.getPoint(segmentIndex, pointIndex);
                        // convert to pixel and find an intersecting stop
                        var map = _this.options.map;
                        var extent = map.extent;
                        var _a = [map.width, map.height], width = _a[0], height = _a[1];
                        var pixel = map.toScreen(activeLocation);
                        pixel.x -= delta / 2;
                        pixel.y -= delta / 2;
                        var topLeft = map.toMap(pixel);
                        pixel.x += delta;
                        pixel.y += delta;
                        var bottomRight = map.toMap(pixel);
                        extent = new Extent(topLeft.x, bottomRight.y, bottomRight.x, topLeft.y, map.spatialReference);
                        targetRoute = first(_this.routes, function (route) {
                            targetStop = first(route.stops, function (stop) { return extent.contains(stop.stop.geometry); });
                            return !!targetStop;
                        });
                        if (!targetRoute) {
                            targetStop = first(_this.orphans, function (stop) { return extent.contains(stop.stop.geometry); });
                        }
                        doit();
                    }),
                    editor.on("vertex-move", function (args) {
                        // does it intersect with another stop?
                    }),
                    editor.on("vertex-add", function (args) {
                        // does it intersect with another stop?
                    }),
                    editor.on("deactivate", function (evt) {
                        // stop listening for editor events
                        handles.forEach(function (h) { return h.remove(); });
                    }),
                ];
            };
            return RouteView;
        }());
        RouteViewer.RouteView = RouteView;
    })(RouteViewer = exports.RouteViewer || (exports.RouteViewer = {}));
    function run() {
        var map = new Map(document.getElementById("map"), {
            center: [-115.257, 36.194],
            zoom: 16,
            basemap: 'streets'
        });
        {
            var editor_1 = new Edit(map, {
                allowAddVertices: true,
                allowDeleteVertices: false,
                ghostLineSymbol: new SimpleLineSymbol(editorLineStyle),
                vertexSymbol: new SimpleMarkerSymbol(editorVertexStyle),
                ghostVertexSymbol: new SimpleMarkerSymbol(editorGhostVertexStyle)
            });
            var routeView_1 = new RouteViewer.RouteView({
                map: map,
                route: route
            });
            map.on("click", function () {
                console.log("map click");
                editor_1.deactivate();
            });
            routeView_1.layer.on("click", function (args) {
                event.stop(args);
                routeView_1.edit(editor_1, args.graphic, {
                    moveStop: args.shiftKey
                });
            });
        }
    }
    exports.run = run;
});
define("labs/ags-solve-proxy", ["require", "exports", "labs/ajax"], function (require, exports, Ajax) {
    "use strict";
    var BaseSolve = (function () {
        function BaseSolve(url) {
            this.ajax = new Ajax(url);
        }
        BaseSolve.prototype.solve = function (data) {
            return this.ajax.get(data);
        };
        ;
        return BaseSolve;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = BaseSolve;
    function run() {
        console.log("this is an abstract class for route, closest facility and service area");
    }
    exports.run = run;
});
define("labs/ags-route-solve-proxy", ["require", "exports", "labs/ags-solve-proxy", "dojo/_base/lang"], function (require, exports, ags_solve_proxy_1, lang) {
    "use strict";
    /**
     * http://sampleserver6.arcgisonline.com/arcgis/sdk/rest/index.html#/Network_Layer/02ss0000009p000000/
     */
    var RouteSolve = (function (_super) {
        __extends(RouteSolve, _super);
        function RouteSolve() {
            _super.apply(this, arguments);
        }
        /**
         * http://sampleserver6.arcgisonline.com/arcgis/sdk/rest/index.html#/Solve_Route/02ss0000001t000000/
         */
        RouteSolve.prototype.solve = function (data) {
            var req = lang.mixin({
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
            req.stops = data.stops.map(function (p) { return (p.x + "," + p.y); }).join(';');
            return this.ajax.get(req);
        };
        return RouteSolve;
    }(ags_solve_proxy_1.default));
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = RouteSolve;
    function run() {
        new RouteSolve("//sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/Route/solve")
            .solve({ stops: [{ x: -117.141724, y: 32.7122 }, { x: -117.141724, y: 32.72 }] })
            .then(function (value) {
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
    var ServiceAreaSolve = (function (_super) {
        __extends(ServiceAreaSolve, _super);
        function ServiceAreaSolve() {
            _super.apply(this, arguments);
        }
        ServiceAreaSolve.prototype.solve = function (data) {
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
            var req = lang.mixin({
                travelDirection: "esriNATravelDirectionFromFacility",
                returnFacilities: false,
                f: "pjson"
            }, data);
            return this.ajax.get(req);
        };
        return ServiceAreaSolve;
    }(ags_solve_proxy_2.default));
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = ServiceAreaSolve;
    function run() {
        new ServiceAreaSolve("//sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/ServiceArea/solveServiceArea")
            .solve({
            facilities: "-117.141724,32.7122",
            returnFacilities: true,
            outSR: 4326
        })
            .then(function (value) {
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
    var Suggest = (function () {
        function Suggest(url) {
            this.ajax = new Ajax(url);
        }
        Suggest.prototype.suggest = function (data) {
            var req = lang.mixin({
                f: "pjson",
                category: "Address",
                countryCode: "USA"
            }, data);
            return this.ajax.get(req);
        };
        return Suggest;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Suggest;
    function run() {
        new Suggest("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest")
            .suggest({ text: "50 Datastream Plaza, Greenville SC" })
            .then(function (value) {
            // how to get route to return json?
            console.log("text", value.suggestions.map(function (s) { return s.text; }));
            console.log(value);
        });
    }
    exports.run = run;
});
define("labs/ags-webmap", ["require", "exports", "esri/arcgis/utils", "esri/arcgis/OAuthInfo", "esri/IdentityManager"], function (require, exports, utils, OAuthInfo, IdentityManager) {
    "use strict";
    //https://www.arcgis.com/sharing/oauth2/approve?oauth_state=GD6ps1QHrIq-evMlDEj9BkwQqP8qtCMm-r1-zNkUobLFtk4E04D7TJ4Cn0pkeZ56svApgSHK9iRY7HasLI4YrUYIP5wunF_syiATUiY4hyenri_P2OazODUVl28SwOONAOZKzbRVIHamNdtpSo_sBtl_ahDqHArMbiV3dxkDMgr5eLWYpaJxFpGIdMpj0bjaSz_OcgrHej3jmUT-RBRlQrKhgFdHmFmf0k8zhfKIYx8GnlzS6BqZqNo8Hz0ZIpQuTAfza-qg4ZyhMS8DhEI377hLlrb5PMcTeDl7-NpMlfyDjWHecmI0OmOLEOaMSy58LYaFJtZIH46c7fKvE5ESZg..
    // https://www.arcgis.com/sharing/oauth2/authorize?client_id=313b7327133f4802affee46893b4bec7&response_type=token&state=%7B%22portalUrl%22%3A%22https%3A%2F%2Fwww.arcgis.com%22%7D&expiration=20160&redirect_uri=http%3A%2F%2Flocalhost%2Fags-lab%2Foauth-callback.html
    function run(appId) {
        if (appId === void 0) { appId = "vK2LJni4ozSNXdmj"; }
        debugger;
        "hereiam: cannot access without OAUTH configuration...read email from Brian";
        var response = {
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
        var id = IdentityManager;
        id.registerOAuthInfos([info]);
        console.log("info", info, "id", id);
        var cred = id.getCredential(info.portalUrl + "/sharing").then(function () {
            debugger;
        }).otherwise(function () {
        });
        id.checkSignInStatus(info.portalUrl + "/sharing").then(function () {
            debugger;
        }).otherwise(function () {
        });
        false && utils.createMap(appId, "map").then(function (response) {
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
    function run() {
        var content = document.getElementById("console");
        if (!content)
            return;
        var log = console.log;
        console.log = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            log.apply(console, args);
            var div = document.createElement("textarea");
            div.innerText = args.map(JSON.stringify).join(" ");
            content.insertBefore(div, null);
        };
    }
    exports.run = run;
});
define("labs/index", ["require", "exports"], function (require, exports) {
    "use strict";
    function run() {
        var l = window.location;
        var path = "" + l.origin + l.pathname + "?run=labs/";
        var labs = "\n    ags-catalog-proxy\n    ags-feature-proxy\n    ags-feature-query-proxy\n    ags-find-address-proxy\n    ags-find-proxy\n    ags-geometry-proxy\n    ags-lrs-proxy\n    ags-map-export-proxy\n    ags-map-find-proxy\n    ags-map-identify-proxy\n    ags-map-query-proxy\n    ags-reverse-geocode-proxy\n    ags-route-editor\n    ags-route-solve-proxy\n    ags-servicearea-solve-proxy\n    ags-solve-proxy\n    ags-suggest-proxy\n    ags-webmap\n    index\n    maplet\n    pubsub    \n    ";
        var styles = document.createElement("style");
        document.head.appendChild(styles);
        styles.innerText += "\n    #map {\n        display: none;\n    }\n    .test {\n        margin: 20px;\n    }\n    ";
        var labDiv = document.createElement("div");
        document.body.appendChild(labDiv);
        labDiv.innerHTML = labs
            .split(/ /)
            .map(function (v) { return v.trim(); })
            .filter(function (v) { return !!v; })
            .map(function (lab) { return ("<div class='test'><a href='" + path + lab + "&debug=1'>" + lab + "</a></div>"); })
            .join("\n");
        var testDiv = document.createElement("div");
        document.body.appendChild(testDiv);
    }
    exports.run = run;
    ;
});
define("labs/pubsub", ["require", "exports"], function (require, exports) {
    "use strict";
    var PubSub = (function () {
        function PubSub() {
            this.topics = {};
        }
        PubSub.prototype.subscribe = function (topic, listener) {
            var _this = this;
            if (!this.topics[topic])
                this.topics[topic] = [];
            var index = this.topics[topic].push(listener) - 1;
            return {
                remove: function () { return delete _this.topics[topic][index]; }
            };
        };
        PubSub.prototype.publish = function (topic, info) {
            if (info === void 0) { info = {}; }
            if (!this.topics[topic])
                return;
            this.topics[topic].forEach(function (item) { return item(info); });
        };
        return PubSub;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = PubSub;
    function run() {
        var topic = new PubSub();
        topic.subscribe("hello", function (args) { return console.log("hello", args); });
        topic.publish("hello", 1);
    }
    exports.run = run;
});
define("labs/maplet", ["require", "exports", 'dojo/dom-construct', "labs/pubsub", "esri/map", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/geometry/Point", "esri/geometry/Polygon", "esri/graphic", "esri/renderers/HeatmapRenderer", "esri/layers/FeatureLayer", "esri/layers/ArcGISTiledMapServiceLayer", "esri/layers/ArcGISDynamicMapServiceLayer"], function (require, exports, domConstruct, pubsub_1, Map, MarkerSymbol, LineSymbol, FillSymbol, Point, Polygon, Graphic, HeatmapRenderer, FeatureLayer, ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer) {
    "use strict";
    var topic = new pubsub_1.default();
    var asList = function (nodeList) {
        var result = [];
        for (var i = 0; i < nodeList.length; i++) {
            result.push(nodeList[i]);
        }
        return result;
    };
    var html = "\n<br/><label for=\"geometry\">Add Geometry To Map</label>\n<br/><textarea id=\"geometry\">[-82.4,34.85]</textarea>\n<br/><button data-event=\"add-geometry-to-map\">Add</button>\n";
    function watchers() {
        /** add the geometry to the map  */
        topic.subscribe("add-geometry-to-map", function () {
            var textarea = document.getElementById("geometry");
            var geomText = textarea.value;
            var geomJs = JSON.parse(geomText);
            if ("x" in geomJs)
                geomJs = [geomJs];
            if (Array.isArray(geomJs)) {
                var items = geomJs;
                if (typeof geomJs[0]["x"] !== "undefined") {
                    items.forEach(function (item) { return topic.publish("add-point", item); });
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
        var events = asList(document.querySelectorAll("[data-event]"));
        events.forEach(function (e) { return e.addEventListener("click", function () { return topic.publish(e.dataset["event"], e); }); });
    }
    var Maplet = (function () {
        function Maplet(element) {
            var map = new Map(element, {
                center: new Point(-122, 37)
            });
            this.map = map;
        }
        // 3857
        Maplet.prototype.addBasemap = function (url) {
            if (url === void 0) { url = "//services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"; }
            var layer = new ArcGISTiledMapServiceLayer(url, {});
            this.map.addLayer(layer);
            return layer;
        };
        // 4326
        Maplet.prototype.addDynamicLayer = function (url) {
            if (url === void 0) { url = "//sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Population_World/MapServer"; }
            var layer = new ArcGISDynamicMapServiceLayer(url);
            layer.setOpacity(0.5);
            this.map.addLayer(layer);
            return layer;
        };
        // 4326
        Maplet.prototype.addFeatureLayer = function (url) {
            if (url === void 0) { url = "//services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Earthquakes_Since_1970/FeatureServer/0"; }
            var layer = new FeatureLayer(url, {
                mode: FeatureLayer.MODE_SNAPSHOT,
                outFields: ["Name", "Magnitude"]
            });
            this.map.addLayer(layer);
            return layer;
        };
        // 4326
        Maplet.prototype.addHeatmap = function (url) {
            if (url === void 0) { url = "//services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Earthquakes_Since_1970/FeatureServer/0"; }
            var layer = this.addFeatureLayer(url);
            var heatmapOption = {};
            heatmapOption.colors = ["rgba(0,0,0,0.1)", "rgba(0,0,255,0.5)"];
            heatmapOption.field = "Magnitude";
            heatmapOption.blurRadius = 8;
            heatmapOption.minPixelIntensity = 0;
            heatmapOption.maxPixelIntensity = 250;
            var heatmapRenderer = new HeatmapRenderer(heatmapOption);
            layer.setRenderer(heatmapRenderer);
            return layer;
        };
        Maplet.prototype.measure = function () {
        };
        return Maplet;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Maplet;
    function run() {
        watchers();
        var el = document.getElementById('map');
        var map = new Maplet(el);
        //map.addDynamicLayer();
        map.addBasemap();
        //map.addHeatmap();
        //map.addFeatureLayer();
        topic.subscribe("add-point", function (point) {
            var geom = new Point(point.x, point.y);
            var g = new Graphic(geom, new MarkerSymbol());
            map.map.graphics.add(g);
            map.map.centerAt(geom);
        });
        topic.subscribe("add-polyline", function (points) {
            var geom = new Polygon(points);
            var g = new Graphic(geom, new LineSymbol());
            map.map.graphics.add(g);
            map.map.setExtent(geom.getExtent());
        });
        topic.subscribe("add-polygon", function (points) {
            var geom = new Polygon(points);
            var g = new Graphic(geom, new FillSymbol());
            map.map.graphics.add(g);
            map.map.setExtent(geom.getExtent());
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
    var geometryService = Config.defaults.geometryService = new GeometryService("https://sampleserver6.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer");
    /**
     * Giving SystemJS a try to transform coordinates to 4326 before using geodesy to calculate distances
     */
    var distanceTo = function (points) {
        var d = new Deferred();
        System.import("proj4").then(function (proj4) {
            var epsg4326 = new proj4.Proj("EPSG:4326");
            var epsg3857 = new proj4.Proj("EPSG:3857");
            var transform = proj4(epsg3857, epsg4326);
            points = points.map(function (p) { return transform.forward(p); });
            System.import("geodesy").then(function (geodesy) {
                var geodesyPoints = points.map(function (p) { return new geodesy.LatLonSpherical(p[1], p[0]); });
                var distance = 0;
                for (var i = 1; i < geodesyPoints.length; i++)
                    distance += geodesyPoints[i - 1].distanceTo(geodesyPoints[i]);
                d.resolve({
                    distance: distance
                });
            });
        });
        return d;
    };
    function run() {
        var map = new Map("map", {
            basemap: "dark-gray",
            center: [-82.39, 34.85],
            zoom: 15
        });
        var scalebar = new Scalebar({
            map: map,
            scalebarUnit: "dual"
        });
        var measurement = new Measurement({
            map: map,
            advancedLocationUnits: true,
            defaultAreaUnit: Units.SQUARE_METERS,
            defaultLengthUnit: Units.METERS
        }, document.getElementById("measurement"));
        measurement.on("measure-end", function (args) {
            console.log("measure", args);
            switch (args.geometry.type) {
                case "point":
                    break;
                case "polyline":
                    // geodesy library
                    distanceTo(args.geometry.paths[0]).then(function (args) {
                        console.log("geodesy", args.distance);
                    });
                    // esri geometry service
                    var lengths_1 = new LengthsParameters();
                    lengths_1.geodesic = false;
                    lengths_1.polylines = [args.geometry];
                    geometryService.lengths(lengths_1, function (args) {
                        console.log("planar lengths", args.lengths);
                        lengths_1.geodesic = true;
                        geometryService.lengths(lengths_1, function (args) {
                            console.log("geodesic lengths", args.lengths);
                        });
                    });
                    break;
                default:
                    break;
            }
            if (false) {
                var buffer = new BufferParameters();
                buffer.geodesic = true;
                buffer.bufferSpatialReference = map.spatialReference;
                buffer.geometries = [args.geometry];
                buffer.outSpatialReference = map.spatialReference;
                buffer.distances = [1];
                buffer.unit = GeometryService.UNIT_METER;
                geometryService.buffer(buffer, function (bufferedGeometries) {
                    var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]));
                    var graphics = bufferedGeometries.map(function (g) { return new Graphic(g, symbol); });
                    graphics.forEach(function (g) { return map.graphics.add(g); });
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
    var config = {
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
        var r = [];
        for (var i = 0; i < l.length; i++) {
            r.push(l[i]);
        }
        return r;
    }
    ;
    function getRoutes(routesDom, config) {
        var manager = new RouteManager(routesDom, config);
        manager.createRoutes().then(function () {
            manager.addCommand({ text: "Refresh", execute: function () {
                    manager.routingService.createRoutes().then(function (routes) {
                        console.log("refreshed routes", routes);
                        manager.destroyRoutes();
                        manager.createRoutes();
                    });
                } });
            manager.addCommand({ text: "Create Test Routes", execute: function () {
                    manager.routingService.forceSampleRoutes().then(function (routes) {
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
    var RouteManager = (function () {
        function RouteManager(routesDom, config) {
            this.routesDom = routesDom;
            this.config = config;
            this.template = "<div class=\"routes\"></div><div class=\"commands\"></div>";
            this._widgets = [];
            this.routeItemMap = {};
            this.routingService = new Services.Routing(config.restapi);
            domConstruct.place(this.template, routesDom);
        }
        Object.defineProperty(RouteManager.prototype, "routes", {
            get: function () {
                return this.routesDom.getElementsByClassName("routes")[0];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RouteManager.prototype, "commands", {
            get: function () {
                return this.routesDom.getElementsByClassName("commands")[0];
            },
            enumerable: true,
            configurable: true
        });
        RouteManager.prototype.destroyRoutes = function () {
            while (this._widgets.length) {
                this._widgets.pop().destroy();
            }
        };
        RouteManager.prototype.createRoutes = function () {
            var _this = this;
            var status = document.createElement("label");
            status.classList.add("status", "hidden");
            this.routesDom.appendChild(status);
            this._widgets.push({ destroy: function () { return _this.routesDom.removeChild(status); } });
            var h = setInterval(function () {
                status.innerHTML += ".";
            }, 2000);
            var reportStatus = function (text) {
                status.classList.remove("hidden");
                status.innerHTML = text + "&nbsp;";
                status.title = text;
            };
            var removeStatus = function () {
                clearInterval(h);
                status.classList.add("hidden");
            };
            reportStatus("Authenticating");
            return this.routingService.auth(this.config.auth)
                .then(function () {
                reportStatus("Getting routes");
                return _this.routingService.getRoutes()
                    .then(function (routes) {
                    removeStatus();
                    if (!routes.data.length) {
                        reportStatus("No routes found");
                    }
                    routes.data.map(function (route, i) {
                        // create a container
                        {
                            var routeNode_1 = domConstruct.toDom(_this.routeTemplate(route));
                            _this.routes.appendChild(routeNode_1);
                            _this._widgets.push({ destroy: function () { return routeNode_1.parentNode.removeChild(routeNode_1); } });
                        }
                        _this.initializeDirections("EMP_" + route.employeeId, _this.config.map, route, "red,green,blue".split(",")[i % 3]);
                    });
                    _this.parse();
                })
                    .catch(function () {
                    var msg = "failed to get routes";
                    console.error(msg, _this.config.auth.username);
                    reportStatus(msg);
                    clearInterval(h);
                    throw msg;
                });
            })
                .catch(function () {
                var msg = "failed to authenticate";
                console.error(msg, _this.config.auth.username);
                reportStatus(msg);
                throw msg;
            });
        };
        RouteManager.prototype.addCommand = function (cmd) {
            var button = domConstruct.create("button", {
                className: "ipsOptimizeButton",
                innerHTML: cmd.text
            });
            on(button, "click", function () { return cmd.execute(); });
            domConstruct.place(button, this.commands);
        };
        RouteManager.prototype.parse = function () {
            var togglers = toArray(document.getElementsByClassName("toggler"));
            togglers.forEach(function (t) {
                var doit = function () {
                    var target = document.getElementById(t.dataset['ipsTogglerFor']);
                    t.checked ? target.classList.remove("hidden") : target.classList.add("hidden");
                };
                t.addEventListener("click", doit);
                doit();
            });
        };
        RouteManager.prototype.getActivityName = function (routeItem) {
            return routeItem.activityType + " #" + routeItem.id;
        };
        RouteManager.prototype.initializeDirections = function (id, map, route, zoneId) {
            var _this = this;
            if (zoneId === void 0) { zoneId = "blue"; }
            var zone = config.zones.filter(function (z) { return z.name === zoneId; })[0];
            var marker = new SimpleMarkerSymbol({
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
            var routeLines = new SimpleLineSymbol("solid", new Color(zone.color), 3);
            routeLines.color.a = 0.5;
            var updateRoute = debounce(function () {
                console.log("notify services of change");
                var routeItems = w.stops.map(function (s) { return _this.routeItemMap[s.name]; });
                routeItems.forEach(function (r, i) { return r.ordinalIndex = i + 1; });
                _this.routingService.updateRoute(route.id, routeItems.map(function (i) { return i.id; })).catch(function () {
                    console.error("failed to update the route", route.id);
                });
            }, 500);
            var infoTemplate = new InfoTemplate();
            var routeParams = new RouteParams();
            routeParams.returnDirections = false;
            routeParams.preserveLastStop = false;
            routeParams.startTime; // TODO
            var w = new DirectionsWidget({
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
            w.zoomToFullRoute = function () {
                // not allowed
            };
            var actionsPane = map.infoWindow.domNode.getElementsByClassName("actionsPane")[0];
            actionsPane.classList.add("hidden");
            infoTemplate.setContent(function (args) {
                var routeItem = _this.routeItemMap[args.attributes.address];
                var data = routeItem;
                var keys = Object.keys(data).filter(function (k) { return typeof data[k] !== "Object"; });
                keys = "id,isActivityCompleted,scheduledDate,activityType,lastModifiedBy,lastModifiedDateTime".split(',');
                var body = domConstruct.toDom("" + keys.map(function (k) { return (k + ": " + data[k]); }).join("<br/>"));
                var showInfo = domConstruct.toDom("<a title=\"Show Info\" to=\"\" class=\"command showInfo\"><span>Show Info</span></a>");
                on(showInfo, "click", function () { return topic.publish("routing/show-info", routeItem.activity); });
                var commands = domConstruct.toDom("<div class=\"commands\"></div>");
                commands.appendChild(showInfo);
                body.appendChild(commands);
                return body;
            });
            infoTemplate.setTitle(function (args) {
                return "" + args.attributes.address;
            });
            w.on("segment-highlight", function (g) {
            });
            w.on("directions-clear", function () {
                //
            });
            w.on("directions-start", function () {
                // updateRoute();
            });
            w.on("directions-finish", function () {
                var stopIcons = w.domNode.getElementsByClassName("esriStopIcon");
                w.stops.forEach(function (s, i) {
                    var routeItem = _this.routeItemMap[s.name];
                    if (routeItem) {
                        // really want do know if the insp. has alreay been completed...
                        stopIcons[i].classList.add(routeItem.isActivityCompleted ? "COMPLETE" : "PENDING");
                    }
                });
            });
            w.on("directions-finish", function () {
                var groups = toArray(document.getElementById(id).getElementsByClassName("searchInputGroup"));
                groups = groups.filter(function (g) { return g.getElementsByClassName("ips-info").length === 0; });
                groups.forEach(function (g) {
                    var div = document.createElement("label");
                    div.classList.add("ips-info");
                    g.appendChild(div);
                });
            });
            w.startup();
            {
                var optimizeButton = document.createElement("button");
                optimizeButton.className = "ipsOptimizeButton";
                optimizeButton.innerHTML = "Optimize";
                var parent_1 = w.domNode.getElementsByClassName("esriStopsButtons")[0];
                parent_1.appendChild(optimizeButton);
                optimizeButton.onclick = function () {
                    w.reset();
                    _this.routingService.optimizeRoute(route.id).then(function (newRoute) {
                        route = newRoute.data;
                        w.clearDirections();
                        w.stops = [];
                        addStops();
                    });
                };
            }
            w.on("load", function () {
                var stopLayer = w._stopLayer;
                var i = 0;
                stopLayer.on("graphic-add", function (args) {
                    var g = args.graphic;
                    if (g.symbol.type === "simplemarkersymbol") {
                        var routeItem = _this.routeItemMap[g.attributes.address];
                        if (routeItem) {
                            var symbol = new SimpleMarkerSymbol(g.symbol.toJson());
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
            var addStops = function () {
                w.addStops(route.routeItems.sort(function (a, b) { return a.ordinalIndex - b.ordinalIndex; }).map(function (i) {
                    var key = _this.getActivityName(i);
                    _this.routeItemMap[key] = i;
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
            topic.subscribe("/dnd/drop/before", function (source, nodes, copy, target, e) {
                var dndFrom = registry.getEnclosingWidget(source.parent);
                if (dndFrom == w) {
                    var dndTo_1 = registry.getEnclosingWidget(target.parent);
                    if (dndFrom === dndTo_1) {
                        updateRoute();
                        return;
                    }
                    var i = dndFrom._dnd.getAllNodes().indexOf(nodes[0]);
                    var j = dndTo_1._dnd.getAllNodes().indexOf(target.current);
                    var stop_1 = dndFrom.stops[i];
                    var stops1_1 = dndFrom.stops.filter(function (s) { return s !== stop_1; });
                    var stops2_1 = dndTo_1.stops.filter(function () { return true; });
                    stops2_1.splice(j, 0, stop_1);
                    setTimeout(function () {
                        dndFrom.stops = [];
                        dndFrom.reset().then(function () {
                            dndFrom.addStops(stops1_1);
                        });
                        dndTo_1.stops = [];
                        dndTo_1.reset().then(function () {
                            // update the destination route
                            dndTo_1.addStops(stops2_1);
                        });
                    }, 50);
                }
                else {
                    var dndTo = registry.getEnclosingWidget(target.parent);
                    if (w === dndTo)
                        updateRoute();
                }
            });
            return w;
        };
        RouteManager.prototype.routeTemplate = function (route) {
            return "<div class=\"route\">\n        <input type=\"checkbox\" checked class=\"toggler\" data-ips-toggler-for=\"EMP_" + route.employeeId + "\" />\n        <label>" + (route.employeeFullName || route.employeeId) + "</label>\n        <div id=\"EMP_" + route.employeeId + "\"></div></div>";
        };
        return RouteManager;
    }());
});
