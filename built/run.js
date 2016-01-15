var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * http://sampleserver6.arcgisonline.com/arcgis/rest/services/Military/FeatureServer
 */
define("ags-feature-proxy", ["require", "exports", "dojo/_base/lang"], function (require, exports, lang) {
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
        FeatureServer.test = function () {
            var service = new FeatureServer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Military/FeatureServer");
            service
                .about()
                .then(function (value) {
                console.log("about", value);
                console.log("currentVersion", value.currentVersion);
                service.aboutLayer(2).then(function (value) {
                    console.log("layer2", value);
                });
            });
        };
        return FeatureServer;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = FeatureServer;
});
/**
 * http://sampleserver6.arcgisonline.com/arcgis/rest/?f=pjson
 */
define("ags-catalog-proxy", ["require", "exports", "dojo/_base/lang", "ags-feature-proxy"], function (require, exports, lang, ags_feature_proxy_1) {
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
        Catalog.test = function () {
            var service = new Catalog("http://sampleserver6.arcgisonline.com/arcgis/rest/services");
            service
                .about()
                .then(function (value) {
                console.log("about", value);
                value.services.filter(function (s) { return s.type === "FeatureServer"; }).forEach(function (s) {
                    var featureService = new ags_feature_proxy_1.default(service.ajax.url + "/" + s.name + "/FeatureServer");
                    featureService.about().then(function (s) { return console.log("featureServer", s); });
                });
                value.folders.forEach(function (f) {
                    service.aboutFolder(f).then(function (value) {
                        console.log("folder", f, value);
                    });
                });
            });
        };
        return Catalog;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Catalog;
});
/**
 * http://sampleserver6.arcgisonline.com/arcgis/sdk/rest/index.html#//02ss0000002r000000
 */
define("ags-feature-query-proxy", ["require", "exports", "dojo/_base/lang"], function (require, exports, lang) {
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
        Query.test = function () {
            new Query("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Military/FeatureServer/3/query")
                .query({
                outFields: ["symbolname"],
                returnDistinctValues: true
            })
                .then(function (value) {
                console.log("query", value);
            });
        };
        return Query;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Query;
});
/**
 * https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=50%20Datastream%20Plaza&f=json&outSR=%7B%22wkid%22%3A102100%2C%22latestWkid%22%3A3857%7D&maxLocations=10
 */
define("ags-find-address-proxy", ["require", "exports", "dojo/_base/lang"], function (require, exports, lang) {
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
        FindAddress.test = function () {
            new FindAddress("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates")
                .find({
                singleLine: "50 Datastream Plz, Greenville, South Carolina, 29605",
                location: "-82.41,34.79",
                category: "Address"
            })
                .then(function (value) {
                value = JSON.parse(value);
                console.log("location", value.candidates.map(function (c) { return c.location; }));
                console.log(value);
            });
        };
        return FindAddress;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = FindAddress;
});
/**
 * geocode find
 */
define("ags-find-proxy", ["require", "exports", "dojo/_base/lang"], function (require, exports, lang) {
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
        Find.test = function () {
            new Find("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find")
                .find({
                text: "50 Datastream Plz, Greenville, South Carolina, 29605",
                location: "-82.41,34.79",
                category: "Address"
            })
                .then(function (value) {
                value = JSON.parse(value);
                console.log("location", value.locations.map(function (c) { return c.name; }));
                console.log(value);
            });
        };
        return Find;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Find;
});
/**
 * geometry services
 * http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer/distance
 */
define("ags-geometry-proxy", ["require", "exports", "dojo/_base/lang"], function (require, exports, lang) {
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
        Geometry.test = function () {
            new Geometry("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer/lengths")
                .lengths({
                polylines: [{ "paths": [[[-117, 34], [-116, 34], [-117, 33]], [[-115, 44], [-114, 43], [-115, 43]]] }]
            })
                .then(function (value) {
                console.log("lengths", value);
            });
        };
        return Geometry;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Geometry;
});
/**
 * http://roadsandhighwayssample.esri.com/roads/api/index.html
 * http://roadsandhighwayssample.esri.com/ROADS/SAMPLES/
 */
