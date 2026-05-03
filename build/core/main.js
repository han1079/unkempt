"use strict";
const LOAD_SCREEN_SESSION = {
    _timeout: 0.1,
    _current_timeout: 0.1,
    on_register(_state) {
        _state.load_screen_opacity ??= 1;
        const el = document.querySelector(".overlay_container");
        if (el)
            el.style.opacity = "1";
    },
    on_push(_state) { },
    on_pop(_state) {
        delete _state.load_screen_opacity;
        const el = document.querySelector(".overlay_container");
        if (el)
            el.style.opacity = "0";
    },
    on_event(_event, _state, _requests) { },
    on_dt(dt, _state, requests) {
        this._current_timeout -= dt;
        const t = Math.max(0, this._current_timeout / this._timeout);
        _state.load_screen_opacity = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const el = document.querySelector(".overlay_container");
        if (el)
            el.style.opacity = String(_state.load_screen_opacity);
        if (_state.load_screen_opacity < 0.01) {
            requests.push({ pop: LOAD_SCREEN_SESSION });
        }
    },
};
window.addEventListener("DOMContentLoaded", () => {
    register_session("load_screen", LOAD_SCREEN_SESSION);
    push_session(LOAD_SCREEN_SESSION);
    const container = document.querySelector("[data-rootsession]");
    const key = container?.dataset.rootsession;
    if (key && SESSION_REGISTRY[key]) {
        push_session(SESSION_REGISTRY[key]);
    }
    start_loop();
});
