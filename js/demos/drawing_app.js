const XMLATTR = "http://www.w3.org/2000/svg";

const DRAWING_ROOT_SESSION = {
    _path:           null,
    _strokes:        [],
    _current_stroke: null,
    _draw_data:      "",

    on_register(_state) {
        _state.drawing ??= {
            brush_xy:   { startx: 0, starty: 0, x: 0, y: 0 },
            is_drawing: false,
        };
    },

    on_push(_state) {
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

    on_pop(_state) {
        this._path?.remove();
        this._path                = null;
        _state.drawing.is_drawing = false;
    },

    on_event(event, _state, _requests) {
        const drawable = document.querySelector(".drawable_area");
        if (!drawable) return;

        if (event.type === "pointerdown" && !event.muted.action) {
            if (event.target === drawable) {
                const rect = drawable.getBoundingClientRect();
                _state.drawing.brush_xy.startx = event.x - rect.left;
                _state.drawing.brush_xy.starty = event.y - rect.top;
                _state.drawing.brush_xy.x      = _state.drawing.brush_xy.startx;
                _state.drawing.brush_xy.y      = _state.drawing.brush_xy.starty;
                _state.drawing.is_drawing      = true;
                event.muted.action             = true;
            }
        }

        if (event.type === "pointermove" && _state.drawing.is_drawing) {
            const rect = drawable.getBoundingClientRect();
            _state.drawing.brush_xy.x = event.x - rect.left;
            _state.drawing.brush_xy.y = event.y - rect.top;
            event.muted.position      = true;
        }

        if (event.type === "pointerup" && _state.drawing.is_drawing) {
            _state.drawing.is_drawing = false;
            event.muted.action        = true;
        }
    },

    on_dt(_dt, _state, _requests) {
        const d = _state.drawing;
        if (!d || !this._path) return;

        if (d.is_drawing) {
            if (this._current_stroke === null) {
                this._current_stroke = `M ${d.brush_xy.startx} ${d.brush_xy.starty} `;
            } else {
                this._current_stroke += `L ${d.brush_xy.x} ${d.brush_xy.y} `;
                this._draw_data = this._strokes.join(" ") + " " + this._current_stroke;
                this._path.setAttribute("d", this._draw_data);
            }
        } else {
            if (this._current_stroke !== null) {
                this._strokes.push(this._current_stroke);
                this._draw_data = this._strokes.join(" ");
                this._path.setAttribute("d", this._draw_data);
                this._current_stroke = null;
            }
        }
    },
};

window.addEventListener("DOMContentLoaded", () => {
    register_session("drawing", DRAWING_ROOT_SESSION);
    register_debug(GLOBAL_STATE.drawing ?? {});
});
