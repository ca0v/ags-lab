import { AutoCompleteWidget } from "../AutoCompleteWidget";
import { WidgetExtensionContract } from "../typings/WidgetExtensionContract";
import { AutoCompleteWidgetContract } from "../typings/AutoCompleteWidgetContract";
import { injectCss } from "../fun/injectCss";
import { SearchResult } from "../typings/SearchResult";
import { Dictionary } from "../typings/Dictionary";

const DELETION_DELAY = 100 + Math.random() * 200;

const enhancements = `
.widget.autocomplete .results div {
    cursor: pointer;
}
`;

const animations = `
.widget.autocomplete .results div {
    transform: translate(0em, 0em);
    opacity: 1;
}

.widget.autocomplete .results div.loading {
    transform: translate(-10em, 0em);
    opacity: 0;
    transition: all ${DELETION_DELAY}ms linear;
}

.widget.autocomplete .results div.loading.loaded {
    transform: translate(0em, 0em);
    opacity: 1;
}

.widget.autocomplete .results div.loading.loaded.unloading {
    opacity: 0.5;
}

.widget.autocomplete .results div.loading.loaded.unloading.unloaded {
    opacity: 0;
    transform: translate(10em, 0em);
}

.widget.autocomplete .spin {
  animation: spin var(--spin-rate) 200ms infinite linear;
}

@keyframes spin {
  from {transform:rotate(0deg);}
  to {transform:rotate(360deg);}
}
`;

injectCss("ags-lab", enhancements);
injectCss("ags-lab", animations);

export class AnimationExtension
    implements WidgetExtensionContract<AutoCompleteWidgetContract> {
    initialize(widget: AutoCompleteWidget): void {
        const markAs = (selector: string, mark: string) => {
            const nodes = Array.from(
                widget.ux.results.querySelectorAll(selector)
            ) as HTMLElement[];
            nodes.forEach(n => n.classList.add(mark));
            return nodes;
        };

        const unload = (providerId: string) => {
            const nodes = Array.from(
                widget.ux.results.querySelectorAll(`.unloading.${providerId}`)
            ) as HTMLElement[];
            nodes.forEach(n => n.classList.add("unloaded"));
            setTimeout(() => nodes.forEach(n => n.remove()), DELETION_DELAY);
        };

        const providers = <Dictionary<SearchResult>>{};

        widget.subscribe("start-search", () => {
            Object.keys(providers).forEach(id => markAs(`.${id}`, "unloading"));
            widget.ux.cancel.querySelector("svg").classList.add("spin");
        });

        widget.subscribe("complete-search", () => {
            widget.ux.cancel.querySelector("svg").classList.remove("spin");
        });

        widget.subscribe("receive-search-result", (results: SearchResult) => {
            providers[results.provider_id] = results;
            unload(results.provider_id);
        });

        widget.subscribe("update-search-result", (results: SearchResult) => {
            markAs(`.${results.provider_id}`, "loading");
            setTimeout(() => markAs(`.${results.provider_id}`, "loaded"), 20);
        });
    }
}
