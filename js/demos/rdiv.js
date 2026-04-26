// ── Engine (stateless) ────────────────────────────────────────
function rdiv_calc(data, calc_type) {
    const _vin  = data.vout * (1 + data.rh / data.rl);
    const _vout = data.vin  * (data.rl / (data.rh + data.rl));
    const _rl   = data.rh  / ((data.vin - data.vout) / data.vout);
    const _rh   = (data.vin - data.vout) * data.rl;

    if (!isFinite(_vin)) { data.ok = false; return; }

    data.ok = true;
    if (calc_type === "rdiv_vin")  data.vin  = _vin;
    if (calc_type === "rdiv_vout") data.vout = _vout;
    if (calc_type === "rdiv_rl")   data.rl   = _rl;
    if (calc_type === "rdiv_rh")   data.rh   = _rh;
}

// ── Context ───────────────────────────────────────────────────
const RdivRootContext = {
    _listeners: [],

    _data: {
        vin:  { vin: null, vout: null, rh: null, rl: 1e9, ok: false },
        vout: { vin: null, vout: null, rh: null, rl: 1e9, ok: false },
        rl:   { vin: null, vout: null, rh: null, rl: 1e9, ok: false },
        rh:   { vin: null, vout: null, rh: null, rl: 1e9, ok: false },
    },

    _render_katex() {
        const ids = {
            vout_eq: String.raw`V_{out} = V_{in} \cdot (\frac{R_{L}}{R_{H} + R_{L}})`,
            vin_eq:  String.raw`V_{in}  = V_{out} \cdot (1 + \frac{R_{H}}{R_{L}})`,
            rl_eq:   String.raw`R_{L}   = R_{H} \cdot \frac{V_{out}}{V_{in} - V_{out}}`,
            rh_eq:   String.raw`R_{H}   = (V_{in} - V_{out}) \cdot R_{L}`,
        };
        for (const [id, formula] of Object.entries(ids)) {
            const el = document.getElementById(id);
            if (el) katex.render(formula, el);
        }
        for (const cls of ["vin", "vout", "rhigh", "rlow"]) {
            const latex = { vin: String.raw`V_{in}`, vout: String.raw`V_{out}`, rhigh: String.raw`R_{H}`, rlow: String.raw`R_{L}` }[cls];
            document.querySelectorAll(`.${cls}`).forEach(el => katex.render(latex, el));
        }
    },

    _on_click(e) {
        const id    = e.target.id;
        const types = { rdiv_vout_btn: "rdiv_vout", rdiv_vin_btn: "rdiv_vin", rdiv_rl_btn: "rdiv_rl", rdiv_rh_btn: "rdiv_rh" };
        const keys  = { rdiv_vout_btn: "vout", rdiv_vin_btn: "vin", rdiv_rl_btn: "rl", rdiv_rh_btn: "rh" };
        const result_classes = { rdiv_vout_btn: "vout_result", rdiv_vin_btn: "vin_result", rdiv_rl_btn: "rlow_result", rdiv_rh_btn: "rhigh_result" };
        const units = { rdiv_vout_btn: "V", rdiv_vin_btn: "V", rdiv_rl_btn: "Ω", rdiv_rh_btn: "Ω" };
        const tbl_ids = { rdiv_vout_btn: "rdiv_vout_tbl", rdiv_vin_btn: "rdiv_vin_tbl", rdiv_rl_btn: "rdiv_rl_tbl", rdiv_rh_btn: "rdiv_rh_tbl" };

        if (!types[id]) return;
        const data = this._data[keys[id]];
        const tbl  = document.getElementById(tbl_ids[id]);
        if (!tbl) return;

        tbl.querySelectorAll("input[data-key]").forEach(input => {
            data[input.dataset.key === "rhigh" ? "rh" : input.dataset.key === "rlow" ? "rl" : input.dataset.key] = parseFloat(input.value);
        });

        rdiv_calc(data, types[id]);

        const cell = tbl.querySelector(`.${result_classes[id]}`);
        if (cell) cell.textContent = data.ok ? data[keys[id]].toFixed(2) + " " + units[id] : "NaN";
    },

    on_register(state) {
        state.rdiv ??= { last_calc: null };
    },

    on_push(state) {
        this._render_katex();
        const handler = this._on_click.bind(this);
        ["rdiv_vout_btn", "rdiv_vin_btn", "rdiv_rl_btn", "rdiv_rh_btn"].forEach(id => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener("click", handler);
            this._listeners.push({ btn, handler });
        });
    },

    on_pop(state) {
        this._listeners.forEach(({ btn, handler }) => btn.removeEventListener("click", handler));
        this._listeners = [];
    },
};

window.addEventListener("DOMContentLoaded", () => {
    register_context("rdiv", RdivRootContext);
});
