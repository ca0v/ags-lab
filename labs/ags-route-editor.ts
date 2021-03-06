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

import jsonUtils = require("esri/symbols/jsonUtils");
import Evented = require("dojo/Evented");

const epsg4326 = new SpatialReference("4326");
const epsg3857 = new SpatialReference("102100");
const delta = 24;

const routeColors = [new Color("#ffa800"), new Color("#1D5F8A"), new Color("yellow")];
const underlayColor = new Color("white");
const orphanColor = new Color("red");
const hiliteColor = new Color("#00FF00");

const routeLineStyle = (routeInfo: RouteViewer.RouteInfo) => ({
    color: routeInfo.color,
    width: 2,
    type: "esriSLS",
    style: "esriSLSShortDot"
});

const routeUnderlayStyle = (routeInfo: RouteViewer.RouteInfo) => ({
    color: underlayColor,
    width: 4,
    type: "esriSLS",
    style: "esriSLSSolid"
});

const editorLineStyle = {
    color: hiliteColor,
    width: 3,
    type: "esriSLS",
    style: "esriSLSDot"
};

const editorVertexStyle = {
    color: [0, 0, 0, 0],
    size: delta,
    type: "esriSMS",
    style: "esriSMSCircle",
    outline: {
        color: hiliteColor,
        width: delta / 8,
        type: "esriSLS",
        style: "esriSLSSolid"
    }
};

let editorMinorVertexStyle = (routeInfo: RouteViewer.RouteInfo) => ({
    color: routeInfo.color,
    size: delta / 2,
    type: "esriSMS",
    style: "esriSMSCircle",
    outline: {
        color: hiliteColor,
        width: delta / 8,
        type: "esriSLS",
        style: "esriSLSSolid"
    }
});

let textStyle = (routeInfo: RouteViewer.RouteInfo, routeItem: Routing.RouteItem) => ({
    text: (1 + routeItem.ordinalIndex + ""),
    font: new Font(delta / 2),
    color: underlayColor,
    yoffset: -delta / 6,
    haloColor: routeInfo.color,
    haloSize: 1
});

let stopStyle = (routeInfo: RouteViewer.RouteInfo, routeItem: Routing.RouteItem) => ({
    type: "esriSMS",
    style: "esriSMSCircle",
    size: delta,
    color: routeInfo.color,
    outline: {
        type: "esriSLS",
        style: "esriSLSSolid",
        color: underlayColor,
        width: delta / 8
    }
});

let terminalStyle = (routeInfo: RouteViewer.RouteInfo) => ({
    type: "esriSMS",
    style: "esriSMSX",
    size: delta / 2,
    color: routeInfo.color,
    outline: {
        type: "esriSLS",
        style: "esriSLSSolid",
        color: routeInfo.color,
        width: delta / 8
    }
});


let activeVertexStyle = (routeInfo: RouteViewer.RouteInfo) => ({
    "color": routeInfo.color,
    "size": delta / 2,
    "angle": 0,
    "xoffset": 0,
    "yoffset": 0,
    "type": "esriSMS",
    "style": "esriSMSCircle",
    "outline": {
        "color": underlayColor,
        "width": delta / 8,
        "type": "esriSLS",
        "style": "esriSLSSolid"
    }
});

let cursorStyle = (routeInfo: RouteViewer.RouteInfo, text: string) => ({
    text: text,
    font: new Font(delta / 2),
    color: routeInfo.color,
    xoffset: delta,
    yoffset: -delta / 6,
    haloColor: underlayColor,
    haloSize: 1
});


function first<T>(arr: T[], filter: (v: T) => boolean): T {
    let result: T;
    return arr.some(v => { result = v; return filter(v); }) ? result : undefined;
}

function indexOf<T>(arr: T[], filter: (v: T) => boolean): number {
    let result: number;
    return arr.some((v, i) => { result = i; return filter(v); }) ? result : undefined;
}

