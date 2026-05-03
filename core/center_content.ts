declare const marked: any;
declare const katex: any;

// TILE REGISTRATION AND CONTROL - MAYBE PUT THIS IN A SEPARATE FILE LATER
const TILE_REGISTRY: TileRegisterEntry = {};  
const _MOUNTED_TILES: Tile[] = [];

const _RENDERER = new marked.Renderer();
_RENDERER.code = ({ text, lang: header }: { text: string; header: string }) => {
    if (!header) return `<pre><code>${text}</code></pre>`;

    console.log(header);
    const header_tokens = header.split("::");
    console.log(header_tokens);

    if (header === "latex") {
        return katex.renderToString(text, { displayMode: true });
    }
    if (header === "svg") {
        return `<div class="svg-demo" data-src="../assets/${text.trim()}.svg"></div>`;
    }
    if (header === "tile") {
        const parsed = parse_code_block(text);
        return `<div class="tile">${text}</div>`
    }
    if (header === "text-styling") {
        return `<div class="tile">${header}</div>`
    }
    return `<pre><code>${text}</code></pre>`;
};

marked.use({ renderer: _RENDERER });

async function loadMarkdown(post: string): Promise<void> {
    const res          = await fetch(`../markdown/${post}.md`);
    const markdownText = await res.text();
    const container    = document.querySelector<HTMLElement>(".center-content");
    if (!container) return;

    const tokens = marked.lexer(markdownText);
    const parsed_nodes = parse_lexer_output(tokens);

    console.log("about to parse")
    container.innerHTML = marked.parse(markdownText);

    for (const n of parsed_nodes) {
        container.innerHTML += marked.parse(n.raw);
    }
    //container.querySelectorAll<HTMLElement>(".svg-demo").forEach(async el => {
    //    const svg_res    = await fetch(el.dataset.src!);
    //    el.innerHTML     = await svg_res.text();
    //});
}

const CENTER_ROOT_SESSION: Session = {
    on_register(_state: GlobalState) {
        const container    = document.querySelector<HTMLElement>(".center-content");
        _state.route = container?.dataset.src ?? null;
    },
    on_push(_state: GlobalState) {
        if (_state.route) loadMarkdown(_state.route as string);
    },
    on_pop(_state: GlobalState) {
        for (tile of _MOUNTED_TILES) {
            tile.unmount();
        }
        _MOUNTED_TILES = [];
    },
    on_event(event: DispatchedEvent, _state: GlobalState, _requests: SessionRequest[]) {
        if (event.type !== "hashchange") return;
        _state.route = event.hash;
        if (_state.route) loadMarkdown(_state.route as string);
    },
    on_dt(_dt: number, _state: GlobalState, _requests: SessionRequest[]) {},
};

window.addEventListener("DOMContentLoaded", () => {
    register_session("markdown_render", CENTER_ROOT_SESSION);
});
