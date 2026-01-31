const rdiv_vin_data = {vin: 0, vout: 0, rh: 0, rl: 1e9, rh_pow: 0, rl_pow: 0, ok: false};
const rdiv_vout_data = {vin: 0, vout: 0, rh: 0, rl: 1e9, rh_pow: 0, rl_pow: 0, ok: false};
const rdiv_low_data = {vin: 0, vout: 0, rh: 0, rl: 1e9, rh_pow: 0, rl_pow: 0, ok: false};
const rdiv_high_data = {vin: 0, vout: 0, rh: 0, rl: 1e9, rh_pow: 0, rl_pow: 0, ok: false};

function rdiv_calc(data, calc_type){
    if (data.rl === 0) {
        const _vin = data.vout*(1+data.rh/data.rl);
    } else {
        const _vin = Infinity;
    }
    const _vout = vin*(data.rl/(data.rh+data.rl));
    const _rl = data.rh / ((data.vin-data.vout)/data.vout)
    const _rh = (data.vin - data.vout) * data.rl;

    if (_vin === Infinity || (data.vout - data.vin) < 0) {
        data.ok = false;
        return;
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
    }
}

function load_and_calc_fwd(){
    const tabledat = document.getElementById()
    document.querySelectorAll('table')
}

document.getElementById("rdiv_fwd").addEventListener("click", load_and_calculate)
