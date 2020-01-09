function randomColor() {
  let [r, g, b] = [255, 255, 255]
    .map(v => Math.floor(64 + (v - 64) * Math.random()))
    .map(v => v.toString(16));
  return [r, g, b].join("");
}

const textarea = `
/**
 * This is a prototype autocomplete/typeahead control
 * I've looked at the jquery autocomplete control
 * the twitter typeahead control
 * as well as the esri search input control.
 * I look at the google maps search input.
 * They are all excellent and very fast.
 *
 * This control copies some of the keyboard shortcuts (arrow up/down)
 * from those controls but is built on a "grid" layout.
 *
 * Like the esri control, this will aggregate results from
 * multiple services and render markers based on the response
 * data.  It will group the results by the provider
 *
 * Like the google control, it will render small markers to give
 * meaning to the data (business, home address, parcel, etc.)
 *
 * The google locator is so fast it doesn't need any animations
 * but some of the providers this control will consume aren't
 * so lucky so the user needs feedback.  I tried to make it
 * less jaring, but there's more to do.
 *
 * Morphing to prevent bouncing?
 * The progress indicators for the various providers cause bouncing
 * when the come in/out of view and I'm not sure they're necessary.
 * Maybe the "X" can show a progress spinner around it instead?
 * Or maybe the search icon can morph into a spinner?
 * Probably the first results should morph into the provider placeholder
 * instead of one fading in and the other out.
 */
`;

import debounce = require("dojo/debounce");
import mockSuggestResponse = require("../data/suggest_response");

const MIN_SEARCH_LENGTH = 1;

interface Dictionary<T> {
  [n: string]: T;
}

type Suggestion = { text: string; magicKey: string };

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

async function fadeOut(element: HTMLElement, interval = 200) {
  element.style.setProperty(
    "animation",
    `unreveal ${interval}ms forwards linear`
  );
  await sleep(interval);
  element.remove();
}

function click(element: Element & { click?: Function }) {
  if (element?.click) element.click();
}

