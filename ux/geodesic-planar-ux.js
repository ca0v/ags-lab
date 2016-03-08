/**
 * https://developers.google.com/earth-engine/geometries_planar_geodesic?hl=en
 * geodesic: shortest path on the surface of a earth
 * planar: shortest path on paper
 *
 * Renders scaleline and measurement controls
 * Uses geometry services to calculate planar and geodesic lengths
 * Confirms the measure tool reports geodesic measurements
 */
define(["require", "exports", "esri/map", "esri/dijit/Scalebar", "esri/dijit/Measurement", "esri/units", "esri/config", "esri/tasks/GeometryService", "esri/tasks/BufferParameters", "esri/tasks/LengthsParameters", "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol", "esri/graphic", "esri/Color", "dojo/Deferred"], function (require, exports, Map, Scalebar, Measurement, Units, Config, GeometryService, BufferParameters, LengthsParameters, SimpleFillSymbol, SimpleLineSymbol, Graphic, Color, Deferred) {
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
