import { RemoveEventHandler } from "./RemoveEventHandler";
import { SearchResultItem } from "./SearchResultItem";
import { WidgetContract } from "./WidgetContract";
/**
 * This is the only interface outsiders see
 */
export interface AutoCompleteWidgetContract extends WidgetContract {
  /**
   * @param topic [blur|focus]result, [multi[un]]selectresult
   */
  on(topic: "error", cb: (result: string) => void);
  on(
    topic: "blurresult",
    cb: (result: SearchResultItem) => void
  ): RemoveEventHandler;
  on(
    topic: "focusresult",
    cb: (result: SearchResultItem) => void
  ): RemoveEventHandler;
  on(
    topic: "selectresult",
    cb: (result: SearchResultItem) => void
  ): RemoveEventHandler;
  on(
    topic: "unselectresult",
    cb: (result: SearchResultItem) => void
  ): RemoveEventHandler;
  on(
    topic: "multiselectresult",
    cb: (result: SearchResultItem[]) => void
  ): RemoveEventHandler;
  on(
    topic: "multiunselectresult",
    cb: (result: SearchResultItem[]) => void
  ): RemoveEventHandler;
  search(value: string): void;
}
