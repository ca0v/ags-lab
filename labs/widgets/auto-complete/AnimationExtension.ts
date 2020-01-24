import { AutoCompleteWidget } from "./AutoCompleteWidget";
import { WidgetExtensionContract } from "./WidgetExtensionContract";
import { AutoCompleteWidgetContract } from "./AutoCompleteWidgetContract";
export class AnimationExtension
  implements WidgetExtensionContract<AutoCompleteWidgetContract> {
  initialize(widget: AutoCompleteWidget): void {
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
