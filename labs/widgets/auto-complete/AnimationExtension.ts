import { AutoCompleteWidget } from "./AutoCompleteWidget";
import { WidgetExtensionContract } from "./WidgetExtensionContract";
import { AutoCompleteWidgetContract } from "./AutoCompleteWidgetContract";
import { injectCss } from "./injectCss";
import { SearchResult } from "./SearchResult";
import { Dictionary } from "./Dictionary";

const DELETION_DELAY = 200;

const enhancements = `
.widget.autocomplete .results div {
    cursor: pointer;
}
`;

const animations = `
.widget.autocomplete .results div {
    transform: translate(0em, 0em);
    opacity: 1;
    transition: all ${DELETION_DELAY}ms linear;
}

.widget.autocomplete .results div.loading {
    transform: translate(-10em, 0em);
    opacity: 0.5;
}

.widget.autocomplete .results div.pending {
    transform: translate(-10em, 0em);
    opacity: 0;
}

.widget.autocomplete .spin {
  animation: spin var(--spin-rate) 200ms infinite linear;
}

@keyframes spin {
  from {transform:rotate(0deg);}
  to {transform:rotate(360deg);}
}
`;

export class AnimationExtension
    implements WidgetExtensionContract<AutoCompleteWidgetContract> {
    initialize(widget: AutoCompleteWidget): void {
        const markAsLoading = (selector: string) => {
            const nodes = Array.from(
                widget.ux.results.querySelectorAll(selector)
            ) as HTMLElement[];
            nodes.forEach(n => n.classList.add("loading"));
            setTimeout(() => {
                nodes.forEach(n => {
                    n.classList.remove("loading");
                    //n.classList.add("loaded");
                });
            }, DELETION_DELAY);
        };

        const markAsUnloading = (selector: string) => {
            const nodes = Array.from(
                widget.ux.results.querySelectorAll(selector)
            ) as HTMLElement[];
            nodes.forEach(n => n.classList.add("pending"));
            setTimeout(() => {
                nodes
                    .filter(n => n.classList.contains("pending"))
                    .forEach(n => n.remove());
            }, DELETION_DELAY);
        };

        injectCss("ags-lab", enhancements);
        injectCss("ags-lab", animations);

        const providers = <Dictionary<SearchResult>>{};

        widget.subscribe("start-search", () => {
            Object.keys(providers).forEach(id => markAsUnloading(`.${id}`));
            widget.ux.cancel.querySelector("svg").classList.add("spin");
        });

        widget.subscribe("complete-search", () => {
            widget.ux.cancel.querySelector("svg").classList.remove("spin");
        });

        widget.subscribe("success-search", (results: SearchResult) => {
            providers[results.provider_id] = results;
            markAsLoading(`.${results.provider_id}`);
        });
    }
}
