import { AutoCompleteWidget } from "./AutoCompleteWidget";

function focus(
  element: Element & { focus?: Function },
  options?: { direction: "up" | "down" }
) {
  if (!element) return false;
  if (!element.focus) return false;
  element.focus();
  if (document.activeElement === element) return true;
  if (!options?.direction) return false;
  switch (options.direction) {
    case "down":
      return (
        focus(element.firstElementChild, options) ||
        focus(element.nextElementSibling, options)
      );
    default:
      return focus(element.previousElementSibling, options);
  }
}

export class KeyboardWidgetExtension {
  initialize(widget: AutoCompleteWidget) {
    const resultItemsKeyups = {
      Space: () => {
        widget.selectActiveElement();
      },
      Enter: () => {
        widget.selectActiveElement();
      },
      ArrowUp: () => {
        const { activeElement } = document;
        if (!focus(activeElement.previousElementSibling, { direction: "up" })) {
          if (focus(widget.ux.input)) {
            widget.ux.input.select();
          }
        }
      },
      ArrowDown: () => {
        let { activeElement } = document;
        focus(activeElement.nextElementSibling, { direction: "down" });
      }
    };
    widget.ux.results.addEventListener("keyup", event => {
      if (resultItemsKeyups[event.code]) {
        resultItemsKeyups[event.code](event);
        event.preventDefault();
        return;
      }
    });
    widget.ux.results.addEventListener("click", () => {
      widget.selectActiveElement();
    });
  }
}
