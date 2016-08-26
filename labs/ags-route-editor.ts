import route = require("./data/route01");

import lang = require("dojo/_base/lang");
import Map = require("esri/map");
import GraphicsLayer = require("esri/layers/GraphicsLayer");
import Graphic = require("esri/graphic");
import Point = require("esri/geometry/Point");
import Polyline = require("esri/geometry/Polyline");

import SpatialReference = require("esri/SpatialReference");

import SimpleMarkerSymbol = require("esri/symbols/SimpleMarkerSymbol");
import SimpleLineSymbol = require("esri/symbols/SimpleLineSymbol");
import SimpleFillSymbol = require("esri/symbols/SimpleFillSymbol");
import TextSymbol = require("esri/symbols/TextSymbol");

import Color = require("esri/Color");

import InfoTemplate = require("esri/InfoTemplate");
import Popup = require("esri/dijit/Popup");
import domConstruct = require("dojo/dom-construct");
import event = require("dojo/_base/event");

import Font = require("esri/symbols/Font");

import webMercatorUtils = require("esri/geometry/webMercatorUtils");
import Edit = require("esri/toolbars/edit");

import screenUtils = require("esri/geometry/screenUtils");
import Extent = require("esri/geometry/Extent");

const epsg4326 = new SpatialReference("4326");
const epsg3857 = new SpatialReference("102100");
const delta = 32;

const colors = [new Color("#ffa800"), new Color("#1D5F8A"), new Color("yellow")];
const white = new Color("white");

const editorLineStyle = {
    color: [0, 255, 0],
    width: 3,
    type: "esriSLS",
    style: "esriSLSDash"
};

const editorVertexStyle = {
    color: [0, 255, 0, 20],
    size: delta * 3 / 4,
    type: "esriSMS",
    style: "esriSMSCircle",
    outline: {
        color: [0, 255, 0, 255],
        width: 3,
        type: "esriSLS",
        style: "esriSLSSolid"
    }
};

let editorGhostVertexStyle = lang.mixin({}, editorVertexStyle);
editorGhostVertexStyle.size /= 2;

function first<T>(arr: T[], filter: (v: T) => boolean): T {
    let result: T;
    return arr.some(v => { result = v; return filter(v); }) ? result : undefined;
}

function indexOf<T>(arr: T[], filter: (v: T) => boolean): number {
    let result: number;
    return arr.some((v, i) => { result = i; return filter(v); }) ? result : undefined;
}

export module Routing {

    export interface Activity {
        moniker: string;
        primaryKey: number;
    }

    export interface Location {
        x: number;
        y: number;
    }

    export interface RouteItem {
        isActivityCompleted: boolean;
        ordinalIndex: number;
        activity: Activity;
        location: Location;
        activityParentType: string;
        scheduledDate: string;
        activityType: string;
        lastModifiedBy: string;
        lastModifiedDateTime: string;
        id: number;
        href: string;
    }

    export interface Route {
        employeeId: string;
        employeeFullName: string;
        routeDate: string;
        startLocation: Location;
        endLocation: Location;
        routeItems: RouteItem[];
        lastModifiedBy: string;
        lastModifiedDateTime: string;
        id: number;
        href: string;
    }

    export interface ResponseStatus {
        severity: string;
    }

    export interface RouteResponse {
        data: Array<Route>;
        responseStatus: ResponseStatus;
    }

}

export namespace RouteViewer {

    type Coordinate = number[];

    interface RouteOptions {
        color?: string;
        delta?: number;
        start?: Coordinate;
        finish?: Coordinate;
        stops?: Coordinate[];
        showLines?: boolean;
        modifyRoute?: boolean;
        modifyStartLocation?: boolean;
        modifyFinishLocation?: boolean;
    }

    export class RouteView {

        public layer: GraphicsLayer;

        public routes: Array<{
            routeLine: Graphic;
            stops: Array<{ stop: Graphic; label: Graphic; }>;
        }>;

        constructor(public options: {
            map: Map,
            route: Routing.RouteResponse
        }) {
            let map = options.map;

            let layer = this.layer = new GraphicsLayer();

            /*
            layer.on("click", args => {
                // need to manually query to register multiple features
                map.infoWindow.setFeatures([args.target]);
                map.infoWindow.show(args.mapPoint);
            })
            */

            options.map.addLayer(layer);

            this.routes = [];
            route.data.map((data, colorIndex) => this.add({
                route: data,
                color: colors[colorIndex % colors.length]
            }));
        }

