const CLICK_THRESHOLD_MS: number = 300;

const WIREFRAME_CLICK_PENDING_SESSION: Session = {
    on_register(_state: GlobalState) {},
    on_push(_state: GlobalState) {
        _state._wireframe_t = performance.now();
    },
    on_pop(_state: GlobalState) {
        delete _state._wireframe_t;
    },
    on_event(event: DispatchedEvent, _state: GlobalState, requests: SessionRequest[]) {
        if (event.type === "pointerup") {
            if (performance.now() - (_state._wireframe_t as number) < CLICK_THRESHOLD_MS) {
                document.documentElement.classList.toggle("wireframe");
            }
            event.muted.action = true;
            requests.push({ pop: WIREFRAME_CLICK_PENDING_SESSION });
        }
    },
    on_dt(_dt: number, _state: GlobalState, _requests: SessionRequest[]) {},
};

const DEBUG_SESSION: Session = {
    on_register(_state: GlobalState) {},
    on_push(_state: GlobalState)     {},
    on_pop(_state: GlobalState)      {},

    on_event(event: DispatchedEvent, _state: GlobalState, requests: SessionRequest[]) {
        _state.last_event_type = event.type;
        if (event.type === "pointerdown") {
            const btn = (event.target as Element)?.closest("button");
            if (btn?.id === "Wireframe Toggle") {
                event.muted.action = true;
                requests.push({ push: WIREFRAME_CLICK_PENDING_SESSION });
            }
        }
    },

    on_dt(dt: number, _state: GlobalState, _requests: SessionRequest[]) {
        const minicon    = document.getElementById("minicon");
        const debug_rows = document.getElementById("debug_rows");
        if (!minicon || !debug_rows) return;

        minicon.textContent    = dt.toFixed(4);
        debug_rows.textContent = "";

        for (const obj of _DEBUG_OBJS) {
            for (const [k, v] of Object.entries(obj)) {
                if (v !== null && typeof v === "object") {
                    for (const [k2, v2] of Object.entries(v as Record<string, unknown>)) {
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

function log(msg: string): void {
    const minicon = document.getElementById("minicon");
    if (minicon) minicon.textContent = msg;
}

window.addEventListener("DOMContentLoaded", () => {
    register_debug(RAW_INPUT);
    register_debug_session(DEBUG_SESSION);
});
