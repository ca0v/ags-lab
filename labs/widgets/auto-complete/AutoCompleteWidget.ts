import { keys } from "./keys";
import { RemoveEventHandler } from "./RemoveEventHandler";
import { SearchResult } from "./SearchResult";
import { AutoCompleteProviderContract } from "./AutoCompleteProviderContract";
import { Widget } from "./Widget";
import { AutoCompleteWidgetContract } from "./AutoCompleteWidgetContract";
import { AutoCompleteEngine } from "./AutoCompleteEngine";
export class AutoCompleteWidget extends Widget
  implements AutoCompleteWidgetContract {
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
    this.onInputChanged();
  }
}