        add(args: {
            color: Color,
            route: Routing.Route
        }) {

            if (args.route) {

                let routeInfo = {
                    routeLine: null,
                    stops: null
                };
                this.routes.push(routeInfo);

                {
                    let getGeom = () => {
                        let path = args.route.routeItems.map(item => [item.location.x, item.location.y]);
                        let geometry = new Polyline(path);
                        return geometry;
                    };

                    let attributes = {};
                    let template = new InfoTemplate(() => `${args.route.employeeFullName}`, () => `DATE: ${args.route.routeDate}`);

                    routeInfo.routeLine = new Graphic(getGeom(), new SimpleLineSymbol(SimpleLineSymbol.STYLE_SHORTDOT, args.color, delta / 8), attributes, template);
                    this.layer.add(new Graphic(getGeom(), new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, white, delta / 8)));
                    this.layer.add(routeInfo.routeLine);
                }

                routeInfo.stops = args.route.routeItems.map((item, itemIndex) => {

                    //let [x, y] = webMercatorUtils.lngLatToXY(route.location.x, route.location.y);
                    let geometry = new Point(item.location.x, item.location.y);

                    let lineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, white, delta / 8);
                    let circleSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, delta, lineSymbol, args.color);
                    let textSymbol = new TextSymbol({
                        text: (1 + itemIndex + ""),
                        font: new Font(delta / 2),
                        color: white,
                        yoffset: -delta / 6,
                        haloColor: args.color,
                        haloSize: 1
                    });

                    let attributes = {};
                    let template = new InfoTemplate(
                        () => `${args.route.employeeFullName} ${item.activity.moniker} ${item.activity.primaryKey}`,
                        () => `${JSON.stringify(item)}`
                    );

                    let stop = new Graphic(geometry, circleSymbol, attributes, template);
                    let label = new Graphic(geometry, textSymbol);
                    this.layer.add(stop);
                    this.layer.add(label);

                    return {
                        stop: stop,
                        label: label
                    };
                });

            }
        }

        edit(editor: Edit, graphic: Graphic) {

            // ensures callbacks are unregistered
            editor.deactivate();

            let route = first(this.routes, route => {
                if (graphic === route.routeLine) return true;
                if (graphic.geometry.type === "point") {
                    return !!first(route.stops, stop => stop.stop === graphic || stop.label === graphic);
                }
            });

            if (route) {
                editor.activate(Edit.EDIT_VERTICES, route.routeLine);
            } else {
                console.log("cannot determine route");
            }

            let handles = [
                editor.on("deactivate", function (evt) {
                    handles.forEach(h => h.remove());
                    if (evt.info.isModified) {
                        console.log("change");
                    }
                }),

                editor.on("vertex-move-start", args => {
                    console.log("vertex-move-start");
                }),

                editor.on("vertex-move-stop", args => {
                    // does it intersect with another stop?
                    console.log("vertext-move-stop");
                    let routeLine = route.routeLine;

                    let pointIndex = args.vertexinfo.pointIndex;
                    let segmentIndex = args.vertexinfo.segmentIndex;
                    let location = (<Polyline>routeLine.geometry).getPoint(segmentIndex, pointIndex);

                    // convert to pixel and find an intersecting stop
                    let map = this.options.map;
                    let extent = map.extent;
                    let [width, height] = [map.width, map.height];

                    let pixel = map.toScreen(location);
                    pixel.x -= delta / 2;
                    pixel.y -= delta / 2;
                    let topLeft = map.toMap(pixel);
                    pixel.x += delta;
                    pixel.y += delta;
                    let bottomRight = map.toMap(pixel);

                    extent = new Extent(topLeft.x, bottomRight.y, bottomRight.x, topLeft.y, map.spatialReference);

                    // search for a stop
                    let targetStop: number;
                    let targetRoute: number;

                    targetRoute = indexOf(this.routes, route => {
                        targetStop = indexOf(route.stops, stop => extent.contains(stop.stop.geometry));
                        return (-1 < targetStop);
                    });

                    if (-1 < targetRoute) {
                        console.log(`reassign stop ${targetStop + 1} from route ${targetRoute + 1} to route ${this.routes.indexOf(route) + 1}`);
                    };

                }),

                editor.on("vertex-move", args => {
                    // does it intersect with another stop?
                }),

                editor.on("vertex-add", args => {
                    // does it intersect with another stop?
                    console.log("vertext-add");
                })
            ];

        }

    }

}

export function run() {

    let map = new Map(
        document.getElementById("map"),
        {
            center: [-115.257, 36.194],
            zoom: 16,
            basemap: 'streets'
        });


    {

        let editor = new Edit(map, {
            allowAddVertices: true,
            allowDeleteVertices: false,
            ghostLineSymbol: new SimpleLineSymbol(editorLineStyle),
            vertexSymbol: new SimpleMarkerSymbol(editorVertexStyle),
            ghostVertexSymbol: new SimpleMarkerSymbol(editorGhostVertexStyle)
        });

        let routeView = new RouteViewer.RouteView({
            map: map,
            route: route
        });

        routeView.layer.on("click", (args: any) => {
            event.stop(args);
            routeView.edit(editor, args.graphic);
        });

    }
}