const DebugContext = {
    on_event(event, state, _requests) {
        state.last_event_type ??= "";
        state.last_event_type = event.type;
    },
};

const DebugUpdater = {
    hooked_state: {
        get debug_objs() { return _debug_objs; },
    },
    on_dt(dt) {
        const minicon   = document.getElementById("minicon");
        const debug_rows = document.getElementById("debug_rows");
        if (!minicon || !debug_rows) return;

        minicon.textContent = dt.toFixed(4);
        debug_rows.textContent = "";

        for (const obj of _debug_objs) {
            for (const [k, v] of Object.entries(obj)) {
                const row = document.createElement("tr");
                const key = document.createElement("td");
                const val = document.createElement("td");
                key.textContent = String(k);
                val.textContent = typeof v === "number" ? v.toFixed(2) : String(v);
                row.append(key, val);
                debug_rows.append(row);
            }
        }
    },
};

function log(msg) {
    const minicon = document.getElementById("minicon");
    if (minicon) minicon.textContent = msg;
}

window.addEventListener("DOMContentLoaded", () => {
    register_debug_context(DebugContext);
    register_updater(DebugUpdater);
});
