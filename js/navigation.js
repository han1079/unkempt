// Inject hashchange into the scheduler event queue
window.addEventListener("hashchange", () => {
    _event_queue.push({ type: "hashchange", hash: location.hash.slice(1) });
});

// ── Context ───────────────────────────────────────────────────
const NavigationContext = {
    on_register(state) {
        state.route ??= location.hash.slice(1) || "home";
    },

    on_push(state) {
        // Sync initial route on push in case hash was set before context loaded
        state.route = location.hash.slice(1) || "home";
        _show_route(state.route);
    },

    on_event(event, state, _requests) {
        if (event.type !== "hashchange") return;
        state.route = event.hash || "home";
        _show_route(state.route);
    },
};

function _show_route(route) {
    for (const el of document.querySelectorAll("[data-route]")) {
        el.hidden = (el.dataset.route !== route);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    register_context("navigation", NavigationContext);
});
