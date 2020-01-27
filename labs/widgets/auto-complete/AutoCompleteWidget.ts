import { keys } from "./fun/keys";
import { SearchResult } from "./typings/SearchResult";
import { AutoCompleteProviderContract } from "./typings/AutoCompleteProviderContract";
import { WidgetBase } from "./WidgetBase";
import { AutoCompleteWidgetContract } from "./typings/AutoCompleteWidgetContract";
import { WidgetExtensionContract } from "./typings/WidgetExtensionContract";
import { AutoCompleteEngine } from "./AutoCompleteEngine";
import { renderResults as updateResults } from "./fun/renderResults";
import { injectCss } from "./fun/injectCss";
import { injectSvg } from "./fun/injectSvg";
import { SearchResultItem } from "./typings/SearchResultItem";

const svg = `
<svg style="display:none" viewBox="-10 -10 20 20">
  <defs>
    <g id="icon-marker">
      <path transform="scale(1) translate(-6, -10)"
      d=" M 6.3 0
          C 6.3 0
            0 0.1
            0 7.5
          c 0 3.8
            6.3 12.6
            6.3 12.6
          s 6.3 -8.8
            6.3 -12.7
          C 12.6 0.1
            6.3 0
            6.3 0
          z"></path>
    </g>
    <g id="progress-spinner">
      <circle class="track" cx="0" cy="0" r="5" fill="none" stroke-width="2" />
      <circle class="ball" cx="0" cy="-5" r="1" fill="#000000" stroke="#ffffff" stroke-width="0.1" />
      <circle class="ball" cx="0" cy="5" r="1" fill="#ffffff" stroke="#000000" stroke-width="0.1" />
    </g>
    <g id="icon-search" viewBox="0 0 18 18" transform="scale(0.95) translate(0,2)">
      <path d="M17.707 16.293l-5.108-5.109A6.954 6.954 0 0014 7c0-3.86-3.141-7-7-7S0 3.14 0 7s3.141 7 7 7a6.958 6.958 0 004.185-1.402l5.108 5.109a.997.997 0 001.414 0 .999.999 0 000-1.414zM7 12c-2.757 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5z"
      fill-rule="nonzero" stroke="none"></path>
    </g>
    <g id="icon-close" viewBox="0 0 18 18">
      <path
        d="M10.414 9l5.293-5.293a.999.999 0 10-1.414-1.414L9 7.586 3.707 2.293a.999.999 0 10-1.414 1.414L7.586 9l-5.293 5.293a.999.999 0 101.414 1.414L9 10.414l5.293 5.293a.997.997 0 001.414 0 .999.999 0 000-1.414L10.414 9"
        fill-rule="evenodd" stroke="none"></path>
    </g>
  </defs>
</svg>
`;

const css = `
.widget.autocomplete {
  max-width: 24em;
  display: grid;
  grid-template-columns: auto 2em 2em;
  grid-template-rows: 2em 0.5em auto;
  grid-template-areas:
    "input search cancel"
    "gap gap gap"
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
  fill: red;
  stroke: black;
}

.widget.autocomplete .results .data {
  max-height: 40vh;
}
`;

export class AutoCompleteWidget extends WidgetBase
  implements AutoCompleteWidgetContract {
  dom: HTMLElement;
  private engine: AutoCompleteEngine;
  private priorSearchText: string | null;
  public ux: {
    input: HTMLInputElement;
    cancel: HTMLButtonElement;
    search: HTMLButtonElement;
    results: HTMLDivElement;
  };

  public constructor(
    public options: {
      delay: number;
      titles: {
        input: string;
        search: string;
        cancel: string;
        results: string;
      };
    }
  ) {
    super();
    injectCss("ags-lab", css);
    injectSvg("ags-lab", svg);

    this.dom.classList.add("autocomplete");
    this.engine = new AutoCompleteEngine();

    const { input, cancel, search, results } = (this.ux = {
      input: document.createElement("input"),
      cancel: document.createElement("button"),
      search: document.createElement("button"),
      results: document.createElement("div")
    });
    input.addEventListener("change", () => this.onInputChanged());
    search.addEventListener("click", () => this.onSearch());

    setBackground(this.ux.search, "icon-search");
    setBackground(this.ux.cancel, "icon-close");

    keys(this.ux).forEach(className => {
      const item = this.ux[className];
      item.title = options.titles[className] || className;
      item.classList.add(className);
      this.dom.appendChild(item);
    });

    this.engine.on("start", () => {
      this.publish("start-search");
    });

    this.engine.on("complete", () => {
      this.publish("complete-search");
    });

    this.engine.on("success", (results: SearchResult) => {
      this.publish("receive-search-result", results);
      // only render results if the input hash matches the results hash
      if (this.getSearchHash() !== results.searchHash) return;
      updateResults(this, results);
      this.publish("update-search-result", results);
    });
  }

  /**
   * Notify that user selected a result item
   */
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

  /**
   * User clicked "search" button, perform a location query
   */
  private onSearch() {
    try {
      const searchText = this.getSearchHash();
      if (searchText === this.priorSearchText) return;
      this.engine.search(searchText);
      this.priorSearchText = searchText;
    } catch (ex) {
      this.publish("error", ex.message);
    }
  }

  private onInputChanged() {
    try {
      const searchText = this.getSearchHash();
      if (searchText === this.priorSearchText) return;
      this.engine.search(searchText);
      this.priorSearchText = searchText;
    } catch (ex) {
      this.publish("error", ex.message);
    }
  }

  public ext(extension: WidgetExtensionContract<AutoCompleteWidget>): void {
    extension.initialize(this);
  }

  public use(provider: AutoCompleteProviderContract<SearchResult>): void {
    this.engine.use(provider);
  }

  /**
   * Update the search text
   * @param value Value to assign to the search area
   */
  public search(value: string) {
    this.ux.input.value = value;
    this.onInputChanged();
  }

  public locate(value: SearchResultItem) {
    // responses are associated with requests through a hash of the input value
    this.ux.input.value = value.key;
    this.engine.search(value);
  }
}

function asDom(html: string) {
  let div = document.createElement("div");
  div.innerHTML = html.trim();
  return div.firstChild as HTMLElement;
}

function setBackground(button: HTMLButtonElement, id: string) {
  button.appendChild(
    asDom(`<svg viewBox="0 0 18 18"><use href="#${id}"></use></svg>`)
  );
}
