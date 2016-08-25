export function run() {
    let l = window.location;
    let path = `${l.origin}${l.pathname}?run=labs/`;
    let labs = `
    ags-catalog-proxy
    ags-feature-proxy
    ags-feature-query-proxy
    ags-find-address-proxy
    ags-find-proxy
    ags-geometry-proxy
    ags-lrs-proxy
    ags-map-export-proxy
    ags-map-find-proxy
    ags-map-identify-proxy
    ags-map-query-proxy
    ags-reverse-geocode-proxy
    ags-route-editor
    ags-route-solve-proxy
    ags-servicearea-solve-proxy
    ags-solve-proxy
    ags-suggest-proxy
    ags-webmap
    index
    maplet
    pubsub    
    `;

    let styles = document.createElement("style");
    document.head.appendChild(styles);

    styles.innerText += `
    #map {
        display: none;
    }
    .test {
        margin: 20px;
    }
    `;

    let labDiv = document.createElement("div");
    document.body.appendChild(labDiv);

    labDiv.innerHTML = labs
        .split(/ /)
        .map(v => v.trim())
        .filter(v => !!v)
        //.sort()
        .map(lab => `<div class='test'><a href='${path}${lab}&debug=1'>${lab}</a></div>`)
        .join("\n");


    let testDiv = document.createElement("div");
    document.body.appendChild(testDiv);
};