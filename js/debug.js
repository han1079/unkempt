const CLICK_THRESHOLD_MS = 300;

const WIREFRAME_CLICK_PENDING_SESSION = {
    on_register(_state) {},
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
    on_dt(_dt, _state, _requests) {},
};

const DEBUG_SESSION = {
    on_register(_state) {},
    on_push(_state) {},
    on_pop(_state) {},
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
        const minicon    = document.getElementById("minicon");
        const debug_rows = document.getElementById("debug_rows");
        if (!minicon || !debug_rows) return;

        minicon.textContent    = dt.toFixed(4);
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
                } else {
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
    if (minicon) minicon.textContent = msg;
}

window.addEventListener("DOMContentLoaded", () => {
    register_debug_session(DEBUG_SESSION);
});
