const _EVENT_QUEUE: RawEvent[] = [];
const RAW_INPUT: RawInput = {
    pointer: { x: 0, y: 0, down: false },
    keys:    {},
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
function start_loop(): void {
    let last = performance.now();

    function frame(now: number): void {
        const dt = (now - last) / 1000;
        last = now;

        const session_stack_request: SessionRequest[] = [];

        while (_EVENT_QUEUE.length > 0) {
            dispatch(_EVENT_QUEUE.shift()!, session_stack_request);
        }

        tick_sessions(dt, session_stack_request);
        update_session_stack(session_stack_request);
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}
