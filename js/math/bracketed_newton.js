function scanBrackets(f, lb, ub, intervals) {
  if (ub < lb) { throw new Error("Upper Bracket is not lower than Lower"); }
  if (intervals < 1) { throw new Error("intervals must be >= 1"); }

  var tol = 1e-7;
  var brackets = [];

  // Cache endpoint evaluations
  var flb = f(lb);
  var fub = f(ub);

  // Endpoint-root policy: create a tiny bracket at the endpoint and nudge domain inward
  if (fub == 0) {
    Logger.log("UB ZERO");
    var a = ub - tol;
    var ha = f(a);
    brackets.push({"a": a, "b": ub, "ha": ha, "hb": fub});
    ub = a;
    fub = ha;
  }

  if (flb == 0) {
    Logger.log("LB ZERO");
    var b = lb + tol;
    var hb = f(b);
    brackets.push({"a": lb, "b": b, "ha": flb, "hb": hb});
    lb = b;
    flb = hb;
  }

  const blen = (ub - lb) / intervals;

  // Sliding window: start at left endpoint
  var l = lb;
  var fl = f(l);

  // interval i is [lb + i*blen, lb + (i+1)*blen], for i=0..intervals-1
  for (let i = 0; i < intervals; i++) {
    var u = (i == intervals - 1) ? ub : (lb + (i + 1) * blen);
    var fu = f(u);

    // If we land exactly on a root at u, create a tiny bracket [l, u+tol] (clamped)
    if (fu == 0) {
      var up = Math.min(ub, u + tol);
      var fup = (up == u) ? fu : f(up);
      brackets.push({"a": l, "b": up, "ha": fl, "hb": fup});

      // Next interval starts at up (nudged), not u
      l = up;
      fl = fup;
      continue;
    }

    // Standard sign-change bracket
    if (fl * fu < 0) {
      brackets.push({"a": l, "b": u, "ha": fl, "hb": fu});
    }

    // Advance
    l = u;
    fl = fu;
  }

  return brackets;
}

function bisectRoot(f, lb, ub, tol, maxIter) {
  var newlb = lb;
  var newub = ub;

  // Cache endpoint values
  var flb = f(newlb);
  var fub = f(newub);

  // Endpoint root policy inside bisection
  if (flb == 0) {
    return {"ok": true, "root": newlb, "hRoot": flb, "iters": 0};
  }
  if (fub == 0) {
    return {"ok": true, "root": newub, "hRoot": fub, "iters": 0};
  }

  // Validate bracket
  if (flb * fub > 0) {
    throw new Error("No zero crossing");
  }

  var best_x = newlb;
  var best_err = Math.abs(flb);

  var ok = false;
  var iter = 0;

  for (let i = 0; i < maxIter; i++) {
    iter++;

    var x = (newlb + newub) / 2;
    var fx = f(x);
    var err = Math.abs(fx);

    if (err < best_err) {
      best_err = err;
      best_x = x;
    }

    if (err < tol) {
      ok = true;
      best_x = x;
      break;
    }

    // Narrow bracket
    if (flb * fx < 0) {
      newub = x;
      fub = fx;
    } else {
      newlb = x;
      flb = fx;
    }
  }

  return {"ok": ok, "root": best_x, "hRoot": f(best_x), "iters": iter};
}
