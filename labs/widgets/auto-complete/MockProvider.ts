import { ProviderContract } from "./index";
import { SearchResult } from "./SearchResult";
import { SearchResultItem } from "./SearchResultItem";
import { randomInt } from "../../ags-widget-viewer";
export class MockProvider implements ProviderContract {
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
