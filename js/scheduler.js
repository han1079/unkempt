const _event_queue  = [];
const _updater_list = [];
const _debug_objs   = [];

const raw_input = {
    pointer: { x: 0, y: 0, down: false },
    keys:    {},
};

// ── Updater registration ──────────────────────────────────────
function register_updater(updater) {
    if (!updater.on_dt) throw new Error("Updater must implement on_dt");
    _updater_list.push(updater);
    return function() {
        const i = _updater_list.indexOf(updater);
        if (i !== -1) _updater_list.splice(i, 1);
    };
}

// ── Debug object registration ─────────────────────────────────
function register_debug(obj) {
    _debug_objs.push(obj);
    return function() {
        const i = _debug_objs.indexOf(obj);
        if (i !== -1) _debug_objs.splice(i, 1);
    };
}

// ── Browser event listeners ───────────────────────────────────
window.addEventListener("pointermove", e => {
    raw_input.pointer.x = e.clientX;
    raw_input.pointer.y = e.clientY;
    _event_queue.push({ type: "pointermove", x: e.clientX, y: e.clientY });
});

window.addEventListener("pointerdown", e => {
    raw_input.pointer.down = true;
    _event_queue.push({ type: "pointerdown", x: e.clientX, y: e.clientY, button: e.button, target: e.target });
});

window.addEventListener("pointerup", e => {
    raw_input.pointer.down = false;
    _event_queue.push({ type: "pointerup", x: e.clientX, y: e.clientY, button: e.button, target: e.target });
});

window.addEventListener("keydown", e => {
    raw_input.keys[e.key] = true;
    _event_queue.push({ type: "keydown", key: e.key });
});

window.addEventListener("keyup", e => {
    raw_input.keys[e.key] = false;
    _event_queue.push({ type: "keyup", key: e.key });
});

// ── Init ──────────────────────────────────────────────────────
function init() {
    let last = performance.now();

    function frame(now) {
        const dt = (now - last) / 1000;
        last = now;

        const context_stack_request = [];
        while (_event_queue.length > 0) {
            dispatch(_event_queue.shift(), context_stack_request);
        }

        for (let i = 0; i < _updater_list.length; i++) {
            _updater_list[i].on_dt(dt);
        }

        update_context_stack(context_stack_request);

        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}
