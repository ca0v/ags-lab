import { SearchResult } from "./SearchResult";
import { AutoCompleteProviderContract } from "./AutoCompleteProviderContract";
import { AutoCompleteWidgetContract } from "./AutoCompleteWidgetContract";
import { AutoCompleteWidget } from "./AutoCompleteWidget";

export type ProviderContract = AutoCompleteProviderContract<SearchResult>;

export function createAutoCompleteWidget(providers: Array<ProviderContract>) {
  let widget = new AutoCompleteWidget();
  providers.forEach(provider => widget.use(provider));
  return widget as AutoCompleteWidgetContract;
}
