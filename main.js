function init_inputs() {
    return;
}


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
    switch_to_hash();
    init_inputs();
    var on_dt_list = [];
    on_dt_list.push(renderDebug);
    run_every_frame(on_dt_list);
}

window.addEventListener("DOMContentLoaded", main);

window.addEventListener("pointermove", (e) => {MouseXY.x = e.clientX; MouseXY.y = e.clientY; MouseXY.mouseInside = true});
window.addEventListener("mouseout", (e) => {if (e.relatedTarget === null) {MouseXY.mouseInside = false;}});
window.addEventListener("click", (e) => {nearest["Nearest"] = e.target.closest("div");});
document.getElementById("Wireframe Toggle").addEventListener("click", () => {document.documentElement.classList.toggle("wireframe")});