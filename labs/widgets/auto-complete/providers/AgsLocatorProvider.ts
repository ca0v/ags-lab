import { ProviderContract } from "../index";
import { SearchResult } from "../typings/SearchResult";
import { SearchResultItem } from "../typings/SearchResultItem";
import { Geometry } from "../typings/Geometry";
import { Dictionary } from "../typings/Dictionary";

// https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?f=json&text=greenville&maxSuggestions=6&location=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%2C%22x%22%3A-10797990.606947355%2C%22y%22%3A4579425.812870008%7D
export class AgsLocatorProvider implements ProviderContract {
    name: string;
    constructor() {
        this.name = "AgsLocatorProvider";
    }

    private mapResponseData(data: { suggestions: Array<{ text: string; magicKey: string; isCollection: boolean; }> }): SearchResult {
        const items = data.suggestions.map(responseItem => (<SearchResultItem>{
            ...responseItem,
            address: responseItem.text,
            key: responseItem.magicKey,
            location: null,
            address_type: ["address"],
        }));
        return {
            provider_id: this.name,
            searchHash: "",
            items
        };
    }

    private mapFindAddressCandidatesResponseData(data: {
        candidates: Array<{
            address: string;
            location: Geometry;
            score: number;
            attributes: Dictionary<string | number>;
        }>
    }): SearchResult {
        const items = data.candidates.map(responseItem => (<SearchResultItem>{
            ...responseItem,
            address: responseItem.address,
            key: responseItem.address,
            location: responseItem.location,
            address_type: ["address"],
        }));
        return {
            provider_id: this.name,
            searchHash: "",
            items
        };
    }

    search(clue: SearchResultItem): Promise<SearchResult>;
    search(searchValue: string): Promise<SearchResult>
    async search(searchValue: any): Promise<SearchResult> {
        if (typeof searchValue !== "string") return this.locate(searchValue as SearchResultItem);
        const fetchResponse = await fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?f=json&text=${searchValue}`);
        const responseData = await fetchResponse.json();
        const response = this.mapResponseData(responseData);
        response.searchHash = searchValue;
        return response;
    }

    private async locate(item: SearchResultItem): Promise<SearchResult> {
        const fetchResponse = await fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=${item.address}&f=json&maxLocations=6`);
        const responseData = await fetchResponse.json();
        const response = this.mapFindAddressCandidatesResponseData(responseData);
        response.searchHash = item.key.toUpperCase();
        return response;
    }

}