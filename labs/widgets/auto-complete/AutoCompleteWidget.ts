import { keys } from "./keys";
import { RemoveEventHandler } from "./RemoveEventHandler";
import { SearchResult } from "./SearchResult";
import { AutoCompleteProviderContract } from "./AutoCompleteProviderContract";
import { Widget } from "./Widget";
import { AutoCompleteWidgetContract } from "./AutoCompleteWidgetContract";
import { AutoCompleteEngine } from "./AutoCompleteEngine";
import { SearchResultItem } from "./SearchResultItem";

const css = `
.widget.autocomplete {
  display: grid;
  grid-template-columns: auto 2em 2em;
  grid-template-areas:
    "input search cancel"
    "results results results";
}

.widget.autocomplete .results .result-list {
  display: grid;
  grid-template-columns: 2em auto;
  grid-template-areas:
    "marker data";
  max-height: 40vh;
  overflow: hidden;
}

.widget.autocomplete .input {
  grid-area: input;
}

.widget.autocomplete .search {
  grid-area: search;
}

.widget.autocomplete .cancel {
  grid-area: cancel;
}

.widget.autocomplete .results {
  grid-area: results;
}

`;

function injectCss(namespace: string, css: string) {
  if (document.head.querySelector(`style[id="${namespace}"]`))
    throw "css already exists";
  const style = document.createElement("style");
  style.id = name;
  style.innerText = css;
  document.head.appendChild(style);
}

injectCss("ags-lab", css);

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
    this.dom.classList.add("autocomplete");
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
      item.title = className;
      item.classList.add(className);
      this.dom.appendChild(item);
    });

    this.engine.on("success", (results: SearchResult) => {
      let asHtml = results.items.map(item => `<div>${item.key}</div>`).join("");
      this.ux.results.innerHTML = asHtml;
    });
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
