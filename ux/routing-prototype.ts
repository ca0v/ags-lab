/// <reference path="../app.d.ts" />
// To use the IdentityManager simply include esri/IdentityManager as part of your require statement.
//import "esri/IdentityManager";

import registry = require("dijit/registry");
import on = require("dojo/on");
import topic = require("dojo/topic");
import dom = require("dojo/dom");
import domConstruct = require("dojo/dom-construct");
import Deferred = require("dojo/Deferred");
import debounce = require("dojo/debounce");
import Map = require("esri/map");
import InfoTemplate = require("esri/InfoTemplate");
import GraphicsLayer = require("esri/layers/GraphicsLayer");
import FeatureLayer = require("esri/layers/FeatureLayer");
import DirectionsWidget = require("esri/dijit/Directions");
import Search = require("esri/dijit/Search");
import Renderer = require("esri/renderers/SimpleRenderer");
import SimpleLineSymbol = require("esri/symbols/SimpleLineSymbol");
import PictureMarkerSymbol = require("esri/symbols/PictureMarkerSymbol");
import SimpleMarkerSymbol = require("esri/symbols/SimpleMarkerSymbol");
import SimpleFillSymbol = require("esri/symbols/SimpleFillSymbol");
import Color = require("esri/Color");
import Graphic = require("esri/graphic");
import Locator = require("esri/tasks/locator");
import Extent = require("esri/geometry/Extent");
import Point = require("esri/geometry/Point");
import SpatialReference = require("esri/SpatialReference");
import webMercatorUtils = require("esri/geometry/webMercatorUtils");
import RouteParams = require("esri/tasks/RouteParameters");
import UniqueValueRenderer=require("esri/renderers/UniqueValueRenderer");
import Services = require("../ips/services");

let config = {
    zones: [{
        name: "red",
        color: new Color([200,60,60])        
    },{
        name: "green",
        color: new Color([60,200,60])        
    },{
        name: "blue",
        color: new Color([60,60,200])        
    }]    
};

function toArray<T extends HTMLElement>(l: NodeListOf<Element>) {
    let r = <Array<T>>[];

    for (let i = 0; i < l.length; i++) {
        r.push(<any>l[i]);
    }

    return r;
};

export function getRoutes(routesDom: HTMLElement, config: {
    map: Map;
    restapi: string;
    auth: { username: string; password: string;}
}) {

    let manager = new RouteManager(routesDom, config);

    manager.createRoutes().then(() => {

        manager.addCommand({ text: "Refresh", execute: () => { 
            manager.routingService.createRoutes().then(routes => {
                console.log("refreshed routes", routes);
                manager.destroyRoutes();
                manager.createRoutes();
            });
        } });
        
        manager.addCommand({ text: "Create Test Routes", execute: () => { 
            manager.routingService.forceSampleRoutes().then(routes => {
                debugger;
                console.log("test routes", routes);
                manager.destroyRoutes();
                manager.createRoutes();
            });
        } });
        
    });
}

/**
 * container for multiple directions widgets
*/
class RouteManager {

    private template = `<div class="routes"></div><div class="commands"></div>`;    
    private routeItemMap: { [s: string]: Services.Routing.RouteItem };
    private _widgets: Array<{ destroy: () => void }>;
    public routingService: Services.Routing;

    constructor(public routesDom: HTMLElement, public config: {
        map: Map;
        restapi: string;
        auth: { username: string; password: string;}
    }) {
        this._widgets = [];
        this.routeItemMap = {};
        this.routingService = new Services.Routing(config.restapi);
        domConstruct.place(this.template, routesDom);
    }

    get routes() {
        return <HTMLElement>this.routesDom.getElementsByClassName("routes")[0];
    }

    get commands() {
        return <HTMLElement>this.routesDom.getElementsByClassName("commands")[0];
    }

    destroyRoutes() {
        while (this._widgets.length) {
            this._widgets.pop().destroy();
        }
    }

    createRoutes() {
        let status = document.createElement("label");
        status.classList.add("status", "hidden");
        this.routesDom.appendChild(status);
        this._widgets.push({ destroy: () => this.routesDom.removeChild(status) });

        let h = setInterval(() => {
            status.innerHTML += ".";
        }, 2000);

        let reportStatus = (text: string) => {
            status.classList.remove("hidden");
            status.innerHTML = text + "&nbsp;";
            status.title = text;
        };

        let removeStatus = () => {
            clearInterval(h);
            status.classList.add("hidden");
        }

        reportStatus("Authenticating");
        return this.routingService.auth(this.config.auth)
            .then(() => {
                reportStatus("Getting routes");
                return this.routingService.getRoutes()
                    .then(routes => {

                        removeStatus();

                        if (!routes.data.length) {
                            reportStatus("No routes found");
                        }

                        routes.data.map((route, i) => {
                            // create a container
                            {
                                let routeNode = <HTMLElement>domConstruct.toDom(this.routeTemplate(route));
                                this.routes.appendChild(routeNode);
                                this._widgets.push({ destroy: () => routeNode.parentNode.removeChild(routeNode) });
                            }
                            this.initializeDirections(`EMP_${route.employeeId}`, this.config.map, route, "red,green,blue".split(",")[i%3]);
                        });

                        this.parse();

                    })
                    .catch(() => {
                        const msg = "failed to get routes";
                        console.error(msg, this.config.auth.username);
                        reportStatus(msg);
                        clearInterval(h);
                        throw msg;
                    });
            })
            .catch(() => {
                const msg = "failed to authenticate";
                console.error(msg, this.config.auth.username);
                reportStatus(msg);
                throw msg;
            });

    }

