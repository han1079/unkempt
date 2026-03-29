function run_every_frame(list_of_functions) {
    let last = performance.now();

    function on_monitor_refresh(now) {
        const dt = (now - last) / 1000;
        log(dt.toFixed(4));
        last = now;
        for (let i = 0; i < list_of_functions.length; i++) {
            list_of_functions[i](dt);
        }
        requestAnimationFrame(on_monitor_refresh);
    }
    requestAnimationFrame(on_monitor_refresh);
}

function main() {
    init_inputs();
    run_every_frame(on_dt_list);
}


window.addEventListener("DOMContentLoaded", main);
