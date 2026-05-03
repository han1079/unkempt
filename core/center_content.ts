declare const marked: any;
declare const katex: any;

// TILE REGISTRATION AND CONTROL - MAYBE PUT THIS IN A SEPARATE FILE LATER
const TILE_REGISTRY: TileRegisterEntry = {};  
const _MOUNTED_TILES: Tile[] = [];

const _RENDERER = new marked.Renderer();
_RENDERER.code = ({ text, lang: header }: { text: string; header: string }) => {
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

    container.innerHTML = marked.parse(markdownText);

    let formatter = (text) => `${text}`; 
    for (const n of parsed_nodes) {
        if (n.node_type === "style") {
            formatter = text_style_to_css(n.raw);
        }
        container.innerHTML += formatter(marked.parse(n.raw));
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
