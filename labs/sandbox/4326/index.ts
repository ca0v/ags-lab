// convert to import..how?
import Map = require("esri/map");
import SpatialReference = require("esri/SpatialReference");
import Scalebar = require("esri/dijit/Scalebar");
import GraphicsLayer = require("esri/layers/GraphicsLayer");
import Graphic = require("esri/graphic");
import Point = require("esri/geometry/Point");
import SimpleMarkerSymbol = require("esri/symbols/SimpleMarkerSymbol");
import SimpleLineSymbol = require("esri/symbols/SimpleLineSymbol");
import Color = require("esri/Color");
import "dojo/domReady!";

export function run() {
    const range = (n: number) => {
        let a = new Array(n).fill(n);
        return a.map((_, i) => i);
    };

    const createMarker = (color: number) =>
        new SimpleMarkerSymbol(
            "solid",
            8,
            new SimpleLineSymbol(),
            new Color([255, color, color, 1])
        );

    const lods = range(5)
        .map((i) => i + 10)
        .map((i) => {
            const baselineResolution = 156543.03392800014;
            const baselineScale = 591657527.591555;
            const level = i;
            const resolution = baselineResolution / Math.pow(2, level);
            const scale = baselineScale / Math.pow(2, level);
            return { level, resolution, scale, levelValue: "level" };
        });

    // zoom levels are broken without specifying a basemap
    const map = new Map("map", {
        //basemap: "streets",
        center: new Point(-85, 36, new SpatialReference(4326)),
        //lods: lods,
        minZoom: 12,
        maxZoom: 16,
        zoom: 14,
    });

    new Scalebar({ map: map, scalebarUnit: "dual" });

    const graphicsLayer = new GraphicsLayer();
    map.addLayer(graphicsLayer);

    const point1 = new Point({ x: -85.001, y: 36.001 });
    graphicsLayer.add(new Graphic(point1, createMarker(0), {}));
}
