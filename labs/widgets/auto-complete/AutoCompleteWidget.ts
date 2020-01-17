import { keys } from "./keys";
import { SearchResult } from "./SearchResult";
import { AutoCompleteProviderContract } from "./AutoCompleteProviderContract";
import { Widget } from "./Widget";
import { AutoCompleteWidgetContract } from "./AutoCompleteWidgetContract";
import { AutoCompleteEngine } from "./AutoCompleteEngine";

const css = `
.widget.autocomplete {
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
}

.widget.autocomplete .results .result-list {
  display: grid;
  grid-template-columns: 2em auto;
  grid-template-areas:
    "marker data";
}

.widget.autocomplete .results .result-list .marker {
  grid-area: "marker";
}

.widget.autocomplete .results .result-list .data {
  grid-area: "data";
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
      const asHtml = results.items
        .map(
          item =>
            `<div class="marker">${
              item.key
            }</div><div class="data" data-d='${JSON.stringify(item)}'>${
              item.address
            }</div>`
        )
        .join("");

      this.ux.results.innerHTML = `<div class="result-list">${asHtml}</div>`;
      const resultNodes = Array.from(this.ux.results.children) as HTMLElement[];
      resultNodes.forEach(child => {
        child.tabIndex = 0;

        child.addEventListener("focus", () => {
          this.onResultFocused();
        });
      });
    });
  }

  private onResultFocused() {
    const result = document.activeElement as HTMLElement;
    if (this.ux.results !== result.parentElement) return;
    this.publish("focusresult", JSON.parse(result.dataset.d));
  }

  private onResultSelected() {
    const result = document.activeElement as HTMLElement;
    if (this.ux.results !== result.parentElement) return;
    this.publish("selectresult", JSON.parse(result.dataset.d));
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
      const searchText = this.ux.input.value;
      console.log("searching for: ", searchText);
      this.engine.search(searchText);
    } catch (ex) {
      this.publish("error", ex.message);
    }
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
