import domConstruct = require('dojo/dom-construct');
import Topic from "./pubsub";
import esri = require("esri");
import Map = require("esri/map");
import MarkerSymbol = require("esri/symbols/SimpleMarkerSymbol");
import LineSymbol = require("esri/symbols/SimpleLineSymbol");
import FillSymbol = require("esri/symbols/SimpleFillSymbol");
import Point = require("esri/geometry/Point");
import Polygon = require("esri/geometry/Polygon");
import Graphic = require("esri/graphic");
import HeatmapRenderer = require("esri/renderers/HeatmapRenderer");
import FeatureLayer = require("esri/layers/FeatureLayer");
import ArcGISTiledMapServiceLayer = require("esri/layers/ArcGISTiledMapServiceLayer");
import ArcGISDynamicMapServiceLayer = require("esri/layers/ArcGISDynamicMapServiceLayer");

import geometryEngine = require("esri/geometry/geometryEngine");

let topic = new Topic();

let asList = (nodeList: NodeList) => {
    let result = <Array<HTMLElement>>[];
    for (let i = 0; i < nodeList.length; i++) {
        result.push(<HTMLElement>nodeList[i]);
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
        let textarea = <HTMLTextAreaElement>document.getElementById("geometry");
        let geomText = textarea.value;
        let geomJs = <Array<any>>JSON.parse(geomText);

        if ("x" in geomJs) geomJs = [geomJs];

        if (Array.isArray(geomJs)) {
            let items = geomJs;
            if (typeof geomJs[0]["x"] !== "undefined") {
                items.forEach(item => topic.publish("add-point", item));
            } else {
                if (Array.isArray(geomJs[0])) {
                    if (typeof geomJs[0][0] == "number") {
                        topic.publish("add-polyline", items);
                    } else {
                        topic.publish("add-polygon", items);
                    }
                } else {
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

export default class Maplet {

    map: Map;

    constructor(element: HTMLElement) {
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
    addDynamicLayer(url = "http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Population_World/MapServer") {
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

        let heatmapOption = <esri.HeatmapRendererOptions>{};
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


export function run() {

    watchers();

    var el = document.getElementById('map');
    var map = new Maplet(el);
    //map.addDynamicLayer();
    map.addBasemap();
    //map.addHeatmap();
    //map.addFeatureLayer();
    topic.subscribe("add-point", (point: { x: number; y: number; }) => {
        let geom = new Point(point.x, point.y);
        let g = new Graphic(geom, new MarkerSymbol());
        map.map.graphics.add(g);
        map.map.centerAt(geom);
    });

    topic.subscribe("add-polyline", (points: Array<{ x: number; y: number; }>) => {
        let geom = new Polygon(points);
        let g = new Graphic(geom, new LineSymbol());
        map.map.graphics.add(g);
        map.map.setExtent(geom.getExtent());
    });

    topic.subscribe("add-polygon", (points: number[][]) => {
        let geom = new Polygon(points);
        let g = new Graphic(geom, new FillSymbol());
        map.map.graphics.add(g);
        map.map.setExtent(geom.getExtent());
    });

}
