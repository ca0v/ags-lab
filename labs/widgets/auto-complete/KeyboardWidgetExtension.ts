import { AutoCompleteWidget } from "./AutoCompleteWidget";

function debounce<T extends Function>(cb: T, wait = 20) {
    let h = 0;
    let callable = (...args: any) => {
        clearTimeout(h);
        h = setTimeout(() => cb(...args), wait);
    };
    return <T>(<any>callable);
}

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
                if (
                    !focus(activeElement.previousElementSibling, {
                        direction: "up"
                    })
                ) {
                    if (focus(widget.ux.input)) {
                        widget.ux.input.select();
                    }
                }
            },
            ArrowDown: () => {
                const { activeElement } = document;
                focus(activeElement.nextElementSibling, { direction: "down" });
            }
        };
        widget.ux.results.addEventListener("keydown", event => {
            if (resultItemsKeyups[event.code]) {
                resultItemsKeyups[event.code](event);
                event.preventDefault();
                return;
            }
        });
        widget.ux.results.addEventListener("click", event => {
            // if clicking a marker focus the input
            const path = event.composedPath();
            while (path.length) {
                const target = path.shift() as HTMLElement;
                if (!target) return;

                if (target.classList.contains("marker")) {
                    focus(target.nextElementSibling);
                    widget.selectActiveElement();
                    break;
                }
                if (target.classList.contains("data")) {
                    focus(target);
                    widget.selectActiveElement();
                    break;
                }
            }
        });

        const inputKeyups = {
            Enter: () => widget.ux.search.click(),
            ArrowDown: () =>
                focus(widget.ux.results.firstElementChild, {
                    direction: "down"
                })
        };

        let priorSearchValue = widget.ux.input.value.trim();
        const slowSearch = debounce(() => {
            const currentSearchValue = widget.ux.input.value.trim();
            if (currentSearchValue === priorSearchValue) return;
            widget.applyChanges();
            priorSearchValue = currentSearchValue;
        }, widget.options.delay);

        widget.ux.input.addEventListener("keyup", event => {
            if (inputKeyups[event.code]) {
                inputKeyups[event.code](event);
                event.preventDefault();
                return;
            }
            slowSearch();
        });
    }
}
