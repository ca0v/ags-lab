import { keys } from "./keys";
import { SearchResult } from "./SearchResult";
import { AutoCompleteProviderContract } from "./AutoCompleteProviderContract";
import { Widget } from "./Widget";
import { AutoCompleteWidgetContract } from "./AutoCompleteWidgetContract";
import { AutoCompleteEngine } from "./AutoCompleteEngine";
import { renderResults } from "./renderResults";

const css = `
.widget.autocomplete {
  max-width: 24em;
  display: grid;
  grid-template-columns: auto 2em 2em;
  grid-template-areas:
    "input search cancel"
    "results results results";
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
  max-height: 20em;
  overflow: hidden;
}

.widget.autocomplete .results {
  display: grid;
  grid-template-columns: 2em auto;
  grid-template-areas:
    "marker data";
}

.widget.autocomplete .results .marker {
}

.widget.autocomplete .results .data {
  max-height: 40vh;
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
  public ux: {
    input: HTMLInputElement;
    cancel: HTMLButtonElement;
    search: HTMLButtonElement;
    results: HTMLDivElement;
  };

  public constructor(public options: { delay: number }) {
    super();
    this.dom.classList.add("autocomplete");
    this.engine = new AutoCompleteEngine();

    const { input, cancel, search, results } = (this.ux = {
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
      // only render results if the input hash matches the results hash
      if (this.getSearchHash() !== results.searchHash) return;
      renderResults(this, results);
    });
  }

  private onResultSelected() {
    const result = document.activeElement as HTMLElement;
    if (this.ux.results !== result.parentElement) return;
    this.publish("selectresult", JSON.parse(result.dataset.d));
  }

  private getSearchHash() {
    return this.ux.input.value.trim().toUpperCase();
  }

  /**
   * widget extension
   */
  public selectActiveElement() {
    this.onResultSelected();
  }

  public applyChanges() {
    this.onInputChanged();
  }

  private onInputChanged() {
    try {
      const searchText = this.getSearchHash();
      this.clearSearchResults();
      this.engine.search(searchText);
    } catch (ex) {
      this.publish("error", ex.message);
    }
  }

  private clearSearchResults() {
    this.ux.results.innerHTML = "";
  }

  public ext(extension: { initialize(widget: AutoCompleteWidget) }) {
    extension.initialize(this);
  }

  public use(provider: AutoCompleteProviderContract<SearchResult>): void {
    this.engine.use(provider);
  }

  public search(value: string) {
    this.ux.input.value = value;
    this.onInputChanged();
  }
}
