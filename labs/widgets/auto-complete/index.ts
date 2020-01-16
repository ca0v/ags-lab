function keys<T>(o: T): Array<keyof T> {
  return <any>Object.keys(o);
}

interface Dictionary<T> {
  [n: string]: T;
}

type RemoveEventHandler = {
  remove: () => void;
};

type Geometry = Array<number>;

export type SearchResult = {
  items: Array<SearchResultItem>;
};

export type SearchResultItem = {
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
  search(searchValue: string): Promise<T>;
}

/**
 * Controller logic between the widget and providers
 * to keep the UX keanly focused on layout and event handling
 */
interface AutoCompleteEngineContract {
  dispose(): void;
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
  on(topic: string, cb: (result: any) => void): RemoveEventHandler;
}

interface WidgetContract {
  /**
   * The root element
   */
  readonly dom: HTMLElement;
  dispose(): void;
  on(topic: string, cb: (result: any) => void): RemoveEventHandler;
  publish(topic: string, ...args: any): void;
}

class Channel {
  private topics: Dictionary<Array<(...args: any[]) => void>> = {};

  dispose() {
    this.topics = {};
  }

  on(topic: string, cb: (result: any) => void): RemoveEventHandler {
    const listener = (this.topics[topic] = this.topics[topic] || []);
    listener.push(cb);
    return {
      remove: () => {
        const index = listener.indexOf(cb);
        if (index < 0) return;
        listener.splice(index, 1);
      }
    };
  }

  publish(topic: string, ...args: any) {
    if (!this.topics[topic]) return false;
    this.topics[topic].forEach(listener => listener(...args));
  }
}

class Widget implements WidgetContract {
  public dom: HTMLElement;
  public channel: Channel;

  /**
   * Create a default dom container for a generic widget
   */
  constructor() {
    this.dom = document.createElement("div");
    this.dom.className = "widget";
    this.channel = new Channel();
  }

  dispose(): void {
    this.dom.remove();
  }

  on(topic: string, cb: (result: any) => void): RemoveEventHandler {
    return this.channel.on(topic, cb);
  }

  publish(topic: string, ...args: any) {
    return this.channel.publish(topic, ...args);
  }
}

/**
 * This is the only interface outsiders see
 */
interface AutoCompleteWidgetContract extends WidgetContract {
  /**
   * @param topic [blur|focus]result, [multi[un]]selectresult
   */
  on(topic: "error", cb: (result: string) => void);
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
  search(value: string): void;
}

/**
 * Generic auto-complete
 */
class AutoCompleteEngine implements AutoCompleteEngineContract {
  private channel = new Channel();
  private providers: Array<AutoCompleteProviderContract<SearchResult>> = [];

  dispose() {
    this.channel.dispose();
  }

  on(topic: string, cb: (result: any) => void) {
    return this.channel.on(topic, cb);
  }

  private onError(message: string) {
    console.log("error", message);
    this.channel.publish("error", message);
  }

  private onSuccess(result: SearchResult) {
    console.log("success", result);
    this.channel.publish("success", result);
  }

  search(value: string): void {
    const results = this.providers.map(provider => provider.search(value));

    results.forEach(result => {
      result
        .catch(reason => {
          this.onError(reason);
        })
        .then(result => {
          if (!result) throw "response expected";
          this.onSuccess(result);
        });
    });
  }

  async use(provider: AutoCompleteProviderContract<SearchResult>) {
    this.providers.push(provider);
  }
}

class AutoCompleteWidget extends Widget implements AutoCompleteWidgetContract {
  dom: HTMLElement;

  private engine: AutoCompleteEngine;

  private ux: {
    input: HTMLInputElement;
    cancel: HTMLButtonElement;
    search: HTMLButtonElement;
    results: HTMLDivElement;
  };

  public constructor() {
    super();
    this.engine = new AutoCompleteEngine();
    let { input, cancel, search, results } = (this.ux = {
      input: document.createElement("input"),
      cancel: document.createElement("button"),
      search: document.createElement("button"),
      results: document.createElement("div")
    });

    input.addEventListener("change", () => this.onInputChanged());

    keys(this.ux).forEach(className => {
      const item = this.ux[className];
      item.classList.add(className);
      this.dom.appendChild(item);
    });

    this.engine.on("", () => {});
  }

  public dispose(): void {
    super.dispose();
  }

  public on(topic: any, cb: any): RemoveEventHandler {
    return super.on(topic, cb);
  }

  private onInputChanged() {
    try {
      const searchText = this.ux.input.value;
      console.log("searching for: ", searchText);
      this.engine.search(searchText);
    } catch (ex) {
      this.publish("error", ex.message);
    }
  }

  public use(provider: AutoCompleteProviderContract<SearchResult>): void {
    this.engine.use(provider);
  }

  public search(value: string) {
    this.ux.input.value = value;
  }
}

export type ProviderContract = AutoCompleteProviderContract<SearchResult>;

export function createAutoCompleteWidget(providers: Array<ProviderContract>) {
  let widget = new AutoCompleteWidget();
  providers.forEach(provider => widget.use(provider));
  return widget as AutoCompleteWidgetContract;
}
