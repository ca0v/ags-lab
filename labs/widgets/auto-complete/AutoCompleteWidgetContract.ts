import { RemoveEventHandler } from "./RemoveEventHandler";
import { SearchResultItem } from "./SearchResultItem";
import { WidgetContract } from "./WidgetContract";
import { AutoCompleteProviderContract } from "./AutoCompleteProviderContract";
import { SearchResult } from "./SearchResult";
import { WidgetExtensionContract } from "./WidgetExtensionContract";

/**
 * This is the only interface outsiders see
 */
export interface AutoCompleteWidgetContract extends WidgetContract {
  use(provider: AutoCompleteProviderContract<SearchResult>): void;
  ext(extension: WidgetExtensionContract<WidgetContract>): void;
  /**
   * @param topic [blur|focus]result, [multi[un]]selectresult
   */
  subscribe(topic: "error", cb: (result: string) => void): RemoveEventHandler;
  subscribe(
    topic: "blurresult",
    cb: (result: SearchResultItem) => void
  ): RemoveEventHandler;
  subscribe(
    topic: "focusresult",
    cb: (result: SearchResultItem) => void
  ): RemoveEventHandler;
  subscribe(
    topic: "selectresult",
    cb: (result: SearchResultItem) => void
  ): RemoveEventHandler;
  subscribe(
    topic: "unselectresult",
    cb: (result: SearchResultItem) => void
  ): RemoveEventHandler;
  subscribe(
    topic: "multiselectresult",
    cb: (result: SearchResultItem[]) => void
  ): RemoveEventHandler;
  subscribe(
    topic: "multiunselectresult",
    cb: (result: SearchResultItem[]) => void
  ): RemoveEventHandler;
  search(value: string): void;
}
