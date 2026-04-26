const XMLATTR = "http://www.w3.org/2000/svg";

const DrawingRootContext = {
    // Private
    _path:           [],
    _strokes:        [],
    _current_stroke: [],
    _draw_data:      "",

    on_register(state) {
        state.drawing ??= {
            brush_xy:   { startx: 0, starty: 0, x: 0, y: 0 },
            is_drawing: false,
        };
    },

    on_push(state) {
        const svg = document.getElementById("drawing_svg");
        if (!svg) return;
        this._path = document.createElementNS(XMLATTR, "path");
        this._path.setAttribute("stroke", "black");
        this._path.setAttribute("stroke-width", 2);
        this._path.setAttribute("fill", "none");
        svg.appendChild(this._path);
        this._strokes        = [];
        this._current_stroke = null;
        this._draw_data      = "";
    },

    on_pop(state) {
        this._path?.remove();
        this._path           = null;
        state.drawing.is_drawing = false;
    },

    on_event(event, state, _requests) {
        const drawable = document.querySelector(".drawable_area");
        if (!drawable) return;

        if (event.type === "pointerdown" && !event.ingested.button) {
            if (event.target === drawable) {
                const rect = drawable.getBoundingClientRect();
                state.drawing.brush_xy.startx = event.x - rect.left;
                state.drawing.brush_xy.starty = event.y - rect.top;
                state.drawing.brush_xy.x      = state.drawing.brush_xy.startx;
                state.drawing.brush_xy.y      = state.drawing.brush_xy.starty;
                state.drawing.is_drawing      = true;
                event.ingested.button         = true;
            }
        }

        if (event.type === "pointermove" && state.drawing.is_drawing) {
            const rect = drawable.getBoundingClientRect();
            state.drawing.brush_xy.x = event.x - rect.left;
            state.drawing.brush_xy.y = event.y - rect.top;
            event.ingested.position  = true;
        }

        if (event.type === "pointerup" && state.drawing.is_drawing) {
            state.drawing.is_drawing = false;
            event.ingested.button    = true;
        }
    },
};

const DrawingUpdater = {
    hooked_state: {
        get drawing() { return state.drawing; },
    },
    on_dt(_dt) {
        const d = state.drawing;
        if (!d) return;
        const ctx = DrawingRootContext;
        if (!ctx._path) return;

        if (d.is_drawing) {
            if (ctx._current_stroke === null) {
                ctx._current_stroke = `M ${d.brush_xy.startx} ${d.brush_xy.starty} `;
            } else {
                ctx._current_stroke += `L ${d.brush_xy.x} ${d.brush_xy.y} `;
                ctx._draw_data = ctx._strokes.join(" ") + " " + ctx._current_stroke;
                ctx._path.setAttribute("d", ctx._draw_data);
            }
        } else {
            if (ctx._current_stroke !== null) {
                ctx._strokes.push(ctx._current_stroke);
                ctx._draw_data = ctx._strokes.join(" ");
                ctx._path.setAttribute("d", ctx._draw_data);
                ctx._current_stroke = null;
            }
        }
    },
};

window.addEventListener("DOMContentLoaded", () => {
    register_context("drawing", DrawingRootContext);
    register_updater(DrawingUpdater);
    register_debug(state.drawing ?? {});
});
