import Map = require("esri/map");
import Layer = require("esri/layers/GraphicsLayer");
import DirectionsWidget = require("esri/dijit/Directions");
import Renderer = require("esri/renderers/SimpleRenderer");
import SimpleLineSymbol = require("esri/symbols/SimpleLineSymbol");
import PictureMarkerSymbol = require("esri/symbols/PictureMarkerSymbol");
import SimpleMarkerSymbol = require("esri/symbols/SimpleMarkerSymbol");
import SimpleFillSymbol = require("esri/symbols/SimpleFillSymbol");
import Color = require("esri/Color");
import Graphic = require("esri/graphic");

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
    w.on("layer-add-result", (args: { layer: Layer }) => {
        console.log(args.layer.id);
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
            enableSearchingAll: false,
            enableSuggestions:false
        }
    }, id);

    w.on("segment-highlight", (g: Graphic) => {
    });
    
    w.on("directions-finish", () => {
       let groups = toArray(document.getElementById(id).getElementsByClassName("searchInputGroup"));
       groups.forEach(g => {
           let div = document.createElement("label");
           div.innerHTML ="here<br/>I AM";
           g.appendChild(div);
       }); 
    });

    w.startup();


    return w;
}