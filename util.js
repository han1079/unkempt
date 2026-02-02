function parseStringForSuffix(str) {
  const multipliers = {
    k: 1e3,
    M: 1e6,
    G: 1e9,
    T: 1e12,
    m: 1e-3,
    u: 1e-6,
    n: 1e-9,
    p: 1e-12,
  };
  const match = str.match(/^(\d*\.?\d+)([kMGTPmunp]?)$/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const suffix = match[2];
  const multiplier = multipliers[suffix] || 1;
  return { value, multiplier };
}


let on_dt_list = [];

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