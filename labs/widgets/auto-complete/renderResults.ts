import { SearchResult } from "./SearchResult";
import { AutoCompleteWidget } from "./AutoCompleteWidget";

function asDom(html: string) {
  let div = document.createElement("div");
  div.innerHTML = html.trim();
  return div.firstChild as HTMLElement;
}

function appendAll(target: HTMLElement, source: HTMLElement) {
  while (source.firstChild) target.appendChild(source.firstChild);
}

export function renderResults(
  widget: AutoCompleteWidget,
  results: SearchResult
) {
  const asHtml = results.items
    .map(
      item =>
        `<div class="marker">*</div><div class="data" data-d='${JSON.stringify(
          item
        )}'>${item.address}</div>`
    )
    .join("");

  // add to result grid
  appendAll(widget.ux.results, asDom(`<div>${asHtml.trim()}</div>`));

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
