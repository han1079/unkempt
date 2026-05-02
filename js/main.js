window.addEventListener("DOMContentLoaded", () => {
    if (ContextRegistry["input"]) {
        push_context(ContextRegistry["input"]);
    }

    const container = document.querySelector("[data-rootcontext]");
    const key = container?.dataset.rootcontext;
    if (key && ContextRegistry[key]) {
        push_context(ContextRegistry[key]);
    }

    start_loop();
});
