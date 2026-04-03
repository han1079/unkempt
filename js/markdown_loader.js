const renderer = new marked.Renderer();

renderer.code = ({ text, lang }) => {
    if (lang === "latex") {
        return katex.renderToString(text, { displayMode: true });
    }
    if (lang === "svg") {
        return `<div class="svg-demo" data-src="../assets/${text.trim()}.svg"></div>`;
    }
    return `<pre><code>${text}</code></pre>`;
};

marked.use({ renderer });

async function loadMarkdown(post) {
    const res = await fetch(`../markdown/${post}.md`);
    const markdownText = await res.text();
    const html = marked.parse(markdownText);
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

