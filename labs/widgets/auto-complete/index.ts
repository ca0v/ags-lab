type RemoveEventHandler = {
  remove: () => void;
};

type Geometry = Array<number>;

type SearchResult = {
  items: Array<SearchResultItem>;
};

type SearchResultItem = {
  key: string;
  location: Geometry;
};

/**
 * Each search provider will perform a search on behalf of the widget
 * and report results back to the widget
 */
interface AutoCompleteProviderContract<T extends SearchResult> {
  /**
   * Unique and friendly identifier for this provider
   */
  name: string;

  /**
   * Perform a search, streaming results back to the caller
   * @param searchValue value to pass to the search services
   */
  search(searchValue: string): T | Promise<T>;
}

/**
 * Controller logic between the widget and providers
 * to keep the UX keanly focused on layout and event handling
 */
interface AutoCompleteEngineContract {
  /**
   * Invoke a search for the given value
   * @param value search value
   */
  search(value: string): void;

  /**
   * Adds a search provider
   * @param provider provider to register with this widget
   */
  use(provider: AutoCompleteProviderContract<SearchResult>): void;
}

/**
 * This is the only interface outsiders see
 */
interface AutoCompleteWidgetContract {
  /**
   * The root element
   */
  readonly dom: HTMLElement;
  dispose(): void;

  /**
   * @param topic [blur|focus]result, [multi[un]]selectresult
   */
  on(
    topic: "blurresult",
    cb: (result: SearchResultItem) => void
  ): RemoveEventHandler;
  on(
    topic: "focusresult",
    cb: (result: SearchResultItem) => void
  ): RemoveEventHandler;
  on(
    topic: "selectresult",
    cb: (result: SearchResultItem) => void
  ): RemoveEventHandler;
  on(
    topic: "unselectresult",
    cb: (result: SearchResultItem) => void
  ): RemoveEventHandler;
  on(
    topic: "multiselectresult",
    cb: (result: SearchResultItem[]) => void
  ): RemoveEventHandler;
  on(
    topic: "multiunselectresult",
    cb: (result: SearchResultItem[]) => void
  ): RemoveEventHandler;
}

/**
 * Generic auto-complete
 */
class AutoCompleteEngine implements AutoCompleteEngineContract {
  search(value: string): void {
    throw new Error("Method not implemented.");
  }

  async use(provider: AutoCompleteProviderContract<SearchResult>) {
    let result = await provider.search("");
    let { name } = provider;
    let [{ key, location }] = result.items;
  }
}

class AutoCompleteWidget implements AutoCompleteWidgetContract {
  dom: HTMLElement;

  dispose(): void {
    throw new Error("Method not implemented.");
  }

  on(topic: any, cb: any): RemoveEventHandler {
    throw new Error("Method not implemented.");
  }

  private engine: AutoCompleteEngine;

  private ux: {
    input: HTMLInputElement;
    cancel: HTMLButtonElement;
    search: HTMLButtonElement;
    results: HTMLDivElement;
  };

  constructor() {
    this.engine = new AutoCompleteEngine();
    let { input, cancel, search, results } = (this.ux = {
      input: document.createElement("input"),
      cancel: document.createElement("button"),
      search: document.createElement("button"),
      results: document.createElement("div")
    });
    input.addEventListener("change", () => this.onInputChanged());
  }

  private onInputChanged() {}

  use(provider: AutoCompleteProviderContract<SearchResult>): void {
    this.engine.use(provider);
  }
}

export function createAutoCompleteWidget(
  providers: Array<AutoCompleteProviderContract<SearchResult>>
) {
  let widget = new AutoCompleteWidget();
  providers.forEach(widget.use);
  return widget as AutoCompleteWidgetContract;
}

function test() {
  let w = createAutoCompleteWidget([]);
  w.dispose();
  w.on("blurresult", r => r.key);
}
