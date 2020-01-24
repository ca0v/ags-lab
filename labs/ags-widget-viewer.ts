import { createAutoCompleteWidget } from "./widgets/auto-complete/index";
import {
  SearchResultItem,
  SearchResultTypes
} from "./widgets/auto-complete/SearchResultItem";
import { MockProvider } from "./widgets/auto-complete/MockProvider";
import { AnimationExtension } from "./widgets/auto-complete/AnimationExtension";

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
  fill: silver;
  stroke: black;
}

.widget.autocomplete .results .marker .business {
  fill: green;
  stroke: black;
}

.widget.autocomplete .results .marker .park {
  fill: rgb(20, 255, 20);
  stroke: brown;
}

.widget.autocomplete .results .marker .political {
  fill: blue;
  stroke: red;
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
  const types: SearchResultTypes = ["address", "business", "park", "political"];
  return types[randomInt(types.length)];
}

function createDatabase(size = 1000) {
  return Array(size)
    .fill(0)
    .map((_, k) => k)
    .map(key => ({
      key: `key${key}`,
      location: [randomInt(), randomInt()],
      address: randomAddress()
    }));
}

export function run() {
  try {
    const widget = createAutoCompleteWidget({
      providers: [
        new MockProvider({
          id: "MockFast",
          database: createDatabase(500),
          delay: 100,
          transform: ({ key, location, address }) => ({
            key: key + "fast_provider",
            address_type: [randomAddressType()],
            location,
            address: address.toLowerCase()
          })
        }),
        new MockProvider({
          id: "MockSlow",
          database: createDatabase(500),
          delay: 2000,
          transform: ({ key, location, address }) => ({
            key: key + "slow_provider",
            address_type: [randomAddressType()],
            location,
            address: address.toUpperCase()
          })
        })
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

    widget.subscribe("selectresult", (item: SearchResultItem) => {
      console.log("item selected: ", item);
      widget.dispose();
    });

    widget.search("N MAIN AVE");
  } catch (ex) {
    console.log(ex.message || ex);
  } finally {
    //
  }
}
