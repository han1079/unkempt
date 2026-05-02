"use strict";
// ── Protocol detection ────────────────────────────────────────
const IS_FILE = location.protocol === "file:";
const IS_HTTP = location.protocol === "http:" || location.protocol === "https:";
// ── Engine (stateless) ────────────────────────────────────────
function format(fmt, ...args) {
    let i = 0;
    return String(fmt).replace(/%[sdif]/g, (m) => {
        const v = args[i++];
        if (m === "%d" || m === "%i")
            return String(Number(v));
        if (m === "%f")
            return String(Number(v));
        return String(v);
    });
}
function parseStringForSuffix(str) {
    const multipliers = { k: 1e3, M: 1e6, G: 1e9, T: 1e12, m: 1e-3, u: 1e-6, n: 1e-9, p: 1e-12 };
    const match = str.match(/^(\d*\.?\d+)([kMGTPmunp]?)$/);
    if (!match)
        return null;
    const suffix = match[2];
    return { value: parseFloat(match[1]), multiplier: multipliers[suffix] || 1 };
}
const SESSION_REGISTRY = {};
const _SESSION_STACK = [];
let _DEBUG_SESSION = null;
const GLOBAL_STATE = {
    stack_height: 0,
};
const _UPDATER_LIST = [];
const _DEBUG_OBJS = [];
// ── Updater registration ──────────────────────────────────────
function register_updater(updater) {
    if (!updater.on_dt)
        throw new Error("Updater must implement on_dt");
    _UPDATER_LIST.push(updater);
    return function () {
        const i = _UPDATER_LIST.indexOf(updater);
        if (i !== -1)
            _UPDATER_LIST.splice(i, 1);
    };
}
// ── Debug object registration ─────────────────────────────────
function register_debug(obj) {
    _DEBUG_OBJS.push(obj);
    return function () {
        const i = _DEBUG_OBJS.indexOf(obj);
        if (i !== -1)
            _DEBUG_OBJS.splice(i, 1);
    };
}
// ── Registration ──────────────────────────────────────────────
function register_session(name, session) {
    SESSION_REGISTRY[name] = session;
    if (session.on_register)
        session.on_register(GLOBAL_STATE);
}
function register_debug_session(session) {
    _DEBUG_SESSION = session;
}
// ── Capability check ──────────────────────────────────────────
function _can_push(session) {
    if (!session.exclusive)
        return true;
    for (const cap of session.exclusive) {
        for (const active of _SESSION_STACK) {
            if (active.exclusive?.includes(cap))
                return false;
        }
    }
    return true;
}
// ── Public stack API ──────────────────────────────────────────
function push_session(session) { _push(session); }
function pop_session(session) { _pop(session); }
// ── Stack operations ──────────────────────────────────────────
function _push(session) {
    if (!session || !_can_push(session))
        return;
    _SESSION_STACK.push(session);
    GLOBAL_STATE.stack_height += 1;
    if (session.on_push)
        session.on_push(GLOBAL_STATE);
}
function _pop(session) {
    if (_SESSION_STACK.at(-1) !== session)
        return;
    _SESSION_STACK.pop();
    GLOBAL_STATE.stack_height -= 1;
    if (session.on_pop)
        session.on_pop(GLOBAL_STATE);
}
// ── Dispatch ──────────────────────────────────────────────────
function dispatch(raw, session_stack_request) {
    const event = {
        ...raw,
        muted: { position: false, action: false, keys: {} },
    };
    _DEBUG_SESSION?.on_event(event, GLOBAL_STATE, session_stack_request);
    for (let i = _SESSION_STACK.length - 1; i >= 0; i--) {
        _SESSION_STACK[i].on_event?.(event, GLOBAL_STATE, session_stack_request);
    }
}
// ── Tick ──────────────────────────────────────────────────────
function tick_sessions(dt, session_stack_request) {
    _DEBUG_SESSION?.on_dt?.(dt, GLOBAL_STATE, session_stack_request);
    for (let i = _SESSION_STACK.length - 1; i >= 0; i--) {
        _SESSION_STACK[i].on_dt?.(dt, GLOBAL_STATE, session_stack_request);
    }
}
// ── Session stack update ──────────────────────────────────────
function update_session_stack(session_stack_request) {
    session_stack_request.filter(r => r.pop).forEach(r => _pop(r.pop));
    const push = session_stack_request.find(r => r.push);
    if (push)
        _push(push.push);
}
const _EVENT_QUEUE = [];
const RAW_INPUT = {
    pointer: { x: 0, y: 0, down: false },
    keys: {},
};
// ── Browser event listeners ───────────────────────────────────
window.addEventListener("pointermove", e => {
    RAW_INPUT.pointer.x = e.clientX;
    RAW_INPUT.pointer.y = e.clientY;
    _EVENT_QUEUE.push({ type: "pointermove", x: e.clientX, y: e.clientY });
});
window.addEventListener("pointerdown", e => {
    RAW_INPUT.pointer.down = true;
    _EVENT_QUEUE.push({ type: "pointerdown", x: e.clientX, y: e.clientY, button: e.button, target: e.target });
});
window.addEventListener("pointerup", e => {
    RAW_INPUT.pointer.down = false;
    _EVENT_QUEUE.push({ type: "pointerup", x: e.clientX, y: e.clientY, button: e.button, target: e.target });
});
window.addEventListener("keydown", e => {
    RAW_INPUT.keys[e.key] = true;
    _EVENT_QUEUE.push({ type: "keydown", key: e.key });
});
window.addEventListener("keyup", e => {
    RAW_INPUT.keys[e.key] = false;
    _EVENT_QUEUE.push({ type: "keyup", key: e.key });
});
// ── Loop ──────────────────────────────────────────────────────
function start_loop() {
    let last = performance.now();
    function frame(now) {
        const dt = (now - last) / 1000;
        last = now;
        const session_stack_request = [];
        while (_EVENT_QUEUE.length > 0) {
            dispatch(_EVENT_QUEUE.shift(), session_stack_request);
        }
        tick_sessions(dt, session_stack_request);
        for (let i = 0; i < _UPDATER_LIST.length; i++) {
            _UPDATER_LIST[i].on_dt(dt, GLOBAL_STATE);
        }
        update_session_stack(session_stack_request);
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}
const CLICK_THRESHOLD_MS = 300;
const WIREFRAME_CLICK_PENDING_SESSION = {
    on_register(_state) { },
    on_push(_state) {
        _state._wireframe_t = performance.now();
    },
    on_pop(_state) {
        delete _state._wireframe_t;
    },
    on_event(event, _state, requests) {
        if (event.type === "pointerup") {
            if (performance.now() - _state._wireframe_t < CLICK_THRESHOLD_MS) {
                document.documentElement.classList.toggle("wireframe");
            }
            event.muted.action = true;
            requests.push({ pop: WIREFRAME_CLICK_PENDING_SESSION });
        }
    },
    on_dt(_dt, _state, _requests) { },
};
const DEBUG_SESSION = {
    on_register(_state) { },
    on_push(_state) { },
    on_pop(_state) { },
    on_event(event, _state, requests) {
        _state.last_event_type = event.type;
        if (event.type === "pointerdown") {
            const btn = event.target?.closest("button");
            if (btn?.id === "Wireframe Toggle") {
                event.muted.action = true;
                requests.push({ push: WIREFRAME_CLICK_PENDING_SESSION });
            }
        }
    },
    on_dt(dt, _state, _requests) {
        const minicon = document.getElementById("minicon");
        const debug_rows = document.getElementById("debug_rows");
        if (!minicon || !debug_rows)
            return;
        minicon.textContent = dt.toFixed(4);
        debug_rows.textContent = "";
        for (const obj of _DEBUG_OBJS) {
            for (const [k, v] of Object.entries(obj)) {
                if (v !== null && typeof v === "object") {
                    for (const [k2, v2] of Object.entries(v)) {
                        const row = document.createElement("tr");
                        const key = document.createElement("td");
                        const val = document.createElement("td");
                        key.textContent = `${k}.${k2}`;
                        val.textContent = typeof v2 === "number" ? v2.toFixed(2) : String(v2);
                        row.append(key, val);
                        debug_rows.append(row);
                    }
                }
                else {
                    const row = document.createElement("tr");
                    const key = document.createElement("td");
                    const val = document.createElement("td");
                    key.textContent = String(k);
                    val.textContent = typeof v === "number" ? v.toFixed(2) : String(v);
                    row.append(key, val);
                    debug_rows.append(row);
                }
            }
        }
    },
};
function log(msg) {
    const minicon = document.getElementById("minicon");
    if (minicon)
        minicon.textContent = msg;
}
window.addEventListener("DOMContentLoaded", () => {
    register_debug(RAW_INPUT);
    register_debug_session(DEBUG_SESSION);
});
// ── Marked renderer ───────────────────────────────────────────
const _RENDERER = new marked.Renderer();
_RENDERER.code = ({ text, lang }) => {
    if (lang === "latex") {
        return katex.renderToString(text, { displayMode: true });
    }
    if (lang === "svg") {
        return `<div class="svg-demo" data-src="../assets/${text.trim()}.svg"></div>`;
    }
    return `<pre><code>${text}</code></pre>`;
};
marked.use({ renderer: _RENDERER });
// ── Engine (stateless async) ──────────────────────────────────
async function loadMarkdown(post) {
    const res = await fetch(`../markdown/${post}.md`);
    const markdownText = await res.text();
    const container = document.querySelector(".center-content");
    if (!container)
        return;
    container.innerHTML = marked.parse(markdownText);
    container.querySelectorAll(".svg-demo").forEach(async (el) => {
        const svg_res = await fetch(el.dataset.src);
        el.innerHTML = await svg_res.text();
    });
}
// ── Session ───────────────────────────────────────────────────
const BLOG_ROOT_SESSION = {
    on_register(_state) {
        _state.route ?? (_state.route = location.hash.slice(1) || "home");
    },
    on_push(_state) {
        if (_state.route)
            loadMarkdown(_state.route);
    },
    on_pop(_state) { },
    on_event(event, _state, _requests) {
        if (event.type !== "hashchange")
            return;
        _state.route = event.hash;
        if (_state.route)
            loadMarkdown(_state.route);
    },
    on_dt(_dt, _state, _requests) { },
};
window.addEventListener("DOMContentLoaded", () => {
    register_session("blog", BLOG_ROOT_SESSION);
});
window.addEventListener("hashchange", () => {
    _EVENT_QUEUE.push({ type: "hashchange", hash: location.hash.slice(1) });
});
// ── Session ───────────────────────────────────────────────────
const NAVIGATION_SESSION = {
    on_register(_state) {
        _state.route ?? (_state.route = location.hash.slice(1) || "home");
    },
    on_push(_state) {
        _state.route = location.hash.slice(1) || "home";
        _show_route(_state.route);
    },
    on_pop(_state) { },
    on_event(event, _state, _requests) {
        if (event.type !== "hashchange")
            return;
        _state.route = event.hash || "home";
        _show_route(_state.route);
    },
    on_dt(_dt, _state, _requests) { },
};
function _show_route(route) {
    for (const el of document.querySelectorAll("[data-route]")) {
        el.hidden = (el.dataset.route !== route);
    }
}
window.addEventListener("DOMContentLoaded", () => {
    register_session("navigation", NAVIGATION_SESSION);
});
