export function run() {
  let content = document.getElementById("console");
  if (!content) return;

  let log = console.log;
  console.log = (...args: string[]) => {
    log.apply(console, args);
    let div = document.createElement("textarea");
    div.innerText = args.map(v => JSON.stringify(v)).join(" ");
    content.insertBefore(div, content.firstChild);
  };
}
