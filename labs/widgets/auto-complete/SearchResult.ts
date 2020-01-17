import { SearchResultItem } from "./SearchResultItem";
export type SearchResult = {
  searchHash: string; // original search conditions
  items: Array<SearchResultItem>;
};
