import debounce = require("dojo/debounce");
import mockSuggestResponse = require("../data/suggest_response");

const MIN_SEARCH_LENGTH = 5;

interface Dictionary<T> {
    [n: string]: T;
}

type Suggestion = { text: string, magicKey: string };

/**
 * As user types a message invoke multiple "suggest" requests...as response comes
 * in add it to a auto-complete list
 * If user makes a selection invoke a findAddressCandidates request using magic-key
 * If user presses enter, invoke a findAddressCandidates request using input value
 */

let styles = document.createElement("style");
styles.innerText = `
    .mock-auto-complete {
        font-size: 1em;
    }

    .mock-auto-complete .search {
        background: white;
        border: none;
    }

    .mock-auto-complete .result-list .result-item {
        max-width: 20em;
    }
`;
document.head.appendChild(styles);

function asDom(html: string) {
    let div = document.createElement("div");
    div.innerHTML = html.trim();
    return div.firstChild as HTMLElement;
}

export function run() {

    const autoCompleteInput = `
<div class="mock-auto-complete">
    <input class="search" placeholder="find address"></input>
    <ul class="result-list"></ul>
</div>
`;
    let widget = asDom(autoCompleteInput);
    let input = widget.querySelector(".search") as HTMLInputElement;
    let resultItems = widget.querySelector(".result-list") as HTMLUListElement;

    async function search(singleLineInput: string) {
        console.log(`searching for "${singleLineInput}"`);
        return new Promise<Suggestion[]>((good, bad) => {
            try {
                good(mockSuggestResponse.suggestions);
            } catch (ex) {
                bad(ex);
            }
        });
    }

    let resultData = <Dictionary<Suggestion>>{};

    function merge(suggestion: Suggestion) {
        resultData[suggestion.magicKey] = suggestion;
        resultItems.innerHTML = "";
        Object.keys(resultData).map(key => {
            let li = document.createElement("li");
            li.classList.add("result-item");
            li.innerText = resultData[key].text;
            resultItems.appendChild(li);
        })
    }

    let slowSearch = debounce(async () => {
        let results = await search(input.value);
        results.forEach(merge);
    }, 500);

    input.addEventListener("keyup", (event) => {
        if (input.value.length >= MIN_SEARCH_LENGTH) {
            slowSearch();
        }
    });
    document.body.appendChild(widget);

    input.value = "123456";
    slowSearch();
}