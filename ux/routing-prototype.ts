declare module Routing {

    export interface Activity {
        moniker: string;
        primaryKey: number;
    }

    export interface Location {
        x: number;
        y: number;
    }

    export interface RouteItem {
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

let routes = <Routing.RouteResponse>{
  "data": [
    {
      "employeeId": "10313",
      "routeDate": "2016-03-21T00:00:00",
      "startLocation": {
        "x": 0,
        "y": 0
      },
      "endLocation": {
        "x": 0,
        "y": 0
      },
      "routeItems": [
        {
          "ordinalIndex": 0,
          "activity": {
            "moniker": "Hansen.CDR.Building.Inspection",
            "primaryKey": 1013
          },
          "location": {
            "x": 0,
            "y": 0
          },
          "activityParentType": "DEMO",
          "scheduledDate": "2016-03-21T16:13:23",
          "activityType": "M-Insp",
          "lastModifiedBy": "",
          "lastModifiedDateTime": "0001-01-01T00:00:00",
          "id": 1296,
          "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1296}]}"
        },
        {
          "ordinalIndex": 0,
          "activity": {
            "moniker": "Hansen.CDR.Building.Inspection",
            "primaryKey": 1014
          },
          "location": {
            "x": 0,
            "y": 0
          },
          "activityParentType": "DEMO",
          "scheduledDate": "2016-03-21T16:13:23",
          "activityType": "M-Insp",
          "lastModifiedBy": "",
          "lastModifiedDateTime": "0001-01-01T00:00:00",
          "id": 1297,
          "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1297}]}"
        },
        {
          "ordinalIndex": 0,
          "activity": {
            "moniker": "Hansen.CDR.Building.Inspection",
            "primaryKey": 1015
          },
          "location": {
            "x": 0,
            "y": 0
          },
          "activityParentType": "DEMO",
          "scheduledDate": "2016-03-21T16:13:23",
          "activityType": "Insp",
          "lastModifiedBy": "",
          "lastModifiedDateTime": "0001-01-01T00:00:00",
          "id": 1298,
          "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1298}]}"
        },
        {
          "ordinalIndex": 0,
          "activity": {
            "moniker": "Hansen.CDR.Building.Inspection",
            "primaryKey": 1016
          },
          "location": {
            "x": 0,
            "y": 0
          },
          "activityParentType": "DEMO",
          "scheduledDate": "2016-03-21T16:13:23",
          "activityType": "Insp",
          "lastModifiedBy": "",
          "lastModifiedDateTime": "0001-01-01T00:00:00",
          "id": 1299,
          "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1299}]}"
        },
        {
          "ordinalIndex": 0,
          "activity": {
            "moniker": "Hansen.CDR.Building.Inspection",
            "primaryKey": 1018
          },
          "location": {
            "x": 0,
            "y": 0
          },
          "activityParentType": "DEMO",
          "scheduledDate": "2016-03-21T16:13:23",
          "activityType": "Insp",
          "lastModifiedBy": "",
          "lastModifiedDateTime": "0001-01-01T00:00:00",
          "id": 1301,
          "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1301}]}"
        }
      ],
      "lastModifiedBy": "",
      "lastModifiedDateTime": "0001-01-01T00:00:00",
      "id": 1121,
      "href": "/generic/Hansen.Routing.Route?query={select:[ActivityDate,AddedBy,AddedDateTime,EndGpsXCoordinate,EndGpsYCoordinate,EndGpsZCoordinate,LastModifiedBy,LastModifiedDateTime,RouteKey,StartGpsXCoordinate,StartGpsYCoordinate,StartGpsZCoordinate],distinct:False,filter:[{property:RouteKey,operator:Equal,value:1121}]}"
    },
    {
      "employeeId": "1003",
      "routeDate": "2016-03-21T00:00:00",
      "startLocation": {
        "x": 0,
        "y": 0
      },
      "endLocation": {
        "x": 0,
        "y": 0
      },
      "routeItems": [
        {
          "ordinalIndex": 5,
          "activity": {
            "moniker": "Hansen.CDR.Building.Inspection",
            "primaryKey": 1017
          },
          "location": {
            "x": 0,
            "y": 0
          },
          "activityParentType": "DEMO",
          "scheduledDate": "2016-03-21T16:13:23",
          "activityType": "Insp",
          "lastModifiedBy": "HANSEN8",
          "lastModifiedDateTime": "2016-03-22T16:58:38.77",
          "id": 1300,
          "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1300}]}"
        },
        {
          "ordinalIndex": 1,
          "activity": {
            "moniker": "Hansen.CDR.Building.Inspection",
            "primaryKey": 1019
          },
          "location": {
            "x": 0,
            "y": 0
          },
          "activityParentType": "DEMO",
          "scheduledDate": "2016-03-21T14:14:14",
          "activityType": "Insp",
          "lastModifiedBy": "HANSEN8",
          "lastModifiedDateTime": "2016-03-22T15:57:12.24",
          "id": 1302,
          "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1302}]}"
        },
        {
          "ordinalIndex": 2,
          "activity": {
            "moniker": "Hansen.CDR.Building.Inspection",
            "primaryKey": 1020
          },
          "location": {
            "x": 0,
            "y": 0
          },
          "activityParentType": "DEMO",
          "scheduledDate": "2016-03-21T14:14:14",
          "activityType": "M-Insp",
          "lastModifiedBy": "HANSEN8",
          "lastModifiedDateTime": "2016-03-22T15:57:12.24",
          "id": 1303,
          "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1303}]}"
        },
        {
          "ordinalIndex": 3,
          "activity": {
            "moniker": "Hansen.CDR.Building.Inspection",
            "primaryKey": 1021
          },
          "location": {
            "x": 0,
            "y": 0
          },
          "activityParentType": "UseDeposit",
          "scheduledDate": "2016-03-21T14:14:14",
          "activityType": "Insp 1",
          "lastModifiedBy": "HANSEN8",
          "lastModifiedDateTime": "2016-03-22T15:57:12.24",
          "id": 1304,
          "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1304}]}"
        },
        {
          "ordinalIndex": 4,
          "activity": {
            "moniker": "Hansen.CDR.Building.Inspection",
            "primaryKey": 1022
          },
          "location": {
            "x": 0,
            "y": 0
          },
          "activityParentType": "DEMO",
          "scheduledDate": "2016-03-21T14:14:14",
          "activityType": "M-Insp",
          "lastModifiedBy": "HANSEN8",
          "lastModifiedDateTime": "2016-03-22T15:57:12.243",
          "id": 1305,
          "href": "/generic/Hansen.Routing.RouteItem?query={select:[AddedBy,AddedDateTime,LastModifiedBy,LastModifiedDateTime,OrdinalIndex,RouteItemKey],distinct:False,filter:[{property:RouteItemKey,operator:Equal,value:1305}]}"
        }
      ],
      "lastModifiedBy": "",
      "lastModifiedDateTime": "0001-01-01T00:00:00",
      "id": 1122,
      "href": "/generic/Hansen.Routing.Route?query={select:[ActivityDate,AddedBy,AddedDateTime,EndGpsXCoordinate,EndGpsYCoordinate,EndGpsZCoordinate,LastModifiedBy,LastModifiedDateTime,RouteKey,StartGpsXCoordinate,StartGpsYCoordinate,StartGpsZCoordinate],distinct:False,filter:[{property:RouteKey,operator:Equal,value:1122}]}"
    }
  ],
  "responseStatus": {
    "severity": "Success"
  }
};

routes.data[0].routeItems[0].ordinalIndex

import registry = require("dijit/registry");
import on = require("dojo/on");
import topic = require("dojo/topic");
import Deferred = require("dojo/Deferred");
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

let range = (n: number) => {
    var r = new Array(n);
    for (var i = 0; i < n; i++) r[i] = i;
    return r;
}

let epsg4326 = new SpatialReference({ wkid: 4326 });
let extent = new Extent(-117.13, 32.73, -117.12, 32.74, epsg4326);
let dx = 0;
let dy = 0;
let inspections = range(3 * 5).map(i => {
    dx = Math.random() * (extent.xmax - extent.xmin) / 3;
    dy = Math.random() * (extent.ymax - extent.ymin) / 3;
    let p = new Point(
        extent.xmin + dx * (1 + i % 3),
        extent.ymin + dy * (1 + i % 3),
        epsg4326
    );

    let result = {
        text: `Inspection ${i}`,
        attributes:{ 
            applicationType:  "APPTYPE", 
            inspectionType:  "INSPECTIONTYPE",
            inspector:  ["George", "Henry", "Ian"][i % 3],
            status:  ["ASSIGNED", "COMPLETE"][i > 5 ? 0 : 1],
            scheduledDate:  new Date().toDateString(), 
            recordId: 10000 + i
        },
        magicKey: `XY${i}`,
        zone: config.zones[i % 3].name,
        location: webMercatorUtils.geographicToWebMercator(p)
    };
    return result;
});

function getRoutes() {
    let s = new Services.Routing();
    s.auth().then(() => s.getRoutes().then(routes => {
        routes.data.forEach(route => {
            console.log("route", route);
            debugger;
        });
    }))
}

function toArray<T extends HTMLElement>(l: NodeListOf<Element>) {
    let r = <Array<T>>[];

    for (let i = 0; i < l.length; i++) {
        r.push(<any>l[i]);
    }

    return r;
};

export function parse() {
    getRoutes();
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
    w.on("layer-add-result", (args: { layer: GraphicsLayer }) => {
        console.log(args.layer.id, args.layer);
        switch (args.layer.id) {
            case "directions_routeLayer_dir":
                let l = args.layer;
                l.on("graphic-add", (args: { graphic: Graphic }) => {
                })
                break;
        }
    })
}


export function initializeDirections(id: string, map: Map, zoneId = "blue"): DirectionsWidget {
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


    let inspectionLocator = new Locator("");

    inspectionLocator.setOutSpatialReference(map.spatialReference);
    inspectionLocator.addressesToLocations = (args: {
        magicKey: string;
        address: {
            SingleLine: string;
        },
        distance: number;
        location: any;
        maxLocations: number;
    }, callback: Function, errback: Function) => {
        let d = new Deferred();
        debugger;
        d.then((result: any) => {
            on.emit(inspectionLocator, "addresses-to-locations-complete", result);
        });
        return d;
    };

    inspectionLocator.addressToLocations = (args: {
        magicKey: string;
        address: {
            SingleLine: string;
        },
        distance: number;
        location: Point;
        maxLocations: number;
    }, callback: Function, errback: Function) => {
        let d = new Deferred();

        d.then((result: any) => {
            callback && callback(result);
            on.emit(inspectionLocator, "address-to-locations-complete", result);
        });

        d.resolve(inspections.filter(i => i.text === args.address.SingleLine).map(i => ({
            address: "BOGUS_" + i.text,
            attributes: {
                foo: "foo"
            },
            location: i.location,
            score: 100
        })));

        return d;
    };

    inspectionLocator.locationToAddress = (location: any, distance: number, callback: Function, errback: Function) => {
        let d = new Deferred();

        d.then((result: any) => {
            callback && callback(result);
            on.emit(inspectionLocator, "location-to-address-complete", result);
        });

        //this location gets corrupted in URL until directions are reordered
        let p = new Point(location);
        d.resolve({
            address: "TEST3",
            extent: new Extent(p.x - 1, p.y - 1, p.x, p.y, p.spatialReference),
            location: p,
            score: 100
        });
        return d;
    };

    inspectionLocator.suggestLocations = (args: {
        distance: number;
        maxSuggestions: number;
        text: string;
    }) => {
        let d = new Deferred();

        d.then((suggestions: any[]) => {
            on.emit(inspectionLocator, "suggest-locations-complete", suggestions);
        });
        d.resolve(inspections.filter(i => i.zone === zoneId));
        return d;
    };

    let infoTemplate = new InfoTemplate();

    let w = new DirectionsWidget({
        map: map,
        routeTaskUrl: "http://sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/Route",
        traffic: false,
        optimalRoute: false,
        autoSolve: false,
        returnToStart: false,
        showReturnToStartOption: false,
        showReverseStopsButton: false,
        dragging: false,
        showActivateButton: true,
        showClearButton: true,
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
        stops: [],
        stopsInfoTemplate: infoTemplate,
        searchOptions: {
            addLayersFromMap: false,
            enableSuggestions: true,
            allPlaceholder: "Inspection or Address",
            autoSelect: false,
            enableSearchingAll: false,
            enableSourcesMenu: true,
            sources: [
                {
                    locator: inspectionLocator,
                    singleLineFieldName: "SingleLine",
                    name: "Inspections",
                    localSearchOptions: {
                        minScale: 3000,
                        distance: 500
                    },
                    placeholder: "Inspection #",
                    maxResults: 3,
                    maxSuggestions: 6,
                    enableSuggestions: true,
                    minCharacters: 3
                }]
        }
    }, id);

    w.zoomToFullRoute = () => {
        // not allowed
    };

    infoTemplate.setContent((args: {
         attributes: { 
        address: string; 
        applicationType: string; 
        inspectionType: string; 
        inspector: string; 
        status: string; 
        scheduledDate: string; 
        recordId: string; 
    } }) => {
        let insp = inspections.filter(n => n.text === args.attributes.address)[0];
        let data = <any>insp.attributes;
        let keys = Object.keys(data);
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
        //
    });

    w.on("directions-finish", () => {
        let stopIcons = w.domNode.getElementsByClassName("esriStopIcon");
        w.stops.forEach((s,i) => {
            let insp = inspections.filter(n => n.text === s.name)[0];
            if (insp) {
                stopIcons[i].classList.add(insp.attributes.status);
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

    w.on("load", () => {
        let stopLayer = <GraphicsLayer>w._stopLayer;
        let i = 0;
        stopLayer.on("graphic-add", (args: {graphic:Graphic}) => {
            let g = args.graphic;
            if (g.symbol.type === "simplemarkersymbol") {
                let insp = inspections.filter(n => n.text === g.attributes.address)[0];
                if (insp) {
                    let symbol = new SimpleMarkerSymbol(g.symbol.toJson());
                    if (insp.attributes.status === "COMPLETE") {
                        symbol.color.a  = 0.1;
                        symbol.outline.color = new Color([200,200,200]);
                    }
                    g.setSymbol(symbol);
                } 
            }
        });
    });
    
    w.addStops(inspections.filter(i => i.zone === zoneId).map(i => ({
        name: i.text,
        feature: new Graphic({ geometry: i.location, attributes: { score: 100 } })
    })));

    w.domNode.classList.add(zoneId);

    topic.subscribe("/dnd/drop/before", (source: any, nodes: any, copy: boolean, target: { node: HTMLElement, parent: HTMLElement,current:HTMLElement }, e: MouseEvent) => {
        let dndFrom = <DirectionsWidget>registry.getEnclosingWidget(source.parent);
        if (dndFrom == w) {
            let dndTo = <DirectionsWidget>registry.getEnclosingWidget(target.parent);
            if (dndFrom === dndTo) return;
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
                    dndTo.addStops(stops2);
                });
            }, 500);
        }
    });
    
    return w;
}

