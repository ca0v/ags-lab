/** 
 * https://developers.google.com/earth-engine/geometries_planar_geodesic?hl=en
 * geodesic: shortest path on the surface of a earth 
 * planar: shortest path on paper
 * 
 * Renders scaleline and measurement controls
 * Uses geometry services to calculate planar and geodesic lengths
 * Confirms the measure tool reports geodesic measurements
 */

import Map = require("esri/map");
import Scalebar = require("esri/dijit/Scalebar");
import Measurement = require("esri/dijit/Measurement");
import Units = require("esri/units");
import Config = require("esri/config");
import GeometryService = require("esri/tasks/GeometryService");
import Geometry = require("esri/geometry/Geometry");
import Polyline = require("esri/geometry/Polyline");
import BufferParameters = require("esri/tasks/BufferParameters");
import DistanceParameters = require("esri/tasks/DistanceParameters");
import LengthsParameters = require("esri/tasks/LengthsParameters");
import SimpleFillSymbol = require("esri/symbols/SimpleFillSymbol");
import SimpleLineSymbol = require("esri/symbols/SimpleLineSymbol");
import Graphic = require("esri/graphic");
import Color = require("esri/Color");

let geometryService = Config.defaults.geometryService = new GeometryService("https://sampleserver6.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer");

export function run() {
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


    measurement.on("measure-end", (args: {
        geometry: Polyline,
        toolName: string;
        values: number;
    }) => {
        console.log("measure", args);
        switch (args.geometry.type) {
            case "point":
                break;
            case "polyline":
                let lengths = new LengthsParameters();
                lengths.geodesic = false;
                lengths.polylines = [args.geometry];
                geometryService.lengths(lengths, (args: { lengths: number[] }) => {
                    console.log("planar lengths", args.lengths);
                    lengths.geodesic = true;
                    geometryService.lengths(lengths, (args: { lengths: number[] }) => {
                        console.log("geodesic lengths", args.lengths);
                    })
                })
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
            geometryService.buffer(buffer, (bufferedGeometries: Geometry[]) => {
                let symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]));
                let graphics = bufferedGeometries.map(g => new Graphic(g, symbol));
                graphics.forEach(g => map.graphics.add(g));
            });
        }
    });

    measurement.startup();
}