async function sleep(interval = 1000) {
  return new Promise((good, bad) => {
    setTimeout(good, interval);
  });
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
      --text-color: white;
      --background-color: black;
      --border-color: rgba(200,200,200,1);
      --reveal-time: 0ms;
      --spin-rate: 5000ms;
      --ghostly: 0.6;
      --address-layer-color: #${randomColor()};
      --parcel-layer-color: #${randomColor()};
      --geolocator-color: #${randomColor()};
    }

    body {
      overflow: hidden;
    }

    .mock-auto-complete .spinner {display: none;}
    .mock-auto-complete div.provider {display:none;}

    .mock-auto-complete {
      display: inline-block;
      border: 1px solid;
      border-color: var(--border-color);
      padding: 0.25em;
      min-width: max(16em,25vw);
      max-width: min(48em,50vw);
      background: var(--background-color);
      color: var(--text-color);
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
      grid-template-columns: 2em auto;
      grid-template-areas:
        "marker data";
      max-height: 40vh;
      overflow: hidden;
    }

    .mock-auto-complete .result-list .result-item {
      cursor: pointer;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: wrap;
      animation: reveal var(--reveal-time) forwards linear;
    }

    .mock-auto-complete .result-list *.out-of-date {
      opacity: var(--ghostly);
    }

    .mock-auto-complete .result-list .provider {
      transform: translate(0, 6px);
    }

    .mock-auto-complete .spin {
      animation: spin var(--spin-rate) 200ms infinite linear;
    }

    .mock-auto-complete .result-list .marker {
      stroke: var(--text-color);
      stroke-width: 2;
      stroke-opacity: var(--ghostly);
      transform: translate(50%, 25%) scale(1);
    }

    .mock-auto-complete .result-list .marker.hilite {
      transition: all 100ms ease-in;
      stroke-opacity: 1;
    }

    .mock-auto-complete .result-list .Addresses.spinner use {
      stroke: var(--geolocator-color);
    }

    .mock-auto-complete .result-list .marker.Addresses {
        fill: var(--geolocator-color);
    }

    .mock-auto-complete .result-list .ParcelLayer.spinner use {
      stroke: var(--parcel-layer-color);
    }

    .mock-auto-complete .result-list .marker.ParcelLayer {
      fill: var(--parcel-layer-color);
    }

    .mock-auto-complete .result-list .AddressLayer.spinner use {
      stroke: var(--address-layer-color);
    }

    .mock-auto-complete .result-list .marker.AddressLayer {
      fill: var(--address-layer-color);
    }

    .mock-auto-complete .result-list .fade-out {
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
      <path transform="scale(1.2, 0.6) translate(0, 15)" stroke-width="1"
      d="M 0 0 L -4 -20 L -6 -25 L -1 -30 L 0 -30 L 1 -30 L 6 -25 L 4 -20 Z"></path>
    </g>
    <g id="progress-spinner">
      <circle class="track" cx="0" cy="0" r="5" fill="none" stroke-width="2" />
      <circle class="ball" cx="0" cy="-5" r="1" fill="#000000" stroke="#ffffff" stroke-width="0.1" />
      <circle class="ball" cx="0" cy="5" r="1" fill="#ffffff" stroke="#000000" stroke-width="0.1" />
    </g>
    <g id="icon-search" viewBox="0 0 18 18">
      <path d="M17.707 16.293l-5.108-5.109A6.954 6.954 0 0014 7c0-3.86-3.141-7-7-7S0 3.14 0 7s3.141 7 7 7a6.958 6.958 0 004.185-1.402l5.108 5.109a.997.997 0 001.414 0 .999.999 0 000-1.414zM7 12c-2.757 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5z"
      fill-rule="nonzero" stroke="none"></path>
    </g>
    <g id="icon-close" viewBox="0 0 18 18">
      <path
        d="M10.414 9l5.293-5.293a.999.999 0 10-1.414-1.414L9 7.586 3.707 2.293a.999.999 0 10-1.414 1.414L7.586 9l-5.293 5.293a.999.999 0 101.414 1.414L9 10.414l5.293 5.293a.997.997 0 001.414 0 .999.999 0 000-1.414L10.414 9"
        fill-rule="evenodd" stroke="none"></path>
    </g>
  </defs>
  </svg>
  <p class="mission-impossible">This is a mocked service so try typing "29605" or "55100"</p>
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
    `<svg class="spinner ${className}" viewBox="-10 -10 20 20"><use href="#progress-spinner"></use></svg>`;

  const missionImpossible = async () => {
    let nodes = Array.from(
      document.querySelectorAll(".mission-impossible")
    ) as HTMLElement[];
    if (!nodes.length) return;
    nodes.forEach(n => n.classList.remove("mission-impossible"));
    await sleep(5000);
    nodes.forEach(n => fadeOut(n, 2000));
  };

  let mockData = {} as Dictionary<Suggestion[]>;

  async function search(providerId: string, singleLineInput: string) {
    console.log(`searching for "${singleLineInput}"`);
    return new Promise<Suggestion[]>((good, bad) => {
      let response = mockData[providerId];
      if (!response) {
        response = mockSuggestResponse.suggestions.map((v, i) => ({
          text: v.text,
          magicKey: `${providerId}+${i}`
        }));
        mockData[providerId] = response;
      }
      try {
        let finalResult = response.filter(v =>
          v.text
            .split(/[ ,\.]/)
            .some(
              v =>
                !!v &&
                0 <=
                  singleLineInput
                    .toLocaleLowerCase()
                    .indexOf(v.toLocaleLowerCase())
            )
        );
        setTimeout(() => good(finalResult), 100 + Math.random() * 5000);
      } catch (ex) {
        bad(ex);
      }
    });
  }

  function merge(
    providerId: string,
    suggestion: Suggestion,
    before?: HTMLElement
  ) {
    let result: HTMLDivElement | null;
    if (!!before) {
      result = document.querySelector(
        `.result-item[data-key='${suggestion.magicKey}']`
      );
    }
    if (!result) {
      result = document.createElement("div");
      if (!!before) {
        before.insertAdjacentElement("afterend", result);
      } else {
        resultItems.appendChild(result);
      }
      let marker = asDom(createMarker(providerId));
      resultItems.insertBefore(marker, result);
      result.addEventListener("click", () => {
        select(suggestion);
        clearAll();
      });
      result.addEventListener("focus", () => {
        marker.classList.add("hilite");
      });
      result.addEventListener("blur", () => {
        marker.classList.remove("hilite");
      });
    }

    let marker = result.previousElementSibling;
    marker.classList.remove("out-of-date");

    result.dataset["key"] = suggestion.magicKey;
    result.tabIndex = 0;
    result.className = `result-item ${providerId}`;
    result.title = suggestion.text;
    result.innerText = suggestion.text;
    return result;
  }

  function select(suggestion: Suggestion) {
    console.log("selected result", { suggestion });
  }

  function clearAll() {
    input.value = "";
    resultItems.innerText = "";
  }

  let priorSearchValue = "";
  const searchAllProviders = () => {
    let searchValue = input.value;
    if (priorSearchValue === searchValue) return;
    priorSearchValue = searchValue;
    if (input.value.length < MIN_SEARCH_LENGTH) {
      return; // will not perform search
    }

    return Promise.all(
      ["Addresses", "Parcel Layer", "Address Layer"].map(async providerName => {
        let providerId = asId(providerName);
        let progressIndicator = widget.querySelector(`.spinner.${providerId}`);
        if (!progressIndicator) {
          progressIndicator = asDom(createSpinner(providerId));
          resultItems.appendChild(progressIndicator);
          let progressLabel = asDom(
            `<div class="provider ${providerId}">${providerName}</div>`
          );
          resultItems.appendChild(progressLabel);
        } else {
          // result-item and marker get flagged as out-of-date
          ["result-item", "marker"].forEach(selector => {
            Array.from(
              widget.querySelectorAll(`.${selector}.${providerId}`)
            ).forEach(item => item.classList.add("out-of-date"));
          });
        }
        let progressLabel = progressIndicator.nextElementSibling as HTMLElement;

        progressLabel.classList.remove("fade-out");
        progressIndicator.classList.remove("fade-out");
        progressIndicator.classList.add("spin");

        let results = search(providerId, input.value);
        results.then(suggestions => {
          if (!suggestions.length) {
            progressLabel.remove();
            progressIndicator.remove();
          }
          suggestions.forEach(suggestion => {
            merge(providerId, suggestion, progressLabel);
          });
          progressIndicator.classList.remove("spin");
          progressIndicator.classList.add("fade-out");
          progressLabel.classList.add("fade-out");
          // result-item and marker get flagged as out-of-date
          ["result-item", "marker"].forEach(selector => {
            Array.from(
              widget.querySelectorAll(`.${selector}.${providerId}.out-of-date`)
            ).forEach(item => {
              fadeOut(item as HTMLElement);
            });
          });
        });
        return results;
      })
    );
  };

  const slowSearch = debounce(async () => {
    let thing = cancel.querySelector("svg") as SVGElement;
    try {
      thing.classList.add("spin");
      thing.style.setProperty("fill", "red");
      await searchAllProviders();
    } finally {
      thing.classList.remove("spin");
      thing.style.setProperty("fill", "");
    }
  }, 500);

  const inputKeyups = {
    ArrowDown: () =>
      focus(resultItems.firstElementChild, { direction: "down" }),
    Enter: () => run.click()
  };

  const resultItemsKeyups = {
    Space: () => {
      let { activeElement } = document;
      click(activeElement);
    },
    Enter: () => {
      let { activeElement } = document;
      click(activeElement);
    },
    ArrowUp: () => {
      let { activeElement } = document;
      if (!focus(activeElement.previousElementSibling, { direction: "up" })) {
        if (focus(input)) {
          input.select();
        }
      }
    },
    ArrowDown: () => {
      let { activeElement } = document;
      focus(activeElement.nextElementSibling, { direction: "down" });
    }
  };

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
    clearAll();
  });

  document.body.insertBefore(widget, document.body.firstChild);

  input.value = "datastream";
  await slowSearch();
  console.log(textarea.replace(/\n/g, ""));
  missionImpossible();
}
