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

class MockProvider implements ProviderContract {
  name: string;

  constructor(
    public options: {
      delay: number;
      transform: (row: SearchResultItem) => SearchResultItem;
      database: Array<{
        key: string;
        location: Array<number>;
        address: string;
      }>;
    }
  ) {}

  search(searchValue: string): Promise<SearchResult> {
    console.log("searching for: ", searchValue);
    return new Promise((good, bad) => {
      setTimeout(() => {
        if (0.01 > Math.random()) bad("Unlucky");
        else {
          const items = this.options.database.filter(
            v => 0 <= v.address.indexOf(searchValue)
          );
          good({
            searchHash: searchValue,
            items: items.map(item => this.options.transform(item))
          });
        }
      }, randomInt(this.options.delay));
    });
  }
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
