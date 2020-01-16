import { SearchResult } from "./SearchResult";
/**
 * Each search provider will perform a search on behalf of the widget
 * and report results back to the widget
 */
export interface AutoCompleteProviderContract<T extends SearchResult> {
  /**
   * Unique and friendly identifier for this provider
   */
  name: string;
  /**
   * Perform a search, streaming results back to the caller
   * @param searchValue value to pass to the search services
   */
  search(searchValue: string): Promise<T>;
}
