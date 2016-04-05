﻿import Topic from "./pubsub";
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
    
    static test(app: {topic: Topic}) {
        var el = document.getElementById('map');
        var map = new Maplet(el);
        //map.addDynamicLayer();
        map.addBasemap();
        //map.addHeatmap();
        //map.addFeatureLayer();
        app.topic.subscribe("add-point", (point: {x: number; y: number;}) => {
            let geom = new Point(point.x, point.y);
            let g = new Graphic(geom, new MarkerSymbol()); 
            map.map.graphics.add(g);
            map.map.centerAt(geom);
        });
        
        app.topic.subscribe("add-polyline", (points: Array<{x: number; y: number;}>) => {
            let geom = new Polygon(points);
            let g = new Graphic(geom, new LineSymbol()); 
            map.map.graphics.add(g);
            map.map.setExtent(geom.getExtent());
        });

        app.topic.subscribe("add-polygon", (points: number[][]) => {
            let geom = new Polygon(points);
            let g = new Graphic(geom, new FillSymbol()); 
            map.map.graphics.add(g);
            map.map.setExtent(geom.getExtent());
        });
        
    }
}
