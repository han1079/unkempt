const rdiv_vin_data = {vin: null, vout: null, rh: null, rl: 1e9, rh_pow: null, rl_pow: null, ok: false};
const rdiv_vout_data = {vin: null, vout: null, rh: null, rl: 1e9, rh_pow: null, rl_pow: null, ok: false};
const rdiv_low_data = {vin: null, vout: null, rh: null, rl: 1e9, rh_pow: null, rl_pow: null, ok: false};
const rdiv_high_data = {vin: null, vout: null, rh: null, rl: 1e9, rh_pow: null, rl_pow: null, ok: false};

function rdiv_calc(data, calc_type){
    console.log("Calculation entered: %s %s %s %s", data.vin, data.vout, data.rh, data.rl);
    let _vin = 0;
    if (data.rl !== 0) {
        _vin = data.vout*(1+data.rh/data.rl);
    } else {
        _vin = Infinity;
    }
    let _vout = data.vin*(data.rl/(data.rh+data.rl));
    let _rl = data.rh / ((data.vin-data.vout)/data.vout)
    let _rh = (data.vin - data.vout) * data.rl;

    console.log("Intermediate values: %s %s %s %s", _vin, _vout, _rh, _rl);

    if (_vin == Infinity) {
        data.ok = false;
        console.log("Calculation failed: %s %s %s %s", data.vin, data.vout, data.rh, data.rl);
        return data.ok;
    } else {
        data.ok = true;
    }

    if (calc_type === "rdiv_vin") {
        data.vin = _vin;
        data.ok = true;
    } else if (calc_type === "rdiv_vout") {
        data.vout = _vout;
        data.ok = true;
    } else if (calc_type === "rdiv_rl") {
        data.rl = _rl;
        data.ok = true;
    } else if (calc_type === "rdiv_rh") {
        data.rh = _rh;
        data.ok = true;
    } else {
        data.ok = false;
        console.log("Unknown calculation type");
    }
    console.log("Calculation result: %s %s %s %s", data.vin, data.vout, data.rh, data.rl);
    return data.ok;
}