define("ags-lrs-proxy", ["require", "exports", "dojo/_base/lang"], function (require, exports, lang) {
    "use strict";
    var Lrs = (function () {
        function Lrs(url) {
            this.ajax = new Ajax(url);
        }
        Lrs.test = function () {
            // geometryToMeasure
            new Lrs("http://roadsandhighwayssample.esri.com/arcgis/rest/services/RoadsHighways/NewYork/MapServer/exts/LRSServer/networkLayers/2/geometryToMeasure")
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
            new Lrs("http://roadsandhighwayssample.esri.com/arcgis/rest/services/RoadsHighways/NewYork/MapServer/exts/LRSServer/networkLayers/2/measureToGeometry")
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
            new Lrs("http://roadsandhighwayssample.esri.com/arcgis/rest/services/RoadsHighways/NewYork/MapServer/exts/LRSServer/networkLayers/2/translate")
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
            new Lrs("http://roadsandhighwayssample.esri.com/arcgis/rest/services/RoadsHighways/NewYork/MapServer/exts/LRSServer/networkLayers/2/queryAttributeSet")
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
        };
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
});
/**
 * http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/find?searchText=Woonsocket&contains=true&searchFields=&sr=&layers=0%2C2&layerdefs=&returnGeometry=true&maxAllowableOffset=&f=pjson
 */
define("ags-map-find-proxy", ["require", "exports", "dojo/_base/lang"], function (require, exports, lang) {
    "use strict";
    /**
     * mapserver find
     */
    var Find = (function () {
        function Find(url) {
            this.ajax = new Ajax(url);
        }
        Find.prototype.find = function (data) {
            var req = lang.mixin({
                sr: 4326,
                f: "pjson"
            }, data);
            req.layers = req.layers.join(",");
            return this.ajax.get(req);
        };
        Find.test = function () {
            new Find("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/find")
                .find({
                searchText: "island",
                layers: ["0"]
            })
                .then(function (value) {
                console.log("find", value);
            });
        };
        return Find;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Find;
});
/**
 * http://sampleserver1.arcgisonline.com/ArcGIS/SDK/REST/identify.html
 */
define("ags-map-identify-proxy", ["require", "exports", "dojo/_base/lang"], function (require, exports, lang) {
    "use strict";
    /**
     * mapserver identify
     */
    var Identify = (function () {
        function Identify(url) {
            this.ajax = new Ajax(url);
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
        Identify.test = function () {
            new Identify("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StateCityHighway_USA/MapServer/identify")
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
        };
        return Identify;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Identify;
});
/**
 * http://sampleserver1.arcgisonline.com/ArcGIS/SDK/REST/query.html
 */
define("ags-map-query-proxy", ["require", "exports", "dojo/_base/lang"], function (require, exports, lang) {
    "use strict";
    /**
     * mapserver query
     */
    var Query = (function () {
        function Query(url) {
            this.ajax = new Ajax(url);
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
        Query.test = function () {
            new Query("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StateCityHighway_USA/MapServer/1/query")
                .query({
                text: "South Carolina"
            })
                .then(function (value) { return console.log("query", value); });
        };
        return Query;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Query;
});
/**
 * http://resources.arcgis.com/EN/HELP/REST/APIREF/INDEX.HTML?REVERSE.HTML
 */
define("ags-reverse-geocode-proxy", ["require", "exports", "dojo/_base/lang"], function (require, exports, lang) {
    "use strict";
    var ReverseGeocode = (function () {
        function ReverseGeocode(url) {
            this.ajax = new Ajax(url);
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
        ReverseGeocode.test = function () {
            new ReverseGeocode("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode")
                .reverseGeocode({
                location: "-82.407548,34.790207"
            })
                .then(function (value) {
                value = JSON.parse(value);
                console.log("ReverseGeocode", value.address);
                console.log(value);
            });
        };
        return ReverseGeocode;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = ReverseGeocode;
});
define("ags-solve-proxy", ["require", "exports"], function (require, exports) {
    "use strict";
    var BaseSolve = (function () {
        function BaseSolve(url) {
            this.ajax = new Ajax(url);
        }
        BaseSolve.prototype.solve = function (data) {
            return this.ajax.get(data);
        };
        ;
        BaseSolve.test = function () {
            throw "this is an abstract class for route, closest facility and service area";
        };
        return BaseSolve;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = BaseSolve;
});
define("ags-route-solve-proxy", ["require", "exports", "ags-solve-proxy", "dojo/_base/lang"], function (require, exports, ags_solve_proxy_1, lang) {
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
        RouteSolve.test = function () {
            new RouteSolve("http://sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/Route/solve")
                .solve({ stops: [{ x: -117.141724, y: 32.7122 }, { x: -117.141724, y: 32.72 }] })
                .then(function (value) {
                // how to get route to return json?
                value = JSON.parse(value);
                if (value.error) {
                    console.error(value.error.message);
                }
                else {
                    console.log("solve", value);
                }
                return value;
            });
        };
        return RouteSolve;
    }(ags_solve_proxy_1.default));
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = RouteSolve;
});
define("ags-servicearea-solve-proxy", ["require", "exports", "ags-solve-proxy", "dojo/_base/lang"], function (require, exports, ags_solve_proxy_2, lang) {
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
        ServiceAreaSolve.test = function () {
            new ServiceAreaSolve("http://sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/ServiceArea/solveServiceArea")
                .solve({
                facilities: "-117.141724,32.7122",
                returnFacilities: true,
                outSR: 4326
            })
                .then(function (value) {
                // how to get route to return json?
                value = JSON.parse(value);
                if (value.error) {
                    console.error(value.error.message);
                }
                else {
                    console.log("solve", value);
                }
                return value;
            });
        };
        return ServiceAreaSolve;
    }(ags_solve_proxy_2.default));
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = ServiceAreaSolve;
});
define("ags-suggest-proxy", ["require", "exports", "dojo/_base/lang"], function (require, exports, lang) {
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
        Suggest.test = function () {
            new Suggest("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest")
                .suggest({ text: "50 Datastream Plaza, Greenville SC" })
                .then(function (value) {
                // how to get route to return json?
                value = JSON.parse(value);
                console.log("text", value.suggestions.map(function (s) { return s.text; }));
                console.log(value);
            });
        };
        return Suggest;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Suggest;
});
/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */
"use strict";
var use_jsonp = true;
var Ajax = (function () {
    function Ajax(url) {
        this.url = url;
    }
    Ajax.prototype.jsonp = function (args, url) {
        if (url === void 0) { url = this.url; }
        // Creating a promise
        var promise = new Promise(function (resolve, reject) {
            args["callback"] = "define";
            var uri = url + "?" + Object.keys(args).map(function (k) { return (k + "=" + args[k]); }).join('&');
            require([uri], function (data) { return resolve(data); });
        });
        return promise;
    };
    Ajax.prototype.ajax = function (method, args, url) {
        if (url === void 0) { url = this.url; }
        if (use_jsonp)
            return this.jsonp(args, url);
        var promise = new Promise(function (resolve, reject) {
            var client = new XMLHttpRequest();
            var uri = url;
            if (args) {
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
            client.open(method, uri);
            client.send();
            client.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    // Performs the function "resolve" when this.status is equal to 2xx
                    resolve(this.response);
                }
                else {
                    // Performs the function "reject" when this.status is different than 2xx
                    reject(this.statusText);
                }
            };
            client.onerror = function () {
                reject(this.statusText);
            };
        });
        // Return the promise
        return promise;
    };
    Ajax.prototype.get = function (args) {
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
define("pubsub", ["require", "exports"], function (require, exports) {
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
});
define("maplet", ["require", "exports", "esri/map", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/geometry/Point", "esri/geometry/Polygon", "esri/graphic", "esri/renderers/HeatmapRenderer", "esri/layers/FeatureLayer", "esri/layers/ArcGISTiledMapServiceLayer", "esri/layers/ArcGISDynamicMapServiceLayer"], function (require, exports, Map, MarkerSymbol, LineSymbol, FillSymbol, Point, Polygon, Graphic, HeatmapRenderer, FeatureLayer, ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer) {
    "use strict";
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
            if (url === void 0) { url = "http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Population_World/MapServer"; }
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
        Maplet.test = function (app) {
            var el = document.getElementById('map');
            var map = new Maplet(el);
            //map.addDynamicLayer();
            map.addBasemap();
            //map.addHeatmap();
            //map.addFeatureLayer();
            app.topic.subscribe("add-point", function (point) {
                var geom = new Point(point.x, point.y);
                var g = new Graphic(geom, new MarkerSymbol());
                map.map.graphics.add(g);
                map.map.centerAt(geom);
            });
            app.topic.subscribe("add-polyline", function (points) {
                var geom = new Polygon(points);
                var g = new Graphic(geom, new LineSymbol());
                map.map.graphics.add(g);
                map.map.setExtent(geom.getExtent());
            });
            app.topic.subscribe("add-polygon", function (points) {
                var geom = new Polygon(points);
                var g = new Graphic(geom, new FillSymbol());
                map.map.graphics.add(g);
                map.map.setExtent(geom.getExtent());
            });
        };
        return Maplet;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Maplet;
});
define("app", ["require", "exports", "pubsub", "ags-geometry-proxy"], function (require, exports, pubsub_1, ags_geometry_proxy_1) {
    "use strict";
    var topic = new pubsub_1.default();
    var asList = function (nodeList) {
        var result = [];
        for (var i = 0; i < nodeList.length; i++) {
            result.push(nodeList[i]);
        }
        return result;
    };
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
    var run = function () {
        var events = asList(document.querySelectorAll("[data-event]"));
        events.forEach(function (e) { return e.addEventListener("click", function () { return topic.publish(e.dataset["event"], e); }); });
        var content = document.getElementById("console");
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
        var app = { topic: topic };
        //Maplet.test(app);
        ags_geometry_proxy_1.default.test();
        //Catalog.test();    
        //FeatureServer.test();
        //MapQuery.test();
        //MapIdentify.test();
        //MapFind.test();
        //Query.test();
        //Lrs.test();
        //Suggest.test();
        //FindAddress.test();
        //Find.test();
        //ReverseGeocode.test();
        //RouteSolve.test();
        //ServiceSolve.test();
    };
    return run;
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
                    var lengths = new LengthsParameters();
                    lengths.geodesic = false;
                    lengths.polylines = [args.geometry];
                    geometryService.lengths(lengths, function (args) {
                        console.log("planar lengths", args.lengths);
                        lengths.geodesic = true;
                        geometryService.lengths(lengths, function (args) {
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
