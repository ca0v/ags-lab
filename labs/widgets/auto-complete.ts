import debounce = require("dojo/debounce");
import mockSuggestResponse = require("../data/suggest_response");

const MIN_SEARCH_LENGTH = 1;

interface Dictionary<T> {
  [n: string]: T;
}

type Suggestion = { text: string; magicKey: string };

function focus(element: Element & { focus?: Function }, options?: { direction: "up" | "down" }) {
  if (!element) return false;
  if (!element.focus) return false;
  element.focus();
  if (document.activeElement === element) return true;
  if (!options?.direction) return false;
  switch (options.direction) {
    case "down":
      return focus(element.firstElementChild, options) || focus(element.nextElementSibling, options);
    default:
      return focus(element.previousElementSibling, options);
  }
}

function click(element: Element & { click?: Function }) {
  if (element?.click) element.click();
}

/**
 * As user types a message invoke multiple "suggest" requests...as response comes
 * in add it to a auto-complete list
 * If user makes a selection invoke a findAddressCandidates request using magic-key
 * If user presses enter, invoke a findAddressCandidates request using input value
 */

let styles = document.createElement("style");
styles.innerText = `
    :root {
      --border-color: rgba(200,200,200,1);
      --reveal-time: 200ms;
      --spin-rate: 2500ms;
      --address-layer-color: red;
      --parcel-layer-color: green;
      --geolocator-color: blue;
    }

    .mock-auto-complete {
      display: inline-block;
      border: 1px solid;
      border-color: var(--border-color);
      padding: 0.25em;
      min-width: max(16em,25vw);
      max-width: min(32em,50vw);
    }

    .mock-auto-complete .search-area {
      display: grid;
      grid-template-columns: auto 2em 2em;
      grid-template-areas:
        "search cancel run"
        "results results results";
    }

    .mock-auto-complete .search-area .search {
      grid-area: search;
    }

    .mock-auto-complete .search-area .run {
      grid-area: run;
    }

    .mock-auto-complete .search-area .cancel {
      grid-area: cancel;
    }

    .mock-auto-complete .result-area {
      grid-area: results;
    }

    .mock-auto-complete .result-area .result-list {
      display: grid;
      grid-template-columns: auto;
      max-height: 40vh;
      overflow: hidden;
    }

    .mock-auto-complete .result-area .result-list .provider {
      height: 5vh;
    }

    .mock-auto-complete .result-list .result-item {
      cursor: pointer;
      padding: 0.5em;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: wrap;
      border-left: 1px solid transparent;
      animation: reveal var(--reveal-time) forwards linear;
    }

    .mock-auto-complete .result-list .provider label {
      padding-left: 0.5em;
    }

    .mock-auto-complete .result-list .provider .spinner {
      width: 2em;
      height: 2em;
      display: inline-block;
      transform: translate(-4px, 8px);
    }

    .mock-auto-complete .result-list .provider .spinner .spin {
      animation: spin var(--spin-rate) 200ms infinite linear;
    }

    .mock-auto-complete .result-list .provider .spinner .marker {
      animation: as-indicator var(--reveal-time) 0ms forwards linear;
    }

    .mock-auto-complete .result-list .provider .spinner .marker use circle.ball {
      fill: none;
    }

    .mock-auto-complete .result-list .result-item .marker {
      width: 2em;
      height: 2em;
      stroke: var(--border-color);
      stroke-width: 2;
      transform: translate(-8px, 0);
      opacity: 0.8;
    }

    .mock-auto-complete .result-list .result-item:focus .marker,
    .mock-auto-complete .result-list .result-item:hover .marker {
      stroke: white;
      transition: stroke,opacity 100ms ease-in;
      opacity: 1;
    }

    .mock-auto-complete .result-list .provider.Addresses .spinner use {
      stroke: var(--geolocator-color);
    }

    .mock-auto-complete .result-list .result-item .marker.Addresses {
        fill: var(--geolocator-color);
    }

    .mock-auto-complete .result-list .provider.ParcelLayer .spinner use {
      stroke: var(--parcel-layer-color);
    }

    .mock-auto-complete .result-list .result-item .marker.ParcelLayer {
      fill: var(--parcel-layer-color);
    }

    .mock-auto-complete .result-list .provider.AddressLayer .spinner use {
      stroke: var(--address-layer-color);
    }

    .mock-auto-complete .result-list .result-item .marker.AddressLayer {
      fill: var(--address-layer-color);
    }

    .mock-auto-complete .result-list .provider .spinner.fade-out {
      animation: unreveal var(--reveal-time) forwards linear;
    }

    .workarea {
      position:absolute;
      width: 0;
      height: 0;
      transform: translate(50vh, 3em) scale(5);
    }

    .workarea .spin {
      width: 2em;
      height: 2em;
      animation: workarea-spin var(--spin-rate) infinite linear;
    }

    .workarea .spin use {
      fill: black;
      stroke: white;
    }

    @keyframes workarea-spin {
      0% {transform:rotate(0deg)}
      100% {transform:rotate(360deg)}
    }

    @keyframes reveal {
      from {opacity:0;}
      to {opacity:auto;}
    }

    @keyframes unreveal {
      from {opacity:auto;}
      to {opacity:0;}
    }

    @keyframes as-indicator {
      to {
        transform: translate(-4px, 8px) scale(0);
      }
    }

    @keyframes spin {
      from {transform:rotate(0deg);}
      to {transform:rotate(360deg);}
    }

`;
document.head.appendChild(styles);

