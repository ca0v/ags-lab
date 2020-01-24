import { SearchResult } from "./SearchResult";
import { AutoCompleteProviderContract } from "./AutoCompleteProviderContract";
import { AutoCompleteWidgetContract } from "./AutoCompleteWidgetContract";
import { AnimationExtension } from "./AnimationExtension";
import { AutoCompleteWidget } from "./AutoCompleteWidget";
import { KeyboardWidgetExtension } from "./KeyboardWidgetExtension";

export type ProviderContract = AutoCompleteProviderContract<SearchResult>;

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

  return widget as AutoCompleteWidgetContract;
}
