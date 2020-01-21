import { createAutoCompleteWidget } from "./widgets/auto-complete/index";
import {
  SearchResultItem,
  SearchResultTypes
} from "./widgets/auto-complete/SearchResultItem";
import { MockProvider } from "./widgets/auto-complete/MockProvider";

export function randomInt(range = 1000) {
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
          delay: 100,
          transform: row => row,
          database: createDatabase(500)
        }),
        new MockProvider({
          database: createDatabase(500),
          delay: 2000,
          transform: ({ key, location, address }) => ({
            key: key + "slow_provider",
            address_type: [randomAddressType()],
            location,
            address: address.toLowerCase()
          })
        })
      ],
      delay: 200
    });

    document.body.insertBefore(widget.dom, document.body.firstChild);

    widget.on("error", result => {
      console.log("error: ", result);
    });

    widget.on("focusresult", (item: SearchResultItem) => {
      console.log("item focused: ", item);
    });

    widget.on("selectresult", (item: SearchResultItem) => {
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
