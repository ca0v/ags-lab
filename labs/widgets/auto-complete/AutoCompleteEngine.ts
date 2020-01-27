import { SearchResult } from "./typings/SearchResult";
import { AutoCompleteProviderContract } from "./typings/AutoCompleteProviderContract";
import { AutoCompleteEngineContract } from "./typings/AutoCompleteEngineContract";
import { Channel } from "./Channel";
import { SearchResultItem } from "./typings/SearchResultItem";
/**
 * Generic auto-complete
 */
export class AutoCompleteEngine implements AutoCompleteEngineContract {
  private channel = new Channel();
  private providers: Array<AutoCompleteProviderContract<SearchResult>> = [];
  dispose() {
    this.channel.dispose();
  }
  subscribe(topic: string, cb: (result: any) => void) {
    return this.channel.on(topic, cb);
  }
  private onError(message: string) {
    console.log("error", message);
    this.channel.publish("error", message);
  }
  private onSuccess(result: SearchResult) {
    console.log("success", result);
    this.channel.publish("success", result);
  }

  /**
   * Invoke search on all providers
   * @param value search value
   */
  search(value: string): void {
    this.channel.publish("start");
    const results = this.providers.map(provider => provider.search(value));
    Promise.all(results)
      .catch(err => {
        this.channel.publish("error", err);
        this.channel.publish("complete");
      })
      .then(() => this.channel.publish("complete"));

    results.forEach(result => {
      result
        .catch(reason => {
          this.onError(reason);
        })
        .then(result => {
          if (!result) throw "response expected";
          this.onSuccess(result);
        });
    });
  }

  async locate(value: SearchResultItem) {
    this.channel.publish("start");
    const provider = this.providers.find(p => p.name === value.provider_id);
    return provider.search(value);
  }

  async use(provider: AutoCompleteProviderContract<SearchResult>) {
    this.providers.push(provider);
  }
}
