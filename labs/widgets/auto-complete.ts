import debounce = require("dojo/debounce");
import mockSuggestResponse = require("../data/suggest_response");

const MIN_SEARCH_LENGTH = 1;

interface Dictionary<T> {
  [n: string]: T;
}

type Suggestion = { text: string; magicKey: string };

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
    }

    .mock-auto-complete {
      display: inline-block;
      border: 1px solid;
      border-color: var(--border-color);
      padding: 0.25em;
    }

    .mock-auto-complete .search-area {
      display: grid;
      grid-template-columns: min(32em,max(16em,25vw)) 2em 2em;
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
    }

    .mock-auto-complete .result-list .result-item {
      cursor: pointer;
      padding: 0.5em;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      border-left: 1px solid transparent;
      height: 0;
      animation: grow 250ms forwards linear;
    }

    .mock-auto-complete .result-list .result-item:hover {
      transition: all 200ms ease-in;
      border-left-color: var(--border-color);
    }

    .mock-auto-complete .result-list .provider label {
      padding-left: 0.5em;
    }

    .mock-auto-complete .result-list .provider .spin {
      width: 2em;
      height: 2em;
      animation: spin 1000ms infinite linear;
      transform: scale(0);
    }

    .mock-auto-complete .result-list .marker {
      width: 2em;
      height: 2em;
      stroke: var(--border-color);
      stroke-width: 2;
      transform: translate(-8px, 0) rotate(45deg) scale(1, 2);
    }

    .mock-auto-complete .result-list .result-item .marker.Addresses {
        fill: red;
    }

    .mock-auto-complete .result-list .result-item .marker.ParcelLayer {
      fill: green;
    }

    .mock-auto-complete .result-list .result-item .marker.AddressLayer {
      fill: blue;
    }

    .mock-auto-complete .result-list .provider .spin.fade-out {
      animation: fadeout 0ms forwards linear;
    }

    @keyframes hightlight {
      100% {
        border-left-color: var(--border-color);
      }
    }

    @keyframes grow {
      from {height:0;}
      to {height:auto;}
    }

    @keyframes spin {
      from {transform:translate(0, 10px) rotate(0deg);}
      to {transform:translate(0, 10px) rotate(360deg);}
    }

    @keyframes fadeout {
      0% {transform:scale(1);}
      100% {transform:scale(0); width: 0;}
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
      <circle class="track" cx="0" cy="0" r="5" fill="none" stroke="#888888" stroke-width="1" />
      <circle class="ball" cx="0" cy="-5" r="1" fill="#000000" stroke-width="0" />
      <circle class="ball" cx="0" cy="5" r="1" fill="#ffffff" stroke-width="0" />
    </g>
    <g id="progress-spinner">
      <circle class="track" cx="0" cy="0" r="5" fill="none" stroke="#888888" stroke-width="1" />
      <circle class="ball" cx="0" cy="-5" r="1" fill="#000000" stroke-width="0" />
      <circle class="ball" cx="0" cy="5" r="1" fill="#ffffff" stroke-width="0" />
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
        let progress = asDom(
          `<div class="provider">${spinner}<label>${providerName}</label></div>`
        );
        resultItems.appendChild(progress);
        results.then(suggestions => {
          suggestions.forEach(suggestion => {
            let marker = asDom(createMarker(asId(providerName)));
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
            // let spinner = progress.querySelector(".spin");
            // spinner.classList.add("fade-out");
            // let marker = asDom(createMarker(asId(providerName)));
            // progress.insertBefore(marker, progress.firstChild);
          }
        });
        return results;
      })
    );
  };

  const slowSearch = debounce(async () => {
    searchAllProviders();
  }, 500);

  input.addEventListener("keyup", event => {
    slowSearch();
  });

  cancel.addEventListener("click", () => {
    input.value = "";
    searchAllProviders();
  });

  document.body.insertBefore(widget, document.body.firstChild);

  input.value = "12345";
  await searchAllProviders();
  console.log("done");
}
