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
const red = new Color("red");

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

let editorGhostVertexStyle = <typeof editorVertexStyle>JSON.parse(JSON.stringify(editorVertexStyle));
editorGhostVertexStyle.color = [255, 255, 255, 255]
editorGhostVertexStyle.size /= 6;
editorGhostVertexStyle.outline.width /= 2;

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

    interface StopInfo {
        stop: Graphic;
        label: Graphic;
    };

    interface RouteLineInfo {
        routeLine: Graphic;
        underlay: Graphic;
    }

    interface RouteInfo {
        color: Color;
        routeLine: RouteLineInfo;
        stops: Array<StopInfo>;
    };

    export class RouteView {

        public layer: GraphicsLayer; // using onclick to initiate editing

        private routes: Array<RouteInfo>;

        private orphans: Array<StopInfo>;

        constructor(public options: {
            map: Map,
            route: Routing.RouteResponse
        }) {
            let map = options.map;

            let layer = this.layer = new GraphicsLayer();

            options.map.addLayer(layer);

            this.routes = [];
            this.orphans = [];

            route.data.map((data, colorIndex) => this.add({
                route: data,
                color: colors[colorIndex % colors.length]
            }));
        }

        removeRoute(route: RouteInfo | number) {
            let routeIndex = (typeof route === "number") ? route : this.routes.indexOf(route);
            return this.routes.splice(routeIndex, 1)[0];
        }

        removeOrphan(stop: StopInfo) {
            let index = this.orphans.indexOf(stop);
            this.orphans.splice(index, 1);
        }

        addOrphan(stop: StopInfo) {
            this.orphans.push(stop);
        }

        removeStop(route: RouteInfo | number, stop: StopInfo | number): StopInfo {
            let routeIndex = (typeof route === "number") ? route : this.routes.indexOf(route);
            let stopIndex = (typeof stop === "number") ? stop : this.routes[routeIndex].stops.indexOf(stop);
            console.log(`removeStop from route ${routeIndex} at position ${stopIndex}`);
            return this.routes[routeIndex].stops.splice(stopIndex, 1)[0];
        }

        addStop(route: RouteInfo | number, stop: StopInfo, stopIndex: number): StopInfo {
            let routeIndex = (typeof route === "number") ? route : this.routes.indexOf(route);
            console.log(`addStop to route ${routeIndex} at position ${stopIndex}`);
            return this.routes[routeIndex].stops.splice(stopIndex, 0, stop)[0];
        }

        moveStop(stop: StopInfo, location: Point) {
            stop.stop.setGeometry(location);
            stop.label.setGeometry(location);
        }

        add(args: {
            color: Color,
            route: Routing.Route
        }) {

            if (args.route) {

                let routeInfo = <RouteInfo>{
                    color: args.color,
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

                    routeInfo.routeLine = {
                        routeLine: new Graphic(getGeom(), new SimpleLineSymbol(SimpleLineSymbol.STYLE_SHORTDOT, args.color, delta / 8), attributes, template),
                        underlay: new Graphic(getGeom(), new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, white, delta / 6))
                    };
                    this.layer.add(routeInfo.routeLine.underlay);
                    this.layer.add(routeInfo.routeLine.routeLine);
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

        redraw(route: RouteInfo) {

            {
                let lineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, white, delta / 8);
                let circleSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, delta, lineSymbol, route.color);
                route.stops.forEach((stop, itemIndex) => {
                    stop.stop.setSymbol(circleSymbol);
                    (<TextSymbol>stop.label.symbol).text = (1 + itemIndex + "");
                    stop.stop.getShape().moveToFront();
                    stop.label.getShape().moveToFront();
                    stop.stop.draw();
                    stop.label.draw();
                });
            }

            {
                let getGeom = () => {
                    let path = route.stops.map(stop => <Point>stop.stop.geometry).map(p => [p.getLongitude(), p.getLatitude()]);
                    let geometry = new Polyline(path);
                    return geometry;
                };
                route.routeLine.routeLine.getShape().moveToBack();
                route.routeLine.underlay.getShape().moveToBack();

                route.routeLine.underlay.setGeometry(getGeom());
                route.routeLine.routeLine.setGeometry(route.routeLine.underlay.geometry);
            }

            this.orphans.forEach((stop, itemIndex) => {
                (<TextSymbol>stop.label.symbol).text = (1 + itemIndex + "");
                (<SimpleMarkerSymbol>stop.stop.symbol).color = red;
                stop.stop.draw();
                stop.label.draw();
            });

        }

        edit(editor: Edit, graphic: Graphic, options: {
            moveStop: boolean;
        }) {

            // ensures callbacks are unregistered
            editor.deactivate();

            let activeRoute = first(this.routes, route => {
                if (graphic === route.routeLine.routeLine) return true;
                if (graphic === route.routeLine.underlay) return true;
                if (graphic.geometry.type === "point") {
                    return !!first(route.stops, stop => stop.stop === graphic || stop.label === graphic);
                }
            });

            if (activeRoute) {
                editor.activate(Edit.EDIT_VERTICES, activeRoute.routeLine.routeLine);
            } else {
                console.log("cannot determine route");
                return;
            }

            let isActiveVertexMinor: boolean;
            let activeVertex: number;
            let targetRoute = null && activeRoute;
            let activeStop = null && activeRoute.stops[0];
            let targetStop = null && activeRoute.stops[0];
            let activeLocation: Point;

            let doit = () => {
                console.log("change");
                let isSameStop = activeStop === targetStop;
                let isSameRoute = targetRoute === activeRoute;
                let isRemoveActiveStop = !isActiveVertexMinor && !options.moveStop;
                let isMoveActiveStop = !isActiveVertexMinor && options.moveStop && !targetStop;
                let isAddTargetStop = !!targetStop;
                let isOrphan = !targetRoute && targetStop;

                if (isSameStop) {
                    console.log("dnd onto same stop does nothing");
                    return;
                }

                if (isRemoveActiveStop) {
                    this.removeStop(activeRoute, activeStop);
                    this.addOrphan(activeStop);
                }

                if (isAddTargetStop) {
                    targetRoute && this.removeStop(targetRoute, targetStop);
                    isOrphan && this.removeOrphan(targetStop);
                    this.addStop(activeRoute, targetStop, activeVertex);
                }

                if (isMoveActiveStop) {
                    this.moveStop(activeStop, activeLocation);
                }

                !isSameRoute && targetRoute && this.redraw(targetRoute);
                this.redraw(activeRoute);

                this.edit(editor, activeRoute.routeLine.routeLine, options);
            };

            let handles = [

                editor.on("vertex-move-start", args => {
                    // were on the move!
                    isActiveVertexMinor = args.vertexinfo.isGhost;
                    activeVertex = args.vertexinfo.pointIndex;
                    activeStop = !isActiveVertexMinor && activeRoute.stops[args.vertexinfo.pointIndex];
                }),

                editor.on("vertex-move-stop", args => {
                    if (args.vertexinfo.pointIndex !== activeVertex) return;
                    // does it intersect with another stop?
                    console.log("vertext-move-stop");
                    let routeLine = activeRoute.routeLine;

                    let pointIndex = args.vertexinfo.pointIndex;
                    let segmentIndex = args.vertexinfo.segmentIndex;
                    activeLocation = (<Polyline>routeLine.routeLine.geometry).getPoint(segmentIndex, pointIndex);

                    // convert to pixel and find an intersecting stop
                    let map = this.options.map;
                    let extent = map.extent;
                    let [width, height] = [map.width, map.height];

                    let pixel = map.toScreen(activeLocation);
                    pixel.x -= delta / 2;
                    pixel.y -= delta / 2;
                    let topLeft = map.toMap(pixel);
                    pixel.x += delta;
                    pixel.y += delta;
                    let bottomRight = map.toMap(pixel);

                    extent = new Extent(topLeft.x, bottomRight.y, bottomRight.x, topLeft.y, map.spatialReference);

                    targetRoute = first(this.routes, route => {
                        targetStop = first(route.stops, stop => extent.contains(stop.stop.geometry));
                        return !!targetStop;
                    });

                    if (!targetRoute) {
                        targetStop = first(this.orphans, stop => extent.contains(stop.stop.geometry));
                    }

                    doit();
                }),

                editor.on("vertex-move", args => {
                    // does it intersect with another stop?
                }),

                editor.on("vertex-add", args => {
                    // does it intersect with another stop?
                }),

                editor.on("deactivate", evt => {
                    // stop listening for editor events
                    handles.forEach(h => h.remove());
                }),

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

        map.on("click", () => {
            console.log("map click");
            editor.deactivate();
        });

        routeView.layer.on("click", (args: any) => {
            event.stop(args);
            routeView.edit(editor, args.graphic, {
                moveStop: args.shiftKey
            });
        });

    }
}