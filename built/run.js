var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=50%20Datastream%20Plaza&f=json&outSR=%7B%22wkid%22%3A102100%2C%22latestWkid%22%3A3857%7D&maxLocations=10
 */
define("ags-find-address-proxy", ["require", "exports"], function (require, exports) {
    "use strict";
    var FindAddress = (function () {
        function FindAddress(url) {
            this.ajax = new Ajax(url);
        }
        FindAddress.prototype.find = function (data) {
            var req = Object.assign({
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
define("ags-find-proxy", ["require", "exports"], function (require, exports) {
    "use strict";
    /**
     */
    var Find = (function () {
        function Find(url) {
            this.ajax = new Ajax(url);
        }
        Find.prototype.find = function (data) {
            var req = Object.assign({
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
define("ags-reverse-geocode-proxy", ["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * http://resources.arcgis.com/EN/HELP/REST/APIREF/INDEX.HTML?REVERSE.HTML
     */
    var ReverseGeocode = (function () {
        function ReverseGeocode(url) {
            this.ajax = new Ajax(url);
        }
        ReverseGeocode.prototype.reverseGeocode = function (data) {
            var req = Object.assign({
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
define("ags-route-solve-proxy", ["require", "exports", "ags-solve-proxy"], function (require, exports, ags_solve_proxy_1) {
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
            var req = Object.assign({
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
define("ags-servicearea-solve-proxy", ["require", "exports", "ags-solve-proxy"], function (require, exports, ags_solve_proxy_2) {
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
            var req = Object.assign({
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
define("ags-suggest-proxy", ["require", "exports"], function (require, exports) {
    "use strict";
    var Suggest = (function () {
        function Suggest(url) {
            this.ajax = new Ajax(url);
        }
        Suggest.prototype.suggest = function (data) {
            var req = Object.assign({
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
var Ajax = (function () {
    function Ajax(url) {
        this.url = url;
    }
    // Method that performs the ajax request
    Ajax.prototype.ajax = function (method, args, url) {
        if (url === void 0) { url = this.url; }
        // Creating a promise
        var promise = new Promise(function (resolve, reject) {
            // Instantiates the XMLHttpRequest
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
    var pubsub = new PubSub();
    return pubsub;
});
define("maplet", ["require", "exports", "pubsub", "esri/map", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/geometry/Point", "esri/geometry/Polygon", "esri/graphic", "esri/renderers/HeatmapRenderer", "esri/layers/FeatureLayer", "esri/layers/ArcGISTiledMapServiceLayer", "esri/layers/ArcGISDynamicMapServiceLayer"], function (require, exports, topic, Map, MarkerSymbol, LineSymbol, FillSymbol, Point, Polygon, Graphic, HeatmapRenderer, FeatureLayer, ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer) {
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
        Maplet.test = function () {
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
        };
        return Maplet;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Maplet;
});
define("app", ["require", "exports", "pubsub", "maplet"], function (require, exports, topic, maplet_1) {
    "use strict";
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
        maplet_1.default.test();
        //Suggest.test();
        //FindAddress.test();
        //Find.test();
        //ReverseGeocode.test();
        //RouteSolve.test();
        //ServiceSolve.test();
    };
    window.onload = run;
});
