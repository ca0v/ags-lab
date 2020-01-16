import { SearchResult } from "./SearchResult";
import { AutoCompleteProviderContract } from "./AutoCompleteProviderContract";
import { AutoCompleteWidgetContract } from "./AutoCompleteWidgetContract";
import { AutoCompleteWidget } from "./AutoCompleteWidget";
import { KeyboardWidgetExtension } from "./KeyboardWidgetExtension";

export type ProviderContract = AutoCompleteProviderContract<SearchResult>;

export function createAutoCompleteWidget(providers: Array<ProviderContract>) {
  const widget = new AutoCompleteWidget();
  providers.forEach(provider => widget.use(provider));
  widget.ext(new KeyboardWidgetExtension());

  return widget as AutoCompleteWidgetContract;
}
