import { SearchResultItem } from "./SearchResultItem";
export type SearchResult = {
    provider_id: string; // identifies the search provider
    searchHash: string; // original search conditions
    items: Array<SearchResultItem>;
};
