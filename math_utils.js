/**
 * 10_math_utils.gs
 * Numeric helpers + logger-based test runner.
 *
 * Conventions:
 * - Functions throw on obviously bad arguments when it helps catch wiring bugs.
 * - Avoid spreadsheet calls here; pure JS only.
 */

function isFiniteNumber(x) {
  return typeof x === "number" && Number.isFinite(x);
}

function clamp(x, lo, hi) {
  if (!isFiniteNumber(x) || !isFiniteNumber(lo) || !isFiniteNumber(hi)) {
    throw new Error("clamp: arguments must be finite numbers");
  }
  if (lo > hi) throw new Error("clamp: lo > hi");
  return Math.max(lo, Math.min(hi, x));
}

function sign(x) {
  if (!isFiniteNumber(x)) return NaN;
  if (x > 0) return 1;
  if (x < 0) return -1;
  return 0;
}

/**
 * linspace(a,b,n): inclusive endpoints for n>=2, single element [a] for n==1.
 */
function linspace(a, b, n) {
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) {
    throw new Error("linspace: a and b must be finite numbers");
  }
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error("linspace: n must be a positive integer");
  }
  if (n === 1) return [a];

  const out = new Array(n);
  const step = (b - a) / (n - 1);
  for (let i = 0; i < n; i++) out[i] = a + i * step;
  // Ensure exact endpoints (avoid floating drift)
  out[0] = a;
  out[n - 1] = b;
  return out;
}

/**
 * Mutating merge: copies enumerable own properties from src to dst.
 * Returns dst (for chaining).
 */
function mergeInto(dst, src) {
  if (dst === null || typeof dst !== "object") throw new Error("mergeInto: dst must be object");
  if (src === null || typeof src !== "object") throw new Error("mergeInto: src must be object");
  for (const k in src) {
    if (Object.prototype.hasOwnProperty.call(src, k)) dst[k] = src[k];
  }
  return dst;
}

/**
 * Shallow copy for debug snapshots. Arrays become arrays, objects become objects.
 */
function copyShallow(x) {
  if (Array.isArray(x)) return x.slice();
  if (x && typeof x === "object") return Object.assign({}, x);
  return x;
}

/**
 * Floating comparison helper for sanity checks.
 */
function approxEqual(a, b, tolAbs, tolRel) {
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) return false;
  const da = Math.abs(a - b);
  const scale = Math.max(1.0, Math.abs(a), Math.abs(b));
  return da <= (tolAbs || 0) + (tolRel || 0) * scale;
}