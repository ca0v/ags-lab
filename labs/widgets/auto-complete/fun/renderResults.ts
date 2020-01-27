import { SearchResult } from "../typings/SearchResult";
import { AutoCompleteWidget } from "../AutoCompleteWidget";
import { SearchResultTypes } from "../typings/SearchResultItem";

function asDom(html: string) {
    const div = document.createElement("div");
    div.innerHTML = html.trim();
    return div.firstChild as HTMLElement;
}

function appendAll(target: HTMLElement, source: HTMLElement) {
    while (source.firstChild) target.appendChild(source.firstChild);
}

function prependAll(target: HTMLElement, source: HTMLElement) {
    while (source.lastChild)
        target.insertBefore(source.lastChild, target.firstChild);
}

export function renderResults(
    widget: AutoCompleteWidget,
    results: SearchResult
) {
    // to be read from configuration
    const getMarkerMarkup = (markerType: SearchResultTypes) => {
        const createMarker = (className: string) => {
            return `<svg class="${className}" style="width:1em;height:1em" viewBox="-10 -12 20 24"><use href="#icon-marker"></use></svg>`;
        };
        return createMarker((markerType && markerType[0]) || "unknown");
    };

    const asHtml = results.items
        .map(
            item =>
                `<div class="marker ${results.provider_id}" title="${
                    item.address_type
                }">${getMarkerMarkup(
                    item.address_type
                )}</div><div class="data ${
                    results.provider_id
                }" data-d='${JSON.stringify(item)}'>${item.address}</div>`
        )
        .join("");

    // add to result grid
    prependAll(widget.ux.results, asDom(`<div>${asHtml.trim()}</div>`));

    const resultNodes = Array.from(
        widget.ux.results.querySelectorAll(".data")
    ) as HTMLElement[];
    resultNodes.forEach(child => {
        child.tabIndex = 0;
        child.addEventListener("focus", () => {
            const result = document.activeElement as HTMLElement;
            if (widget.ux.results !== result.parentElement) return;
            widget.publish("focusresult", JSON.parse(result.dataset.d));
        });
    });
}