function asDom(html: string) {
  let div = document.createElement("div");
  div.innerHTML = html.trim();
  return div.firstChild as HTMLElement;
}

function asId(value: string) {
  return value.replace(/ /gi, "");
}

export async function run() {
  const autoCompleteInput = `
<div class="mock-auto-complete">
  <svg style="display:none" viewBox="-10 -10 20 20">
  <defs>
    <g id="marker-icon">
      <circle cx="0" cy="0" r="5" />
    </g>
    <g id="progress-spinner">
      <circle class="track" cx="0" cy="0" r="5" stroke-width="1" />
      <circle class="ball" cx="0" cy="-5" r="1" fill="#000000" stroke="#ffffff" stroke-width="0.1" />
      <circle class="ball" cx="0" cy="5" r="1" fill="#ffffff" stroke="#000000" stroke-width="0.1" />
    </g>
    <g id="icon-search" viewBox="0 0 18 18">
      <path d="M17.707 16.293l-5.108-5.109A6.954 6.954 0 0014 7c0-3.86-3.141-7-7-7S0 3.14 0 7s3.141 7 7 7a6.958 6.958 0 004.185-1.402l5.108 5.109a.997.997 0 001.414 0 .999.999 0 000-1.414zM7 12c-2.757 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5z"
      fill="currentColor" fill-rule="nonzero" stroke="none"></path>
    </g>
    <g id="icon-close" viewBox="0 0 18 18">
      <path
        d="M10.414 9l5.293-5.293a.999.999 0 10-1.414-1.414L9 7.586 3.707 2.293a.999.999 0 10-1.414 1.414L7.586 9l-5.293 5.293a.999.999 0 101.414 1.414L9 10.414l5.293 5.293a.997.997 0 001.414 0 .999.999 0 000-1.414L10.414 9"
        fill="currentColor" fill-rule="evenodd" stroke="none"></path>
    </g>
  </defs>
  </svg>
  <div class="search-area">
    <input class="search" placeholder="find address"></input>
    <button class="cancel" type="button">
    <svg viewBox="0 0 18 18"><use href="#icon-close"></use></svg>
    </input>
    <button class="run" type="button">
      <svg viewBox="0 0 18 18"><use href="#icon-search"></use></svg>
    </button>
    <div class="result-area">
      <div class="result-list">
      </div>
    </div>
  </div>
</div>
`;
  let widget = asDom(autoCompleteInput);
  let input = widget.querySelector(".search") as HTMLInputElement;
  let cancel = widget.querySelector(".cancel") as HTMLInputElement;
  let run = widget.querySelector(".run") as HTMLInputElement;
  let resultItems = widget.querySelector(".result-list") as HTMLDivElement;

  const createMarker = (className: string) => {
    return `<svg class="marker ${className}" style="width:1em;height:1em" viewBox="-10 -10 20 20"><use href="#marker-icon"></use></svg>`;
  };

  const createSpinner = (className: string) =>
    `<svg class="${className}" viewBox="-10 -10 20 20"><use href="#progress-spinner"></use></svg>`;

  async function search(singleLineInput: string) {
    console.log(`searching for "${singleLineInput}"`);
    return new Promise<Suggestion[]>((good, bad) => {
      let response = mockSuggestResponse.suggestions.map(v => ({
        text: v.text,
        magicKey: v.magicKey
      }));
      try {
        setTimeout(() => good(response), 100 + Math.random() * 5000);
      } catch (ex) {
        bad(ex);
      }
    });
  }

  function merge(suggestion: Suggestion, before?: HTMLElement) {
    let li = document.createElement("div");
    li.tabIndex = 0;
    li.classList.add("result-item");
    li.title = suggestion.text;
    li.innerText = suggestion.text;
    if (!!before) {
      before.insertAdjacentElement("afterend", li);
    } else {
      resultItems.appendChild(li);
    }
    return li;
  }

  let priorSearchValue = "";
  const searchAllProviders = () => {
    let searchValue = input.value;
    if (priorSearchValue === searchValue) return;
    priorSearchValue = searchValue;
    resultItems.innerText = "";
    if (input.value.length < MIN_SEARCH_LENGTH) {
      return; // will not perform search
    }

    return Promise.all(
      ["Addresses", "Parcel Layer", "Address Layer"].map(async providerName => {
        let results = search(input.value);
        let spinner = createSpinner("spin");
        let providerId = asId(providerName);
        let progress = asDom(
          `<div class="provider ${providerId}">
          <label>${providerName}</label>
          <div class="spinner">${spinner}</div>
          </div>`
        );
        resultItems.appendChild(progress);
        results.then(suggestions => {
          suggestions.forEach(suggestion => {
            let marker = asDom(createMarker(providerId));
            let result = merge(suggestion, progress);
            result.insertAdjacentElement("afterbegin", marker);
            result.addEventListener("click", () => {
              console.log("selected result", { suggestion });
              input.value = "";
              resultItems.innerText = "";
            });
          });
          if (!suggestions.length) {
            progress.remove();
          } else {
            progress.remove();
          }
        });
        return results;
      })
    );
  };

  const slowSearch = debounce(async () => {
    searchAllProviders();
  }, 500);

  const inputKeyups = {
    "ArrowDown": () => (focus(resultItems.firstElementChild, { direction: "down" })),
    "Enter": () => run.click(),
  }

  const resultItemsKeyups = {
    "Space": () => {
      let { activeElement } = document;
      click(activeElement);
    },
    "Enter": () => {
      let { activeElement } = document;
      click(activeElement);
    },
    "ArrowUp": () => {
      let { activeElement } = document;
      focus(activeElement.previousElementSibling, { direction: "up" }) || focus(input);
    },
    "ArrowDown": () => {
      let { activeElement } = document;
      focus(activeElement.nextElementSibling, { direction: "down" });
    },
  }

  resultItems.addEventListener("keyup", event => {
    if (resultItemsKeyups[event.code]) {
      resultItemsKeyups[event.code](event);
      return;
    }
  });

  run.addEventListener("click", () => {
    console.log("execute query");
  });

  input.addEventListener("keyup", event => {
    if (inputKeyups[event.code]) {
      inputKeyups[event.code](event);
      return;
    }
    slowSearch();
  });

  cancel.addEventListener("click", () => {
    input.value = "";
    searchAllProviders();
  });

  document.body.insertBefore(widget, document.body.firstChild);

  let spinner = createSpinner("spin");
  let progress = asDom(
    `<div class="workarea">${spinner}<label>SpinnerTest</label></div>`
  );
  document.body.insertBefore(progress, widget);

  input.value = "12345";
  await searchAllProviders();
  console.log("done");

}
