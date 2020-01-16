import { SearchResult } from "./SearchResult";
import { AutoCompleteProviderContract } from "./AutoCompleteProviderContract";
import { AutoCompleteEngineContract } from "./AutoCompleteEngineContract";
import { Channel } from "./Channel";
/**
 * Generic auto-complete
 */
export class AutoCompleteEngine implements AutoCompleteEngineContract {
  private channel = new Channel();
  private providers: Array<AutoCompleteProviderContract<SearchResult>> = [];
  dispose() {
    this.channel.dispose();
  }
  on(topic: string, cb: (result: any) => void) {
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
  search(value: string): void {
    const results = this.providers.map(provider => provider.search(value));

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
  async use(provider: AutoCompleteProviderContract<SearchResult>) {
    this.providers.push(provider);
  }
}
