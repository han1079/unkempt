// ── Marked renderer ───────────────────────────────────────────
const _renderer = new marked.Renderer();

_renderer.code = ({ text, lang }) => {
    if (lang === "latex") {
        return katex.renderToString(text, { displayMode: true });
    }
    if (lang === "svg") {
        return `<div class="svg-demo" data-src="../assets/${text.trim()}.svg"></div>`;
    }
    // Future: widget blocks will be handled here
    return `<pre><code>${text}</code></pre>`;
};

marked.use({ renderer: _renderer });

// ── Engine (stateless async) ──────────────────────────────────
async function loadMarkdown(post) {
    const res          = await fetch(`../markdown/${post}.md`);
    const markdownText = await res.text();
    const container    = document.querySelector(".center-content");
    if (!container) return;
    container.innerHTML = marked.parse(markdownText);

    container.querySelectorAll(".svg-demo").forEach(async el => {
        const svg_res = await fetch(el.dataset.src);
        el.innerHTML  = await svg_res.text();
    });
}

// ── Context ───────────────────────────────────────────────────
const BlogRootContext = {
    on_register(state) {
        state.route ??= location.hash.slice(1) || "home";
    },

    on_push(state) {
        if (state.route) loadMarkdown(state.route);
    },

    on_event(event, state, _requests) {
        if (event.type !== "hashchange") return;
        state.route = event.hash;
        if (state.route) loadMarkdown(state.route);
    },
};

window.addEventListener("DOMContentLoaded", () => {
    register_context("blog", BlogRootContext);
});
