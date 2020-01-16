import {
  createAutoCompleteWidget,
  ProviderContract
} from "./widgets/auto-complete/index";
import { SearchResult } from "./widgets/auto-complete/SearchResult";
import { SearchResultItem } from "./widgets/auto-complete/SearchResultItem";

class MockProvider implements ProviderContract {
  name: string;
  search(searchValue: string): Promise<SearchResult> {
    console.log("searching for: ", searchValue);
    return new Promise((good, bad) => {
      if (0.1 > Math.random()) bad("Unlucky");
      else good({ items: [] });
    });
  }
}

export function run() {
  try {
    const provider = new MockProvider();
    const widget = createAutoCompleteWidget([provider]);
    document.body.insertBefore(widget.dom, document.body.firstChild);
    widget.on("error", result => {
      console.log("error: ", result);
      widget.dispose();
    });
    widget.search("foo");
  } catch (ex) {
    console.log(ex.message || ex);
  } finally {
    //
  }
}
