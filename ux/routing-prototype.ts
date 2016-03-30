// To use the IdentityManager simply include esri/IdentityManager as part of your require statement.
//import "esri/IdentityManager";

import registry = require("dijit/registry");
import on = require("dojo/on");
import topic = require("dojo/topic");
import dom = require("dojo/dom-construct");
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

let routeItemMap = <{[s: string]: Services.Routing.RouteItem}>{};

let RoutingService : Services.Routing;

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

let epsg4326 = new SpatialReference({ wkid: 4326 });

let extent = new Extent(-117.13, 32.73, -117.12, 32.74, epsg4326);

let nextColor = ((colors:string[]) => {
    let i = 0;
    let f = () => colors[i++ % colors.length];
    return f;
})("red,green,blue".split(","));

let template = (route: Services.Routing.Route) => `
<div class="route">
    <input type="checkbox" class="toggler" data-ips-toggler-for="${route.employeeId}" />
    <label>${route.employeeFullName || route.employeeId}</label>
    <div id="${route.employeeId}"></div>
</div>`;

function toArray<T extends HTMLElement>(l: NodeListOf<Element>) {
    let r = <Array<T>>[];

    for (let i = 0; i < l.length; i++) {
        r.push(<any>l[i]);
    }

    return r;
};

function parse() {
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

export function initializeMap(w: Map) {
    w.setExtent(extent, true);
    //w.addLayer(new FeatureLayer("http://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/US_Senators/FeatureServer/0"));
}

let getActivityName = (routeItem: Services.Routing.RouteItem) => {
    return `${routeItem.activityType} #${routeItem.id}`;
}

function initializeDirections(id: string, map: Map, route: Services.Routing.Route, zoneId = "blue"): DirectionsWidget {
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
        let routeItems = <Services.Routing.RouteItem[]>w.stops.map(s => routeItemMap[s.name]);
        routeItems.forEach((r, i) => r.ordinalIndex = i + 1);
        RoutingService.updateRoute(route.id, routeItems.map(i => i.id));
    }, 500);

    let infoTemplate = new InfoTemplate();

    let w = new DirectionsWidget({
        map: map,
        //routeTaskUrl: "http://sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/Route",
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
        // fromSymbol: <any>marker,
        // stopSymbol: <any>marker,
        toSymbol: <any>marker,
        unreachedSymbol: <any>marker,
        textSymbolOffset: { x: 0, y: -4 },
        routeSymbol: routeLines,
        stops: [],
        stopsInfoTemplate: infoTemplate
    }, id);

    w.zoomToFullRoute = () => {
        // not allowed
    };

    infoTemplate.setContent((args: {
         attributes: { 
        address: string; 
    } }) => {
        let routeItem = routeItemMap[args.attributes.address];
        let data = <any>routeItem;
        let keys = Object.keys(data).filter(k => typeof data[k] !== "Object");
        keys = "id,isActivityCompleted,scheduledDate,activityType,lastModifiedBy,lastModifiedDateTime".split(',');
        return `${keys.map(k => `${k}: ${data[k]}`).join("<br/>")}`;
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
        w.stops.forEach((s,i) => {
            let routeItem = routeItemMap[s.name];
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

    w.routeParams.returnDirections = false;
    w.routeParams.preserveLastStop = false;
    w.routeParams.startTime; // TODO

    w.startup();

    {
        let optimizeButton = document.createElement("button");
        optimizeButton.className = "ipsOptimizeButton";
        optimizeButton.innerHTML = "Optimize";
        let parent = w.domNode.getElementsByClassName("esriStopsButtons")[0];
        parent.appendChild(optimizeButton);
        optimizeButton.onclick = () => {
            w.reset();
            RoutingService.optimizeRoute(route.id).then(newRoute => {
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
                let routeItem = routeItemMap[g.attributes.address];
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
            let key = getActivityName(i);
            routeItemMap[key] = i;
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

        return;

        routeItemMap["Start"] = route.routeItems[0];

        w.addStop({
            name: "Start",
            routeItem: routeItemMap["Start"],
            feature: new Graphic({
                geometry: route.startLocation
            })
        }, 0);

        routeItemMap["Finish"] = route.routeItems[route.routeItems.length - 1];

        w.addStop({
            name: "Finish",
            routeItem: routeItemMap["Finish"],
            feature: new Graphic({
                geometry: route.endLocation
            })
        }, w.stops.length - 1);

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

export function getRoutes(routesDom: HTMLElement, config: {
    map: Map;
    restapi: string;
    auth: { username: string; password: string;}
}) {

    let s = RoutingService = new Services.Routing(config.restapi);

    let status = document.createElement("label");
    status.classList.add("status");
    routesDom.appendChild(status);

    let h = setInterval(() => {
        status.innerHTML += ".";
    }, 2000);

    let reportStatus = (text: string) => {
        status.innerHTML = text + "&nbsp;";
        status.title = text;
    };

    let removeStatus = () => {
        clearInterval(h);
        status.parentNode.removeChild(status);
    }

    reportStatus("Authenticating");
    s.auth(config.auth).then(() => {

        reportStatus("Getting routes");
        s.getRoutes().then(routes => {

            removeStatus();

            routes.data.forEach(route => {
                // create a container
                let routeNode = dom.toDom(template(route));
                routesDom.appendChild(routeNode);
                initializeDirections(route.employeeId, config.map, route, nextColor());
            });


            parse();

        });
    });
}

