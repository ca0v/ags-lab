import { AutoCompleteWidget } from "./AutoCompleteWidget";
import { WidgetExtensionContract } from "./WidgetExtensionContract";
import { AutoCompleteWidgetContract } from "./AutoCompleteWidgetContract";
import { injectCss } from "./injectCss";

const animations = `
.widget.autocomplete .search-results {
    background: black;
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
        injectCss("ags-lab", animations);
        // inject css is really all that is necessary but knowning when a search is started
        // will help with animating the progress spinner
        widget.subscribe("startsearch", () => {
            widget.ux.cancel.querySelector("svg").classList.add("spin");
        });
        widget.subscribe("completesearch", () => {
            widget.ux.cancel.querySelector("svg").classList.remove("spin");
        });
    }
}
