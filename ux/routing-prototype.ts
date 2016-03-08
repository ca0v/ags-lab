import on = require("dojo/on");
import Deferred = require("dojo/Deferred");
import Map = require("esri/map");
import InfoTemplate = require("esri/InfoTemplate");
import Layer = require("esri/layers/GraphicsLayer");
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

function toArray<T extends HTMLElement>(l: NodeListOf<Element>) {
    let r = <Array<T>>[];

    for (let i = 0; i < l.length; i++) {
        r.push(<any>l[i]);
    }

    return r;
};

export function parse() {
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
    //w.addLayer(new FeatureLayer("http://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/US_Senators/FeatureServer/0"));
    w.on("layer-add-result", (args: { layer: Layer }) => {
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


export function initializeDirections(id: string, map: Map, color = "blue"): DirectionsWidget {
    let marker = new SimpleMarkerSymbol({
        "color": Color.named[color],
        "size": 16,
        "xoffset": 0,
        "yoffset": 0,
        "type": "esriSMS",
        "style": SimpleMarkerSymbol.STYLE_CIRCLE,
        "outline": {
            "color": Color.named[color],
            "width": 1,
            "type": "esriSLS",
            "style": "esriSLSSolid"
        }
    });
    marker.color.a = 0.5;

    let routeLines = new SimpleLineSymbol("solid", new Color(color), 3);
    routeLines.color.a = 0.5;


    let locator = new Locator("");

    locator.addressesToLocations = (args: {
        address: {
            SingleLine: string;
        },
        distance: number;
        location: any;
        maxLocations: number;
    }, callback: Function, errback: Function) => {
        let result = [
            {
                address: `XY ${args.address.SingleLine}`,
                attributes: { "SingleLine": "TEST" },
                location: {},
                score: 100
            }];

        on.emit(Locator, "addresses-to-locations-complete", result);
    };

    locator.addressToLocations = (args: {
        magicKey: string;
        address: {
            SingleLine: string;
        },
        distance: number;
        location: any;
        maxLocations: number;
    }, callback: Function, errback: Function) => {
        let d = new Deferred();
        let result = [{
            address: `XY ${args.magicKey}`,
            attributes: { "SingleLine": "TEST" },
            location: {},
            score: 100
        }];
        d.then((result: any) => {
            on.emit(locator, "address-to-locations-complete", result);
        });
        d.resolve(result);
        return d;
    };

    locator.locationToAddress = (location: any, distance: number, callback: Function, errback: Function) => {
        let result = {
            address: "TEST3",
            location: {},
            score: 100
        };
        on.emit(locator, "location-to-address-complete", result);
    };

    locator.suggestLocations = (args: {
        distance: number;
        maxSuggestions: number;
        text: string;
    }) => {
        let d = new Deferred();
        //    on(type: "suggest-locations-complete", listener: (event: { suggestions: any[]; target: Locator }) => void): esri.Handle;
        let result = {
            suggestions: [
                {
                    "text": "Inspection 12345",
                    magicKey: "12345"
                },
                {
                    "text": "Inspection 12346",
                    magicKey: "12346"
                },
                {
                    "text": "Inspection 12347",
                    magicKey: "12347"
                },
                {
                    "text": "Inspection 12348",
                    magicKey: "12348"
                },
                {
                    "text": "Inspection 12349",
                    magicKey: "12349"
                }
            ]
        };
        d.then((suggestions: any[]) => {
            on.emit(locator, "suggest-locations-complete", suggestions);
        });
        d.resolve(result.suggestions);
        return d;
    };

    let w = new DirectionsWidget({
        map: map,
        routeTaskUrl: "http://sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/Route",
        optimalRoute: false,
        autoSolve: false,
        returnToStart: false,
        showReturnToStartOption: false,
        showReverseStopsButton: false,
        dragging: false,
        showMilesKilometersOption: false,
        showOptimalRouteOption: false,
        showTrafficOption: false,
        showTravelModesOption: false,
        fromSymbol: <any>marker,
        stopSymbol: <any>marker,
        toSymbol: <any>marker,
        textSymbolOffset: { x: 0, y: -4 },
        routeSymbol: routeLines,
        searchOptions: {
            addLayersFromMap: false,
            enableSuggestions: true,
            sources: [
                {
                    featureLayer: new FeatureLayer("http://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/US_Senators/FeatureServer/0"),
                    searchFields: ["Name", "State", "Party"],
                    suggestionTemplate: "${Name}, ${State} Party: ${Party}",
                    exactMatch: false,
                    outFields: ["*"],
                    name: "Senators",
                    //labelSymbol: textSymbol,
                    placeholder: "Senator name",
                    maxResults: 6,
                    maxSuggestions: 6,
                    enableSuggestions: true,
                    minCharacters: 0,
                    searchQueryParams: { distance: 5000 },
                },
                {
                    featureLayer: new FeatureLayer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/PoolPermits/FeatureServer/0"),
                    searchFields: ["objectid", "address"],
                    suggestionTemplate: "${address}, ${objectid}",
                    exactMatch: false,
                    outFields: ["*"],
                    name: "address",
                    //labelSymbol: textSymbol,
                    placeholder: "address",
                    maxResults: 6,
                    maxSuggestions: 6,
                    enableSuggestions: true,
                    minCharacters: 0,
                    searchQueryParams: { distance: 5000 },
                },
                {
                    locator: locator,
                    singleLineFieldName: "SingleLine",
                    name: "Custom Geocoding Service",
                    localSearchOptions: {
                        minScale: 300000,
                        distance: 50000
                    },
                    placeholder: "Search Geocoder",
                    maxResults: 3,
                    maxSuggestions: 6,
                    enableSuggestions: true,
                    minCharacters: 0
                }]
        }
    }, id);


    w.on("segment-highlight", (g: Graphic) => {
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

    return w;
}