    addCommand(cmd: { text: string, execute: () => void }) {
        let button = domConstruct.create("button", {
            className: "ipsOptimizeButton",
            innerHTML: cmd.text
        });
        on(button, "click", () => cmd.execute());
        domConstruct.place(button, this.commands);
    }

    private parse() {
        let togglers = toArray<HTMLInputElement>(document.getElementsByClassName("toggler"));
        togglers.forEach(t => {

            let doit = () => {
                var target = document.getElementById(t.dataset['ipsTogglerFor']);
                t.checked ? target.classList.remove("hidden") : target.classList.add("hidden");
            };
            t.addEventListener("click", doit);
            doit();

        })
    }


    private getActivityName(routeItem: Services.Routing.RouteItem) {
        return `${routeItem.activityType} #${routeItem.id}`;
    }

    private initializeDirections(id: string, map: Map, route: Services.Routing.Route, zoneId = "blue"): DirectionsWidget {
        let zone = config.zones.filter(z=>z.name===zoneId)[0];
        let marker = new SimpleMarkerSymbol({
            "color": zone.color,
            "size": 16,
            "xoffset": 0,
            "yoffset": 0,
            "type": "esriSMS",
            "style": SimpleMarkerSymbol.STYLE_CIRCLE,
            "outline": {
                "color": zone.color,
                "width": 1,
                "type": "esriSLS",
                "style": "esriSLSSolid"
            }
        });

        // marker.getStroke = () => {
        //     let color = this.color;
        //     return {
        //         color: this.color,
        //         style: this.style,
        //         width: this.width
        //     }
        // };
                
        marker.color.a = 0.5;

        let routeLines = new SimpleLineSymbol("solid", new Color(zone.color), 3);
        routeLines.color.a = 0.5;
        
        let updateRoute = debounce(() => {
            console.log("notify services of change");
            let routeItems = <Services.Routing.RouteItem[]>w.stops.map((s: any) => this.routeItemMap[s.name]);
            routeItems.forEach((r, i) => r.ordinalIndex = i + 1);
            this.routingService.updateRoute(route.id, routeItems.map(i => i.id)).catch(() => {
                console.error("failed to update the route", route.id);
            });
        }, 500);

        let infoTemplate = new InfoTemplate();

        let routeParams = new RouteParams();

        routeParams.returnDirections = false;
        routeParams.preserveLastStop = false;
        routeParams.startTime; // TODO

        let w = new DirectionsWidget({
            map: map,
            routeTaskUrl: "//sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/Route",
            //routeTaskUrl: "http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World",
            traffic: false,
            optimalRoute: false,
            autoSolve: false,
            returnToStart: false,
            showReturnToStartOption: false,
            showReverseStopsButton: false,
            dragging: false,
            showActivateButton: false, // do not allow adding points via clicking map
            showClearButton: false, // disallow clearing the route
            showMilesKilometersOption: false,
            showOptimalRouteOption: false,
            showPrintPage: false,
            showTrafficOption: false,
            showTravelModesOption: false,
            fromSymbol: <any>marker,
            stopSymbol: <any>marker,
            toSymbol: <any>marker,
            unreachedSymbol: <any>marker,
            textSymbolOffset: { x: 0, y: -4 },
            routeSymbol: routeLines,
            routeParams: routeParams,
            stops: [],
            stopsInfoTemplate: infoTemplate
        }, id);

        this._widgets.push(w);

        w.zoomToFullRoute = () => {
            // not allowed
        };

        let actionsPane = (<HTMLElement>map.infoWindow.domNode).getElementsByClassName("actionsPane")[0];
        actionsPane.classList.add("hidden");

        infoTemplate.setContent((args: {
            attributes: { 
            address: string; 
        } }) => {
            let routeItem = this.routeItemMap[args.attributes.address];
            let data = <any>routeItem;
            let keys = Object.keys(data).filter(k => typeof data[k] !== "Object");
            keys = "id,isActivityCompleted,scheduledDate,activityType,lastModifiedBy,lastModifiedDateTime".split(',');
            
            let body = domConstruct.toDom(`${keys.map(k => `${k}: ${data[k]}`).join("<br/>")}`);

            let showInfo = domConstruct.toDom(`<a title="Show Info" to="" class="command showInfo"><span>Show Info</span></a>`);
            on(showInfo, "click", () => topic.publish("routing/show-info", routeItem.activity));

            let commands = domConstruct.toDom(`<div class="commands"></div>`);
            commands.appendChild(showInfo);
            body.appendChild(commands);

            return body;
        });

        infoTemplate.setTitle((args: { attributes: { address: string; } }) => {
            return `${args.attributes.address}`;
        });

        w.on("segment-highlight", (g: Graphic) => {
        });

        w.on("directions-clear", () => {
            //
        });

        w.on("directions-start", () => {
            // updateRoute();
        });

        w.on("directions-finish", () => {
            let stopIcons = w.domNode.getElementsByClassName("esriStopIcon");
            w.stops.forEach((s: any,i) => {
                let routeItem = this.routeItemMap[s.name];
                if (routeItem) {
                    // really want do know if the insp. has alreay been completed...
                    stopIcons[i].classList.add(routeItem.isActivityCompleted ? "COMPLETE" : "PENDING");
                }
            })
        });

        w.on("directions-finish", () => {
            let groups = toArray(document.getElementById(id).getElementsByClassName("searchInputGroup"));
            groups = groups.filter(g => g.getElementsByClassName("ips-info").length === 0);
            groups.forEach(g => {
                let div = document.createElement("label");
                div.classList.add("ips-info");
                g.appendChild(div);
            });
        });

        w.startup();

        {
            let optimizeButton = document.createElement("button");
            optimizeButton.className = "ipsOptimizeButton";
            optimizeButton.innerHTML = "Optimize";
            let parent = w.domNode.getElementsByClassName("esriStopsButtons")[0];
            parent.appendChild(optimizeButton);
            optimizeButton.onclick = () => {
                w.reset();
                this.routingService.optimizeRoute(route.id).then(newRoute => {
                    route = newRoute.data;
                    w.clearDirections();
                    w.stops = [];
                    addStops();
                });
            };
        }

        w.on("load", () => {
            let stopLayer = <GraphicsLayer>w._stopLayer;
            let i = 0;
            stopLayer.on("graphic-add", (args: {graphic:Graphic}) => {
                let g = args.graphic;
                if (g.symbol.type === "simplemarkersymbol") {
                    let routeItem = this.routeItemMap[g.attributes.address];
                    if (routeItem) {
                        let symbol = new SimpleMarkerSymbol(g.symbol.toJson());

                        // really want do know if the insp. has alreay been completed...
                        if (routeItem.isActivityCompleted) {
                            symbol.color.a  = 0.1;
                            symbol.outline.color = new Color([200,200,200]);
                        }
                        g.setSymbol(symbol);
                    } 
                }
            });
        });

        let addStops = () => {

            w.addStops(route.routeItems.sort((a, b) => a.ordinalIndex - b.ordinalIndex).map(i => {
                let key = this.getActivityName(i);
                this.routeItemMap[key] = i;
                return {
                    name: key,
                    routeItem: i,
                    feature: new Graphic({
                        geometry: i.location,
                        attributes: {
                            score: 100,
                            routeItem: i
                        }
                    })
                };
            }));

        };

        addStops();

        w.domNode.classList.add(zoneId);

        topic.subscribe("/dnd/drop/before", (source: any, nodes: any, copy: boolean, target: { node: HTMLElement, parent: HTMLElement,current:HTMLElement }, e: MouseEvent) => {
            let dndFrom = <DirectionsWidget>registry.getEnclosingWidget(source.parent);
            if (dndFrom == w) {
                let dndTo = <DirectionsWidget>registry.getEnclosingWidget(target.parent);
                if (dndFrom === dndTo) {
                    updateRoute();
                    return; 
                }
                let i = dndFrom._dnd.getAllNodes().indexOf(nodes[0]);
                let j = dndTo._dnd.getAllNodes().indexOf(target.current);
                let stop = dndFrom.stops[i];
                let stops1 = dndFrom.stops.filter(s => s !== stop);
                let stops2 = dndTo.stops.filter(() => true);
                stops2.splice(j, 0, stop);
                setTimeout(() => {
                    dndFrom.stops = [];
                    dndFrom.reset().then(() => {
                        dndFrom.addStops(stops1);
                    });
                    dndTo.stops = [];
                    dndTo.reset().then(() => {
                        // update the destination route
                        dndTo.addStops(stops2);
                    });
                }, 50);
            } else {
                let dndTo = <DirectionsWidget>registry.getEnclosingWidget(target.parent);
                if (w === dndTo) updateRoute();
            }
        });
        
        return w;
    }

    private routeTemplate(route: Services.Routing.Route) { 
        return `<div class="route">
        <input type="checkbox" checked class="toggler" data-ips-toggler-for="EMP_${route.employeeId}" />
        <label>${route.employeeFullName || route.employeeId}</label>
        <div id="EMP_${route.employeeId}"></div></div>`;
    }
}
