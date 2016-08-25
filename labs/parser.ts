import Topic from "./pubsub";

let topic = new Topic();

let asList = (nodeList: NodeList) => {
    let result = <Array<HTMLElement>>[];
    for (let i = 0; i < nodeList.length; i++) {
        result.push(<HTMLElement>nodeList[i]);
    }
    return result;
};

export function run() {

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
                    topic.publish("add-point", { x: items[0], y: items[1] });
                }
            }
            console.log(geomJs);
            textarea.value = "";
        }
    });

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

    let app = { topic: topic };
};
