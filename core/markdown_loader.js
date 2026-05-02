// ── Marked renderer ───────────────────────────────────────────
const _RENDERER = new marked.Renderer();

_RENDERER.code = ({ text, lang }) => {
    if (lang === "latex") {
        return katex.renderToString(text, { displayMode: true });
    }
    if (lang === "svg") {
        return `<div class="svg-demo" data-src="../assets/${text.trim()}.svg"></div>`;
    }
    return `<pre><code>${text}</code></pre>`;
};

marked.use({ renderer: _RENDERER });

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

// ── Session ───────────────────────────────────────────────────
const BLOG_ROOT_SESSION = {
    on_register(_state) {
        _state.route ??= location.hash.slice(1) || "home";
    },

    on_push(_state) {
        if (_state.route) loadMarkdown(_state.route);
    },

    on_pop(_state) {},

    on_event(event, _state, _requests) {
        if (event.type !== "hashchange") return;
        _state.route = event.hash;
        if (_state.route) loadMarkdown(_state.route);
    },

    on_dt(_dt, _state, _requests) {},
};

window.addEventListener("DOMContentLoaded", () => {
    register_session("blog", BLOG_ROOT_SESSION);
});
