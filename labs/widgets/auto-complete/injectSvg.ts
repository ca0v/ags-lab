export function injectSvg(namespace: string, svg: string) {
    const container = document.createElement("div");
    container.innerHTML = svg.trim();
    document.body.appendChild(container.firstChild);
}
