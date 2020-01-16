import { RemoveEventHandler } from "./RemoveEventHandler";
import { SearchResult } from "./SearchResult";
import { AutoCompleteProviderContract } from "./AutoCompleteProviderContract";
/**
 * Controller logic between the widget and providers
 * to keep the UX keanly focused on layout and event handling
 */
export interface AutoCompleteEngineContract {
  dispose(): void;
  /**
   * Invoke a search for the given value
   * @param value search value
   */
  search(value: string): void;
  /**
   * Adds a search provider
   * @param provider provider to register with this widget
   */
  use(provider: AutoCompleteProviderContract<SearchResult>): void;
  on(topic: string, cb: (result: any) => void): RemoveEventHandler;
}
