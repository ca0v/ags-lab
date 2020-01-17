import {
  createAutoCompleteWidget,
  ProviderContract
} from "./widgets/auto-complete/index";
import { SearchResult } from "./widgets/auto-complete/SearchResult";
import { SearchResultItem } from "./widgets/auto-complete/SearchResultItem";

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

const addressDatabase = Array(1000)
  .fill(0)
  .map((_, k) => k)
  .map(key => ({
    key: `key${key}`,
    location: [randomInt(), randomInt()],
    address: randomAddress()
  }));

class MockProvider implements ProviderContract {
  name: string;

  search(searchValue: string): Promise<SearchResult> {
    console.log("searching for: ", searchValue);
    return new Promise((good, bad) => {
      setTimeout(() => {
        if (0.01 > Math.random()) bad("Unlucky");
        else
          good({
            items: addressDatabase.filter(
              v => 0 <= v.address.indexOf(searchValue)
            )
          });
      }, randomInt(1000));
    });
  }
}

export function run() {
  try {
    const provider = new MockProvider();
    const widget = createAutoCompleteWidget({
      providers: [provider],
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

    widget.search("N MAIN");
  } catch (ex) {
    console.log(ex.message || ex);
  } finally {
    //
  }
}
