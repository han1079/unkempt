const DRAG_THRESHOLD_MS = 20;

const InputContext = {
    on_register(state) {
        state.input ??= {
            pointer: { x: 0, y: 0 },
            state:   "idle",    // idle | down | dragging
            drag:    { startx: 0, starty: 0, dx: 0, dy: 0 },
            elapsed: 0,         // ms since pointer down
        };
    },

    on_event(event, state, _requests) {
        const inp = state.input;

        if (event.type === "pointermove") {
            inp.pointer.x = event.x;
            inp.pointer.y = event.y;
            if (inp.state === "dragging") {
                inp.drag.dx = event.x - inp.drag.startx;
                inp.drag.dy = event.y - inp.drag.starty;
            }
        }

        if (event.type === "pointerdown") {
            inp.state       = "down";
            inp.elapsed     = 0;
            inp.drag.startx = event.x;
            inp.drag.starty = event.y;
            inp.drag.dx     = 0;
            inp.drag.dy     = 0;
        }

        if (event.type === "pointerup") {
            inp.state   = "idle";
            inp.elapsed = 0;
        }
    },
};

const InputUpdater = {
    hooked_state: {
        get input() { return state.input; },
    },
    on_dt(dt) {
        const inp = state.input;
        if (!inp) return;
        if (inp.state === "down") {
            inp.elapsed += dt * 1000;
            if (inp.elapsed >= DRAG_THRESHOLD_MS) {
                inp.state = "dragging";
            }
        }
    },
};

window.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("Wireframe Toggle");
    if (btn) btn.addEventListener("click", () => {
        document.documentElement.classList.toggle("wireframe");
    });

    register_context("input", InputContext);
    register_updater(InputUpdater);
    register_debug(state.input.pointer ?? {});
});
