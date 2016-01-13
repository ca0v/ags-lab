import * as topic from "./pubsub";
import Maplet from "./maplet";
import Query from "./ags-feature-query-proxy";
import Lrs from "./ags-lrs-proxy";
import RouteSolve from "./ags-route-solve-proxy";
import Suggest from "./ags-suggest-proxy";
import FindAddress from "./ags-find-address-proxy";
import Find from "./ags-find-proxy";
import ReverseGeocode from "./ags-reverse-geocode-proxy";
import ServiceSolve from "./ags-servicearea-solve-proxy";
import MapFind from "./ags-map-find-proxy";
import MapIdentify from "./ags-map-identify-proxy";
import MapQuery from "./ags-map-query-proxy";

let asList = (nodeList: NodeList) => {
    let result = <Array<HTMLElement>>[];
    for (let i=0; i<nodeList.length; i++) {
        result.push(<HTMLElement>nodeList[i]);
    }
    return result;
};
 
/** add the geometry to the map  */
topic.subscribe("add-geometry-to-map", () => {    
    let textarea = <HTMLTextAreaElement>document.getElementById("geometry"); 
    let geomText = textarea.value;
    let geomJs = <Array<any>>JSON.parse(geomText);
    
    if ("x" in geomJs) geomJs = [geomJs];
        
    if (Array.isArray(geomJs)) {
        let items = geomJs;
        if (typeof geomJs[0]["x"] !== "undefined") {
            items.forEach(item => topic.publish("add-point", item));
        } else {
            if (Array.isArray(geomJs[0])) {
                if (typeof geomJs[0][0] == "number") {
                    topic.publish("add-polyline", items);
                } else {                
                    topic.publish("add-polygon", items);
                }
            } else {
                topic.publish("add-point", {x: items[0], y: items[1] });                
            }
        }
        console.log(geomJs);
        textarea.value = "";
    }
});

let run = () => {
    let events = asList(document.querySelectorAll("[data-event]"));
    events.forEach(e => e.addEventListener("click", () => topic.publish(e.dataset["event"], e)));

    let content = document.getElementById("console");
    let log = console.log;
    console.log = (...args: string[]) => {
        log.apply(console, args);
        let div = document.createElement("textarea");
        div.innerText = args.map(JSON.stringify).join(" ");
        content.insertBefore(div, null);
    }
    
    Maplet.test();
    MapQuery.test();
    //MapIdentify.test();
    //MapFind.test();
    //Query.test();
    //Lrs.test();
    //Suggest.test();
    //FindAddress.test();
    //Find.test();
    //ReverseGeocode.test();
    //RouteSolve.test();
    //ServiceSolve.test();
}

export = run; 
