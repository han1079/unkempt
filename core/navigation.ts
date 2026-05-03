window.addEventListener("hashchange", () => {
    _EVENT_QUEUE.push({ type: "hashchange", hash: location.hash.slice(1) });
});

const NAVIGATION_SESSION: Session = {
    on_register(_state: GlobalState) {
        _state.route ??= location.hash.slice(1) || "home";
    },
    on_push(_state: GlobalState) {
        _state.route = location.hash.slice(1) || "home";
        _show_route(_state.route as string);
    },
    on_pop(_state: GlobalState) {},
    on_event(event: DispatchedEvent, _state: GlobalState, _requests: SessionRequest[]) {
        if (event.type !== "hashchange") return;
        _state.route = event.hash || "home";
        _show_route(_state.route as string);
    },
    on_dt(_dt: number, _state: GlobalState, _requests: SessionRequest[]) {},
};

function _show_route(route: string): void {
    for (const el of document.querySelectorAll<HTMLElement>("[data-route]")) {
        el.hidden = (el.dataset.route !== route);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    register_session("navigation", NAVIGATION_SESSION);
});
