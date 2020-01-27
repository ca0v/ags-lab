import { createAutoCompleteWidget } from "./widgets/auto-complete/index";
import {
    SearchResultItem,
    SearchResultTypes
} from "./widgets/auto-complete/typings/SearchResultItem";
import { MockProvider } from "./widgets/auto-complete/providers/MockProvider";
import { AnimationExtension } from "./widgets/auto-complete/extensions/AnimationExtension";
import { AgsLocatorProvider } from "./widgets/auto-complete/providers/AgsLocatorProvider";

function camelize(text: string) {
    const words = text.split(" ");
    return words
        .map(
            word =>
                word.substring(0, 1).toUpperCase() +
                word.substring(1).toLowerCase()
        )
        .join(" ");
}

injectCss(
    "demo",
    `
.widget.autocomplete {
  background-color: white;
  color: black;
  padding: 0.5em;
}

.widget.autocomplete .input {
  padding-left: 0.5em;
}

.widget.autocomplete .results .marker .address {
  fill: rgb(255, 0, 0);
  stroke: rgb(20, 20, 200);
}

.widget.autocomplete .results .marker .business {
  fill: rgb(0, 0, 255);
  stroke: rgb(20, 20, 200);
}

.widget.autocomplete .results .marker .park {
  fill: rgb(20, 200, 20);
  stroke: rgb(20, 20, 200);
}

.widget.autocomplete .results .marker .political {
  fill: blue;
  stroke: rgb(20, 20, 200);
}
`
);

function injectCss(namespace: string, css: string) {
    if (document.head.querySelector(`style[id="${namespace}"]`))
        throw "css already exists";
    const style = document.createElement("style");
    style.id = name;
    style.innerText = css;
    document.head.appendChild(style);
}

function randomInt(range = 1000) {
    return Math.floor(range * Math.random());
}

function randomCompassDir() {
    const list = "N S W E NW NE SW SE".split(" ");
    return list[randomInt(list.length)];
}

function randomStreetName() {
    const list = "MAIN PLEASANT MOUNTAIN PINNACLE SUMMIT RAMPART".split(" ");
    return list[randomInt(list.length)];
}

function randomStreetSuffix() {
    const list = "ST AVE WAY COURT BLVD".split(" ");
    return list[randomInt(list.length)];
}

function randomAddress() {
    return `${1 +
        randomInt()} ${randomCompassDir()} ${randomStreetName()} ${randomStreetSuffix()}`;
}

function randomAddressType() {
    const types: SearchResultTypes = [
        "address",
        "business",
        "park",
        "political"
    ];
    return types[randomInt(types.length)];
}

function createDatabase(size = 1000) {
    return Array(size)
        .fill(0)
        .map((_, k) => k)
        .map(key => ({
            key: `key${key}`,
            location: [randomInt(), randomInt()],
            address_type: [randomAddressType()],
            address: randomAddress()
        }));
}

export function run() {
    try {
        const widget = createAutoCompleteWidget({
            providers: [
                // new MockProvider({
                //     id: "Sluggard",
                //     database: createDatabase(500),
                //     delay: 4000,
                //     maxResultCount: 6,
                //     transform: ({ key, location, address, address_type }) => ({
                //         key,
                //         address_type,
                //         location,
                //         address: camelize(address)
                //     })
                // }),
                // new MockProvider({
                //     id: "MockFast",
                //     database: createDatabase(500),
                //     delay: 100,
                //     maxResultCount: 6,
                //     transform: ({ key, location, address, address_type }) => ({
                //         key,
                //         address_type,
                //         location,
                //         address: address.toLowerCase()
                //     })
                // }),
                // new MockProvider({
                //     id: "MockFastest",
                //     database: createDatabase(50),
                //     delay: 10,
                //     maxResultCount: 1,
                //     transform: ({ key, location, address, address_type }) => ({
                //         key,
                //         address_type,
                //         location,
                //         address: address.toLowerCase()
                //     })
                // }),
                // new MockProvider({
                //     id: "MockSlow",
                //     maxResultCount: 6,
                //     database: createDatabase(500),
                //     delay: 2000,
                //     transform: ({ key, location, address, address_type, provider_id }) => ({
                //         provider_id,
                //         key,
                //         address_type,
                //         location,
                //         address: address.toUpperCase()
                //     })
                // }),
                new AgsLocatorProvider()
            ],
            delay: 200
        });

        widget.ext(new AnimationExtension());

        document.body.insertBefore(widget.dom, document.body.firstChild);

        widget.subscribe("error", result => {
            console.log("error: ", result);
        });

        widget.subscribe("focusresult", (item: SearchResultItem) => {
            console.log("item focused: ", item);
        });

        /**
         * request a search to be performed using that item
         */
        widget.subscribe("selectresult", async (item: SearchResultItem) => {
            console.log("item selected: ", item);
            if (!!item.location) {
                console.log("location", item.location);
                widget.dispose();
            } else {
                const searchResult = await widget.locate(item);
                console.log("location:", searchResult.items[0].location);
                widget.dispose();
            }
        });

        //widget.search("N MAIN AVE");
    } catch (ex) {
        console.log(ex.message || ex);
    } finally {
        //
    }
}
