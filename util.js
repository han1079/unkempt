// Provides globalThis.format(fmt, ...args) no matter what.
function format(fmt, ...args) {
  let i = 0;
  return String(fmt).replace(/%[sdif]/g, (m) => {
    const v = args[i++];
    if (m === "%d" || m === "%i") return String(Number(v));
    if (m === "%f") return String(Number(v));
    return String(v);
  });
}

const isFile = (location.protocol === "file:");
const isHttp = (location.protocol === "http:" || location.protocol === "https:");
const isLocalhost = (location.protocol === "localhost" || location.protocol === "127.0.0.1");

if (isLocalhost || isHttp) {
  const s = document.createElement("script");
  s.type = "module";
  s.src = "./import_modules.js";
  document.head.appendChild(s);
}