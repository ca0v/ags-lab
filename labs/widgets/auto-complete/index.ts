import { SearchResult } from "./typings/SearchResult";
import { AutoCompleteProviderContract } from "./typings/AutoCompleteProviderContract";
import { AutoCompleteWidgetContract } from "./typings/AutoCompleteWidgetContract";
import { AnimationExtension } from "./extensions/AnimationExtension";
import { AutoCompleteWidget } from "./AutoCompleteWidget";
import { KeyboardWidgetExtension } from "./extensions/KeyboardWidgetExtension";
import { SearchResultItem } from "./typings/SearchResultItem";

export type ProviderContract = AutoCompleteProviderContract<SearchResult>;

class FlowExtension {
  private results: Array<SearchResultItem> = [];
  initialize(widget: AutoCompleteWidget) {
    widget.subscribe("start-search", () => {
      this.results = [];
    });
    widget.subscribe("complete-search", () => {
      // if exactly one result and it has a location then
      // closed the widget
      if (1 === this.results.length) {
        if (this.results[0].location) {
          console.log(`using ${JSON.stringify(this.results[0])}`);
          widget.dispose();
        }
      }
    });
    widget.subscribe("update-search-result", (results) => {
      this.results = this.results.concat(results.items);
    });

  }
}

export function createAutoCompleteWidget(options: {
  providers: Array<ProviderContract>;
  delay: number;
}) {
  const { providers, delay, ...others } = options;
  const widget = new AutoCompleteWidget({
    delay,
    titles: {
      input: "Enter Search Text",
      cancel: "Dismiss Search",
      search: "Perform Search",
      results: "Select Search Text"
    }
  });
  options.providers.forEach(provider => widget.use(provider));
  widget.ext(new KeyboardWidgetExtension());
  widget.ext(new AnimationExtension());
  widget.ext(new FlowExtension());

  return widget as AutoCompleteWidgetContract;
}
