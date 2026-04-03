const renderer = new marked.Renderer();

renderer.code = (code, md_lang) => {
    if (md_lang === "latex") {
        return katex.renderToString(code, { displayMode: true });
    }
    if (md_lang === "svg") {
        return `<div class="svg-demo" data-src="./assets/${code.trim()}.svg"></div>`;
    }
    return `<pre><code>${code}</code></pre>`;
};

async function loadMarkdown(post) {
    const res = await fetch(`../markdown/${post}.md`);
    const markdownText = await res.text();
    const html = marked.parse(markdownText, { renderer });
    document.querySelector(".center-content").innerHTML = html;

    document.querySelectorAll(".svg-demo").forEach(async el => {
        const res = await fetch(el.dataset.src);
        const svg = await res.text();
        el.innerHTML = svg;
    });
}

function isBlogPage() {
    return document.querySelector(".center-content[data-blog]") !== null;
}

window.addEventListener("hashchange", () => {
    if (!isBlogPage()) return;
    const post = location.hash.slice(1);
    if (post) loadMarkdown(post);
});

window.addEventListener("DOMContentLoaded", () => {
    if (!isBlogPage()) return;
    const post = location.hash.slice(1);
    if (post) loadMarkdown(post);
});