function asGeom(location: Routing.Location) {
    return new Point(location.x, location.y);
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

    export interface RouteInfo {
        color: Color;
        startLocation: StopInfo;
        endLocation: StopInfo;
        routeLine: RouteLineInfo;
        stops: Array<StopInfo>;
    };

    export class RouteView {

        public layer: GraphicsLayer; // using onclick to initiate editing

        private routes: Array<RouteInfo>;

        private orphans: Array<StopInfo>;

        private events = new Evented();
        private destroyables: Array<() => void> = [];

        destroy() {
            this.destroyables.reverse().forEach(d => d());
            this.destroyables = [];
        }

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
                color: routeColors[colorIndex % routeColors.length]
            })).forEach(route => this.redraw(route));
        }

        on(name: "unassign-stop", cb: (args: {
            route: RouteInfo,
            stop: StopInfo
        }) => void): void;

        on(name: "reassign-stop", cb: (args: {
            source: RouteInfo,
            target: RouteInfo,
            item: StopInfo,
            index: StopInfo
        }) => void): void;

        on(name: "remove-orphan", cb: (args: { stop: StopInfo; }) => void): void;
        on(name: "add-orphan", cb: (args: { stop: StopInfo; }) => void): void;
        on(name: "remove-stop", cb: (args: { route: RouteInfo; stop: StopInfo; }) => void): void;
        on(name: "add-stop", cb: (args: { route: RouteInfo; stop: StopInfo; }) => void): void;
        on(name: "move-stop", cb: (args: { route: RouteInfo; stop: StopInfo; location: Point }) => void): void;

        on<T>(name: string, cb: (args: T) => void);
        on<T>(name: string, cb: (args: T) => void) {
            let handle = this.events.on(name, cb);
            this.destroyables.push(() => handle.remove());
        }

        trigger<T>(name: string, args: T) {
            // just trigger was invoking the callback many times even with prevent/stop set everywhere
            this.events.emit(name, <any>args);
        }

        private removeRoute(route: RouteInfo | number) {
            let routeIndex = (typeof route === "number") ? route : this.routes.indexOf(route);
            return this.routes.splice(routeIndex, 1)[0];
        }

        private removeOrphan(stop: StopInfo) {
            let index = this.orphans.indexOf(stop);
            stop = this.orphans.splice(index, 1)[0];
            this.trigger("remove-orphan", { stop: stop });
        }

        private addOrphan(stop: StopInfo) {
            this.orphans.push(stop);
            this.trigger("add-orphan", { stop: stop });
        }

        private removeStop(route: RouteInfo | number, stop: StopInfo | number) {
            let routeIndex = (typeof route === "number") ? route : this.routes.indexOf(route);
            let stopIndex = (typeof stop === "number") ? stop : this.routes[routeIndex].stops.indexOf(stop);
            let routeInfo = this.routes[routeIndex];
            let stopInfo = routeInfo.stops.splice(stopIndex, 1)[0];
            this.trigger("remove-stop", { route: routeInfo, stop: stopInfo });
        }

        private addStop(route: RouteInfo | number, stop: StopInfo, stopIndex: number) {
            let routeIndex = (typeof route === "number") ? route : this.routes.indexOf(route);
            let routeInfo = this.routes[routeIndex];
            routeInfo.stops.splice(stopIndex, 0, stop);
            let stopInfo = routeInfo.stops[stopIndex];
            this.trigger("add-stop", { route: routeInfo, stop: stopInfo });
        }

        private moveStop(stop: StopInfo, location: Point) {
            stop.stop.setGeometry(location);
            stop.label.setGeometry(location);
            let routeInfo = first(this.routes, r => 0 <= r.stops.indexOf(stop));
            let stopInfo = routeInfo && stop;
            this.trigger("move-stop", { route: routeInfo, stop: stopInfo, location: location });
        }

        private reassignStop(activeRoute: RouteInfo, targetRoute: RouteInfo, targetStop: StopInfo, activeIndex: number) {
            let isOrphan = !targetRoute && targetStop;
            targetRoute && this.removeStop(targetRoute, targetStop);
            isOrphan && this.removeOrphan(targetStop);
            this.addStop(activeRoute, targetStop, activeIndex);
            this.trigger("reassign-stop", {
                source: targetRoute,
                target: activeRoute,
                stop: targetStop,
                index: activeIndex
            });

        }

        private unassignStop(route: RouteInfo, stop: StopInfo) {
            this.removeStop(route, stop);
            this.addOrphan(stop);
            this.trigger("unassign-stop", {
                route: route,
                stop: stop
            });
        }

        private addToLayer(info: StopInfo | RouteLineInfo) {
            const isStop = (object: any): object is StopInfo => 'stop' in object;

            if (isStop(info)) {
                this.layer.add(info.stop);
                this.layer.add(info.label);
            } else {
                this.layer.add(info.underlay);
                this.layer.add(info.routeLine);
            }
        }


        private add(args: {
            color: Color,
            route: Routing.Route
        }) {

            let routeInfo: RouteInfo = {
                color: args.color,
                routeLine: null,
                stops: null,
                startLocation: null,
                endLocation: null
            };

            this.routes.push(routeInfo);

            if (1) {
                routeInfo.stops = args.route.routeItems.map((item, itemIndex) => {

                    let geometry = asGeom(item.location);

                    let circleSymbol = new SimpleMarkerSymbol(stopStyle(routeInfo, item));

                    let textSymbol = new TextSymbol(textStyle(routeInfo, item));

                    let attributes = {};
                    let template = new InfoTemplate(
                        () => `${args.route.employeeFullName} ${item.activity.moniker} ${item.activity.primaryKey}`,
                        () => `${JSON.stringify(item)}`
                    );

                    let stop = new Graphic(geometry, circleSymbol, attributes, template);
                    let label = new Graphic(geometry, textSymbol);

                    return {
                        stop: stop,
                        label: label
                    };
                });

                routeInfo.stops.forEach(stop => this.addToLayer(stop));
            }

            if (1) {
                let circleSymbol = new SimpleMarkerSymbol(terminalStyle(routeInfo));

                if (args.route.startLocation) {
                    let geom = asGeom(args.route.startLocation);
                    routeInfo.startLocation = {
                        stop: new Graphic(geom, circleSymbol),
                        label: new Graphic()
                    };
                    this.addToLayer(routeInfo.startLocation);
                }
                if (args.route.endLocation) {
                    let geom = asGeom(args.route.endLocation);
                    routeInfo.endLocation = {
                        stop: new Graphic(geom, circleSymbol),
                        label: new Graphic()
                    };
                    this.addToLayer(routeInfo.endLocation);
                }
            }

            return routeInfo;
        }

        private redraw(route: RouteInfo) {

            {
                let getGeom = () => {
                    let stops = [].concat(route.stops);
                    route.startLocation && stops.unshift(route.startLocation);
                    route.endLocation && stops.push(route.endLocation);

                    let path = stops.map(stop => <Point>stop.stop.geometry).map(p => [p.getLongitude(), p.getLatitude()]);
                    return new Polyline(path);
                };
                let geom = getGeom();

                if (!route.routeLine) {
                    route.routeLine = {
                        routeLine: new Graphic(geom, new SimpleLineSymbol(routeLineStyle(route))),
                        underlay: new Graphic(geom, new SimpleLineSymbol(routeUnderlayStyle(route)))
                    };
                    this.addToLayer(route.routeLine);
                } else {
                    route.routeLine.underlay.setGeometry(geom);
                    route.routeLine.routeLine.setGeometry(geom);
                }

            }

            this.orphans.forEach((stop, itemIndex) => {
                (<TextSymbol>stop.label.symbol).text = (1 + itemIndex + "");
                (<SimpleMarkerSymbol>stop.stop.symbol).color = orphanColor;
            });

            route.stops.forEach((stop, itemIndex) => {
                (<SimpleMarkerSymbol>stop.stop.symbol).color = route.color;
                (<TextSymbol>stop.label.symbol).text = (1 + itemIndex + "");
            });

            setTimeout(() => this.moveToFront(route), 200);
        }

        private moveToFront(route: RouteInfo) {
            [route.routeLine.routeLine, route.routeLine.underlay].forEach(g => {
                g.draw();
                g.getShapes().forEach(s => s.moveToBack());
            });

            route.stops.forEach(stop => {
                [stop.stop, stop.label].forEach(g => {
                    g.draw();
                    g.getShapes().forEach(s => s.moveToFront());
                });
            });

            this.orphans.forEach(stop => {
                [stop.stop, stop.label].forEach(g => {
                    g.draw();
                    g.getShapes().forEach(s => s.moveToFront());
                });
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
                this.moveToFront(activeRoute);
                editor.activate(Edit.EDIT_VERTICES, activeRoute.routeLine.routeLine, {
                    ghostVertexSymbol: new SimpleMarkerSymbol(editorMinorVertexStyle(activeRoute))
                });
            } else {
                console.log("cannot determine route");
                return;
            }

            let isActiveVertexMinor: boolean;
            let activeVertexIndex: number;
            let targetRoute = null && activeRoute;
            let activeStop = null && activeRoute.stops[0];
            let targetStop = null && activeRoute.stops[0];
            let activeLocation: Point;
            let cursor: Graphic;

            let doit = () => {
                let isSameStop = activeStop === targetStop;
                let isSameRoute = targetRoute === activeRoute;
                let isRemoveActiveStop = activeStop && !isActiveVertexMinor && !options.moveStop && !isSameStop;
                let isMoveActiveStop = activeStop && !isActiveVertexMinor && options.moveStop && (!targetStop || isSameStop);
                let isAddTargetStop = !!targetStop && !isSameStop;

                if (isSameStop) {
                    console.log("dnd onto same stop does nothing");
                }

                if (isRemoveActiveStop) {
                    this.unassignStop(activeRoute, activeStop);
                }

                if (isAddTargetStop) {
                    let activeIndex = activeVertexIndex;
                    if (activeIndex > 0) activeIndex -= (!!activeRoute.startLocation ? 1 : 0);
                    this.reassignStop(activeRoute, targetRoute, targetStop, activeIndex);
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
                    activeVertexIndex = args.vertexinfo.pointIndex;
                    activeStop = !isActiveVertexMinor && activeRoute.stops[activeVertexIndex - (activeRoute.startLocation ? 1 : 0)];
                    let g = <Graphic>args.vertexinfo.graphic;
                    g.setSymbol(new SimpleMarkerSymbol(activeVertexStyle(activeRoute)));
                    g.draw();
                }),

                editor.on("vertex-move-stop", args => {
                    if (cursor) {
                        this.layer.remove(cursor);
                        cursor = null;
                    }
                    if (args.vertexinfo.pointIndex !== activeVertexIndex) return;
                    // does it intersect with another stop?
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
                    let map = this.options.map;
                    let g = <Graphic>args.vertexinfo.graphic;
                    let startPoint = <Point>g.geometry;
                    let tx = args.transform;
                    let endPoint = map.toMap(map.toScreen(startPoint).offset(tx.dx, tx.dy));

                    // draw a 'cursor' as a hack to render text over the active vertex
                    if (!cursor) {
                        cursor = new Graphic(endPoint, new TextSymbol(cursorStyle(activeRoute, (1 + activeVertexIndex - (activeRoute.startLocation ? 1 : 0) + ""))));
                        this.layer.add(cursor);
                    } else {
                        cursor.setGeometry(endPoint);
                        cursor.draw();
                        cursor.getShape().moveToFront();
                    }
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
            zoom: 13,
            basemap: 'streets'
        });


    {

        let editor = new Edit(map, {
            allowAddVertices: true,
            allowDeleteVertices: false,
            ghostLineSymbol: new SimpleLineSymbol(editorLineStyle),
            vertexSymbol: new SimpleMarkerSymbol(editorVertexStyle)
        });

        let routeView = new RouteViewer.RouteView({
            map: map,
            route: route
        });

        // primary events
        routeView.on("unassign-stop", args => console.log("unassign-stop"));
        routeView.on("reassign-stop", args => console.log("reassign-stop"));

        // low-level events
        routeView.on("remove-orphan", args => console.log("remove-orphan"));
        routeView.on("add-orphan", args => console.log("add-orphan"));
        routeView.on("remove-stop", args => console.log("remove-stop"));
        routeView.on("add-stop", args => console.log("add-stop"));
        routeView.on("move-stop", args => console.log("move-stop"));

        map.on("click", () => {
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