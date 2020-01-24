export function injectCss(namespace: string, css: string) {
    if (document.head.querySelector(`style[id="${namespace}"]`))
        throw "css already exists";
    const style = document.createElement("style");
    style.id = name;
    style.innerText = css;
    document.head.appendChild(style);
}
