import { ProviderContract } from "./index";
import { SearchResult } from "./SearchResult";
import { SearchResultItem } from "./SearchResultItem";

function randomInt(range = 1000) {
    return Math.floor(range * Math.random());
}

export class MockProvider implements ProviderContract {
    name: string;
    constructor(
        public options: {
            id: string;
            delay: number;
            maxResultCount: number;
            transform: (row: Partial<SearchResultItem>) => SearchResultItem;
            database: Array<SearchResultItem>;
        }
    ) {
        this.name = options.id;
        options.database.forEach(item => (item.key += options.id));
    }

    search(searchValue: string): Promise<SearchResult> {
        console.log(`${this.options.id} searching for: ${searchValue}`);
        return new Promise((good, bad) => {
            setTimeout(() => {
                if (0.01 > Math.random()) bad("Unlucky");
                else {
                    const items = this.options.database.filter(
                        v => 0 <= v.address.indexOf(searchValue)
                    );
                    console.log(
                        `${this.options.id} found ${items.length} items`
                    );
                    const { maxResultCount } = this.options;
                    if (items.length > maxResultCount) {
                        items.splice(
                            maxResultCount,
                            items.length - maxResultCount
                        );
                    }
                    good({
                        provider_id: this.name,
                        searchHash: searchValue,
                        items: items.map(item => this.options.transform(item))
                    });
                }
            }, this.options.delay / 2 + randomInt(this.options.delay / 2));
        });
    }
}
