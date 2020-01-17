import { SearchResult } from "./SearchResult";
import { AutoCompleteProviderContract } from "./AutoCompleteProviderContract";
import { AutoCompleteWidgetContract } from "./AutoCompleteWidgetContract";
import { AutoCompleteWidget } from "./AutoCompleteWidget";
import { KeyboardWidgetExtension } from "./KeyboardWidgetExtension";

export type ProviderContract = AutoCompleteProviderContract<SearchResult>;

export function createAutoCompleteWidget(options: {
  providers: Array<ProviderContract>;
  delay: number;
}) {
  const { providers, delay, ...others } = options;
  const widget = new AutoCompleteWidget({ delay });
  options.providers.forEach(provider => widget.use(provider));
  widget.ext(new KeyboardWidgetExtension());

  return widget as AutoCompleteWidgetContract;
}
