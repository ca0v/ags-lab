// convert to import..how?
import Map = require("esri/map");
import SpatialReference = require("esri/SpatialReference");
import Scalebar = require("esri/dijit/Scalebar");
import GraphicsLayer = require("esri/layers/GraphicsLayer");
import Graphic = require("esri/graphic");
import Point = require("esri/geometry/Point");
import SimpleMarkerSymbol = require("esri/symbols/SimpleMarkerSymbol");
import Color = require("esri/Color");
import "dojo/domReady!";

export function run() {
    const range = n => {
        let a = new Array(n).fill(n);
        return a.map((_, i) => i);
    };

    const createMarker = color => new SimpleMarkerSymbol("solid", 8, null, new Color([255, color, color, 1]));

    const lods = range(5).map(i => i + 10).map(i => {
        const baselineResolution = 156543.03392800014;
        const baselineScale = 591657527.591555;
        const level = i;
        const resolution = baselineResolution / Math.pow(2, level);
        const scale = baselineScale / Math.pow(2, level);
        return { level, resolution, scale };
    });

    const map = new Map("map", {
        basemap: "streets",
        center: [-85, 36],
        lods: lods,
    });

    const scalebar = new Scalebar({ map: map, scalebarUnits: "dual" });

    const graphicsLayer = new GraphicsLayer();
    map.addLayer(graphicsLayer);

    const point1 = new Point({ x: -85.001, y: 36.001 });
    graphicsLayer.add(new Graphic(point1, createMarker(0), {}));

};