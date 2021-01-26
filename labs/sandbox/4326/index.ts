/**
 * Trying to setup a map to use 3857 because it uses 4326 by default already
 * https://stackoverflow.com/questions/65904709/how-to-set-the-spatial-reference-of-a-esri-javascript-api-map-3-x
 * https://stackoverflow.com/questions/65852375/esri-jsapi-3-x-how-to-set-min-max-zoom-levels
 * setting the extent and center do not affect the maps spatial reference
 * setting the spatialReference does not affect the maps spatial reference
 * only loading a basemap seems to have an affect
 */
import Map from "esri/map";
import SpatialReference from "esri/SpatialReference";
import Scalebar from "esri/dijit/Scalebar";
import GraphicsLayer from "esri/layers/GraphicsLayer";
import Graphic from "esri/graphic";
import Point from "esri/geometry/Point";
import Extent from "esri/geometry/Extent";
import SimpleMarkerSymbol from "esri/symbols/SimpleMarkerSymbol";
import SimpleLineSymbol from "esri/symbols/SimpleLineSymbol";
import Color from "esri/Color";
import * as projection from "esri/geometry/projection";

import "dojo/domReady!";
import FeatureLayer from "esri/layers/FeatureLayer";
import SimpleFillSymbol from "esri/symbols/SimpleFillSymbol";
import SimpleRenderer from "esri/renderers/SimpleRenderer";

const range = (n: number) => new Array(n).fill(n).map((_, i) => i);

const createMarker = (color: number) =>
  new SimpleMarkerSymbol(
    "solid",
    8,
    new SimpleLineSymbol(),
    new Color([color, color, color, 1])
  );

const srs3857 = new SpatialReference({ wkid: 3421 });
const srs4326 = new SpatialReference({ wkid: 4326 });
const baselineResolution = 156543.03408771486;
const baselineScale = 591657527.591555;

const lods3857 = range(30)
  .map((i) => i)
  .map((i) => {
    const level = i;
    const resolution = baselineResolution / Math.pow(2, level);
    const scale = baselineScale / Math.pow(2, level);
    return { level, resolution, scale, levelValue: "level" };
  });

export async function run() {
  await projection.load();

  const center = projection.project(
    new Point(-85, 35, srs4326),
    srs3857
  ) as Point;
  const extent = new Extent({
    xmin: center.x - 1000,
    ymin: center.y - 1000,
    xmax: center.x + 1000,
    ymax: center.y + 1000,
    spatialReference: srs3857,
  });

  // new Extent({"xmin":-3805207,"ymin":-3763687,"xmax":3692296,"ymax":1775125,"spatialReference":{"wkid":102003}})

  const map = new Map("map", {
    //basemap: "streets",
    // minScale: lods3857[0].scale, // map computes it's own levels
    // maxScale: lods3857[lods3857.length - 1].scale,
    // scale: lods3857[0].scale,
    center,
    extent,
    lods: lods3857, // causes map to use 4326
    minZoom: 1,
    maxZoom: 15,
    zoom: 3,
  });

  // trick to get the map to work properly
  map.basemapLayerIds &&
    map.on("load", () => {
      setTimeout(
        () => map.removeLayer(map.getLayer(map.basemapLayerIds[0])),
        0
      );
      map.removeLayer(layer);
    });

  map.on("click", async () => {
    console.log("level", map.getLevel());
    console.log("scale", map.getScale());
    console.log("zoom", map.getZoom());
    // reporting 4326 but I want 3857
    console.log("spatialReference", map.spatialReference);
  });

  new Scalebar({ map: map, scalebarUnit: "dual" });

  const layer = new FeatureLayer(
    "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3",
    { definitionExpression: "1=2" }
  );
  // other layers to use...world regions:
  // var layer = new FeatureLayer("https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer/2");
  // countries:
  // var layer = new FeatureLayer("https://wwtw.esriuk.com/ArcGIS/rest/services/CG/WorldCountries/MapServer/0");
  const outline = new SimpleLineSymbol(
    "solid",
    new Color([255, 255, 255, 1]),
    1
  );
  const fill = new SimpleFillSymbol(
    "solid",
    outline,
    new Color([64, 64, 64, 0.5])
  );
  layer.setRenderer(new SimpleRenderer(fill));
  map.addLayer(layer); // somehow this allows the map to take on srs3857

  if (true) {
    const graphicsLayer = new GraphicsLayer();

    // these only appear when there is a basemap
    [-85, -85.01, -84.99]
      .map(
        (x) => projection.project(new Point(x, 36.0, srs4326), srs3857) as Point
      )
      .forEach((p, i) =>
        graphicsLayer.add(new Graphic(p, createMarker(i * 10), {}))
      );

    // these appear at all times
    [36, 36.01, 35.99]
      .map(
        (y) => projection.project(new Point(-85, y, srs4326), srs3857) as Point
      )
      .forEach((p, i) =>
        graphicsLayer.add(new Graphic(p, createMarker(i * 10), {}))
      );

    map.addLayer(graphicsLayer);
  }
}
