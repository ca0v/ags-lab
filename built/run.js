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
    })();
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
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Find;
});
define("ags-route-proxy", ["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * http://sampleserver6.arcgisonline.com/arcgis/sdk/rest/index.html#/Network_Layer/02ss0000009p000000/
     */
    var Route = (function () {
        function Route(url) {
            this.ajax = new Ajax(url);
        }
        /**
         * http://sampleserver6.arcgisonline.com/arcgis/sdk/rest/index.html#/Solve_Route/02ss0000001t000000/
         */
        Route.prototype.solve = function (data) {
            var req = Object.assign({
                returnDirections: true,
                returnRoutes: true,
                preserveFirstStop: true,
                preserveLastStop: true,
                directionsLanguage: "en",
                outputGeometryPrecisionUnits: "esriDecimalDegrees",
                directionsOutputType: "esriDOTComplete",
                directionsLengthUnits: "esriNAUMiles",
                f: "pjson"
            }, data);
            req.stops = data.stops.map(function (p) { return (p.x + "," + p.y); }).join(';');
            return this.ajax.get(req);
        };
        Route.test = function () {
            new Route("http://sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/Route/solve")
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
        return Route;
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Route;
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
    })();
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
})();
define("maplet", ["require", "exports", "esri/map", "esri/geometry/Point", "esri/renderers/HeatmapRenderer", "esri/layers/FeatureLayer", "esri/layers/ArcGISTiledMapServiceLayer", "esri/layers/ArcGISDynamicMapServiceLayer"], function (require, exports, Map, Point, HeatmapRenderer, FeatureLayer, ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer) {
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
            var el = document.getElementById('content');
            var map = new Maplet(el);
            map.addDynamicLayer();
            //map.addBasemap();
            map.addHeatmap();
            map.addFeatureLayer();
        };
        return Maplet;
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Maplet;
});
define("app", ["require", "exports", "ags-route-proxy", "ags-suggest-proxy", "ags-find-address-proxy", "ags-find-proxy"], function (require, exports, ags_route_proxy_1, ags_suggest_proxy_1, ags_find_address_proxy_1, ags_find_proxy_1) {
    "use strict";
    window.onload = function () {
        //Maplet.test();
        ags_route_proxy_1.default.test();
        ags_suggest_proxy_1.default.test();
        ags_find_address_proxy_1.default.test();
        ags_find_proxy_1.default.test();
    };
});
