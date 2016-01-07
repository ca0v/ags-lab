import * as topic from "./pubsub";
import Maplet from "./maplet";
import RouteSolve from "./ags-route-solve-proxy";
import Suggest from "./ags-suggest-proxy";
import FindAddress from "./ags-find-address-proxy";
import Find from "./ags-find-proxy";
import ReverseGeocode from "./ags-reverse-geocode-proxy";
import ServiceSolve from "./ags-servicearea-solve-proxy";

let asList = (nodeList: NodeList) => {
    let result = <Array<HTMLElement>>[];
    for (let i=0; i<nodeList.length; i++) {
        result.push(<HTMLElement>nodeList[i]);
    }
    return result;
};
 
/** add the geometry to the map  */
topic.subscribe("add-geometry-to-map", () => {    
    let geomText = (<HTMLTextAreaElement>document.getElementById("geometry")).value;
    let geomJs = JSON.parse(geomText);

    if (Array.isArray(geomJs)) {
        let items = <Array<{x: number; y: number;}>>geomJs;
        items.forEach(item => topic.publish("add-point", item));
    } else {
        switch (geomJs) {
            case "rings":
            break;
            default:
            break;
        }
    }
})

let run = () => {
    let events = asList(document.querySelectorAll("[data-event]"));
    events.forEach(e => e.addEventListener("click", () => topic.publish(e.dataset["event"], e)));

    let content = document.getElementById("console");
    let log = console.log;
    console.log = (...args: string[]) => {
        log.apply(console, args);
        let div = document.createElement("textarea");
        div.innerText = args.map(JSON.stringify).join(" ");
        content.appendChild(div);
    }
    
    Maplet.test();
    //Suggest.test();
    FindAddress.test();
    //Find.test();
    //ReverseGeocode.test();
    //RouteSolve.test();
    //ServiceSolve.test();
}

window.onload = run;