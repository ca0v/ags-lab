import debounce = require("dojo/debounce");
import mockSuggestResponse = require("../data/suggest_response");

const MIN_SEARCH_LENGTH = 5;

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
      --border-color: rgba(255,255,200,1);
    }

    .mock-auto-complete {
      display: inline-block;
      padding: 1em;
      background-color: #777777;
    }

    .mock-auto-complete .search-area {
      border: 1px solid silver;
      padding: 1em;
      display: grid;
      grid-template-columns: 16em 1.5em 2em;
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

    .mock-auto-complete .result-list .provider .spin {
      width: 2em;
      height: 2em;
      animation: spin 1000ms infinite linear;
      transform: scale(0);
    }
    
    .mock-auto-complete .result-list .provider .spin.fade-out {
      animation: fadeout 200ms forwards linear;
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
      from {transform:scale(1);}
      to {transform:scale(0);}
    }
`;
document.head.appendChild(styles);

function asDom(html: string) {
  let div = document.createElement("div");
  div.innerHTML = html.trim();
  return div.firstChild as HTMLElement;
}

export async function run() {
  const autoCompleteInput = `
<div class="mock-auto-complete">
  <svg style="display:none" viewBox="-10 -10 20 20">
  <defs>
    <g id="progress-spinner">
      <circle class="track" cx="0" cy="0" r="5" fill="none" stroke="white" stroke-width="3" />
      <circle class="ball" cx="0" cy="-5" r="1" fill="black" stroke-width="0" />
    </g>
  </defs>
  </svg>    
  <div class="search-area">
    <input class="search" placeholder="find address"></input>
    <input class="cancel" type="button" value="X"></input>
    <input class="run" type="button" value="🔍"></input>
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

  const createSpinner = (className: string) =>
    `<svg class="${className}" viewBox="-10 -10 20 20"><use href="#progress-spinner"></use></svg>`;

  async function search(singleLineInput: string) {
    console.log(`searching for "${singleLineInput}"`);
    return new Promise<Suggestion[]>((good, bad) => {
      let response = mockSuggestResponse.suggestions.map(v => ({
        text: `${v.text}`,
        magicKey: `${Math.random()}`
      }));
      try {
        setTimeout(() => good(response), 100 + Math.random() * 5000);
      } catch (ex) {
        bad(ex);
      }
    });
  }

  let resultData = <Dictionary<Suggestion>>{};

  function merge(suggestion: Suggestion, before?: HTMLElement) {
    resultData[suggestion.magicKey] = suggestion;
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
        let progress = asDom(
          `<div class="provider"><label>${providerName}</label>${createSpinner(
            "spin"
          )}</div>`
        );
        resultItems.appendChild(progress);
        results.then(suggestions => {
          suggestions.forEach(suggestion => merge(suggestion, progress));
          if (!suggestions.length) {
            progress.remove();
          } else {
            progress.querySelector(".spin").classList.add("fade-out");
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

  document.body.insertBefore(widget, document.body.firstChild);

  input.value = "12345";
  await searchAllProviders();
  console.log("done");
}