function load_and_calc(e) {
    const analysis_name = e.target.id;
    console.log(analysis_name);

    let table = null;
    let calc_ok = false;

    switch (analysis_name) {
        case "rdiv_vout_btn":
            // Load inputs
            table = document.getElementById("rdiv_vout_tbl");
            rdiv_vout_data.vin = parseFloat(table.querySelector('input[data-key="vin"]').value);
            rdiv_vout_data.rh = parseFloat(table.querySelector('input[data-key="rhigh"]').value);
            rdiv_vout_data.rl = parseFloat(table.querySelector('input[data-key="rlow"]').value);
            // Perform calculation
            calc_ok = rdiv_calc(rdiv_vout_data, "rdiv_vout");

            if (rdiv_vout_data.ok) {
                console.log(document.getElementById("rdiv_vout_tbl"));
                let cell = document.getElementById("rdiv_vout_tbl").getElementsByClassName("vout_result")[0];
                console.log(cell.value);
                cell.textContent = rdiv_vout_data.vout.toFixed(2) + " V";
            } else {
                let cell = document.getElementById("rdiv_rh_tbl").getElementsByClassName("vout_result")[0];
                cell.textContent = "NaN";
                console.log("Calculation failed: %s %s %s", rdiv_vout_data.vin, rdiv_vout_data.rh, rdiv_vout_data.rl);
            }
            break;

        case "rdiv_vin_btn":
            // Load inputs
            table = document.getElementById("rdiv_vin_tbl");
            rdiv_vin_data.vout = parseFloat(table.querySelector('input[data-key="vout"]').value);
            rdiv_vin_data.rh = parseFloat(table.querySelector('input[data-key="rhigh"]').value);
            rdiv_vin_data.rl = parseFloat(table.querySelector('input[data-key="rlow"]').value);
            // Perform calculation
            rdiv_calc(rdiv_vin_data, "rdiv_vin");

            if (rdiv_vin_data.ok) {
                let cell = document.getElementById("rdiv_vin_tbl").getElementsByClassName("vin_result")[0];
                cell.textContent = rdiv_vin_data.vin.toFixed(2) + " V";
            } else {
                let cell = document.getElementById("rdiv_rh_tbl").getElementsByClassName("vin_result")[0];
                cell.textContent = "NaN";
                console.log("Calculation failed: %s %s %s", rdiv_vin_data.vout, rdiv_vin_data.rh, rdiv_vin_data.rl);
            }
            break;

        case "rdiv_rl_btn":
            // Load inputs
            table = document.getElementById("rdiv_rl_tbl");
            rdiv_low_data.vin = parseFloat(table.querySelector('input[data-key="vin"]').value);
            rdiv_low_data.vout = parseFloat(table.querySelector('input[data-key="vout"]').value);
            rdiv_low_data.rh = parseFloat(table.querySelector('input[data-key="rhigh"]').value);
            // Perform calculation
            rdiv_calc(rdiv_low_data, "rdiv_rl");

            if (rdiv_low_data.ok) {
                let cell = document.getElementById("rdiv_rl_tbl").getElementsByClassName("rlow_result")[0];
                cell.textContent = rdiv_low_data.rl.toFixed(2) + " Ω";
            } else {
                let cell = document.getElementById("rdiv_rh_tbl").getElementsByClassName("rlow_result")[0];
                cell.textContent = "NaN";
                console.log("Calculation failed: %s %s %s", rdiv_low_data.vin, rdiv_low_data.vout, rdiv_low_data.rh);
            }
            break;

        case "rdiv_rh_btn":
            // Load inputs
            table = document.getElementById("rdiv_rh_tbl");
            rdiv_high_data.vin = parseFloat(table.querySelector('input[data-key="vin"]').value);
            rdiv_high_data.vout = parseFloat(table.querySelector('input[data-key="vout"]').value);
            rdiv_high_data.rl = parseFloat(table.querySelector('input[data-key="rlow"]').value);
            // Perform calculation
            rdiv_calc(rdiv_high_data, "rdiv_rh");

            if (rdiv_high_data.ok) {
                let cell = document.getElementById("rdiv_rh_tbl").getElementsByClassName("rhigh_result")[0];
                cell.textContent = rdiv_high_data.rh.toFixed(2) + " Ω";
            } else {
                let cell = document.getElementById("rdiv_rh_tbl").getElementsByClassName("rhigh_result")[0];
                cell.textContent = "NaN";
                console.log("Calculation failed: %s %s %s", rdiv_high_data.vin, rdiv_high_data.vout, rdiv_high_data.rl);
            }
            break;

    }


}

katex.render(String.raw`V_{out} = V_{in} \cdot (\frac{R_{L}}{R_{H} + R_{L}})`, document.getElementById("vout_eq"));
katex.render(String.raw`V_{in} = V_{out} \cdot (1 + \frac{R_{H}}{R_{L}})`, document.getElementById("vin_eq"));
katex.render(String.raw`R_{L} = R_{H} \cdot \frac{V_{out}}{V_{in} - V_{out}}`, document.getElementById("rl_eq"));
katex.render(String.raw`R_{H} = (V_{in} - V_{out}) \cdot R_{L}`, document.getElementById("rh_eq"));

vin_elements = document.getElementsByClassName("vin");
vout_elements = document.getElementsByClassName("vout");
rhigh_elements = document.getElementsByClassName("rhigh");
rlow_elements = document.getElementsByClassName("rlow");
for (let i = 0; i < document.getElementsByClassName("vin").length; i++) {
    katex.render(String.raw`V_{in}`, vin_elements[i]);
    katex.render(String.raw`V_{out}`, vout_elements[i]);
    katex.render(String.raw`R_{H}`, rhigh_elements[i]);
    katex.render(String.raw`R_{L}`, rlow_elements[i]);
}

document.getElementById("rdiv_vout_btn").addEventListener("click", load_and_calc);
document.getElementById("rdiv_vin_btn").addEventListener("click", load_and_calc);
document.getElementById("rdiv_rl_btn").addEventListener("click", load_and_calc);
document.getElementById("rdiv_rh_btn").addEventListener("click", load_and_calc);
