window.addEventListener("hashchange", () => {
    _EVENT_QUEUE.push({ type: "hashchange", hash: location.hash.slice(1) });
});

// ── Session ───────────────────────────────────────────────────
const NAVIGATION_SESSION = {
    on_register(_state) {
        _state.route ??= location.hash.slice(1) || "home";
    },

    on_push(_state) {
        _state.route = location.hash.slice(1) || "home";
        _show_route(_state.route);
    },

    on_pop(_state) {},

    on_event(event, _state, _requests) {
        if (event.type !== "hashchange") return;
        _state.route = event.hash || "home";
        _show_route(_state.route);
    },

    on_dt(_dt, _state, _requests) {},
};

function _show_route(route) {
    for (const el of document.querySelectorAll("[data-route]")) {
        el.hidden = (el.dataset.route !== route);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    register_session("navigation", NAVIGATION_SESSION);
});
