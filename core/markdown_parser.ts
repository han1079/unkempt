
const CellNodePlaceholder: CellNode = {};
const RowNodePlaceholder: RowNode = {};
const TileNodePlaceholder: TileNode = {};
const DocumentASTPlaceholder: DocumentAST = {};

let LexerOutput: Any[] = [];
let RawLexerOutput: Any[] = [];

const INCLUDE_STYLE_CODE = true;
const GENERATE_CODE_TOO = true;

const SUPPORTED_PRESETS: string[] = [
    "default", 
    "left",
    "center",  
    "right", 
"no-margin"
];

function compile_markdown(text: string) : string {
    const ast = build_ast(marked.lexer(text));

    let formatter = (text) => `${text}`; 
    let compiled_html = "";


    for (const node of ast) {
        if (node.kind === 'style') {
            formatter = node.formatter;
            if (!INCLUDE_STYLE_CODE) {
                continue;
            }
        }

        compiled_html += formatter(compile_node(node));

    }

    return compiled_html;
}

function compile_node(node: (TileNode | StyleNode | TextNode | GenericCodeNode)) {
    if (node.kind.includes("tile")) {
        return compile_tile(node);
    } else if (node.kind.includes("style")) {
        return compile_style(node);
    } else if (node.kind.includes("text")) {
        return marked.parse(node.raw);
    } else if (node.kind.includes("code")) {
        return marked.parse(node.raw);
    }
}

function compile_tile(node) {
    console.log(node.content);
    console.log(node.content?.label)


    if (node.content?.app === "button") {
        return `<button class=${node.name}>${node.content.label}</button>`
    } else if (node.content?.app === "text") {
        if (node.content?.text) {
            return marked.parse(node.content?.text);
        } else {
            return marked.parse("")
        }
    } else if (node.content?.app === "latex") {
        let txt = "";
        if (node.content?.text) {
            txt = node.content.text.replace(/\n/g,"");
        }
        return katex.renderToString(txt, {throwOnError: true});
    } else {
        return marked.parse(node.raw);
    }
}

function compile_style(node) {
    return node.content.raw;
}

function build_ast(tokens: any[]) {

    // First pass - just gather all nodes and perform metadata stuffing and type conversion.

    const lexer_nodes = [];
    let lex_buffer = [];
    const raw_nodes = [];
    let raw_text = "";
    for (const t of tokens){
        if (t.type != "code") {
            // If it's just text - concat to current string buffer.
            lex_buffer.push(t);
            raw_text += t.raw;
        } else {

            if (lex_buffer.length !== 0) {
                // We've encountered a code node. Flush accumulated text 
                // into a text node. Also flush the accumulated lexer outputs
                // for debug comparison.
                lexer_nodes.push({node_type: "text", "lex": lex_buffer});
                raw_nodes.push(generate_text_node(raw_text));
                lex_buffer = []
                raw_text = "";
            }
            
            if (t.lang.includes("tile")) {
                // We've encountered a tile. Hand off to tile generator
                if (GENERATE_CODE_TOO) {
                    raw_nodes.push(generate_code_node(t.raw));
                }
                lexer_nodes.push({node_type: "tile", "lex":t});
                raw_nodes.push(generate_tile_node(t.raw, t.text, t.lang));
            } else if (t.lang.includes("text-styling")) {
                // We've encountered a style block. Hand off to style generator
                if (GENERATE_CODE_TOO) {
                    raw_nodes.push(generate_code_node(t.raw));
                }
                lexer_nodes.push({node_type: "style", "lex":t});
                raw_nodes.push(generate_style_node(t.raw));
            } else {
                // We've encountered some random code block. Return generic code formatting.
                lexer_nodes.push({node_type: "other_code", "lex":t});
                raw_nodes.push(generate_code_node(t.raw));
            }
        }
    }

    LexerOutput = lexer_nodes;
    RawLexerOutput = raw_nodes;
    console.log(LexerOutput);
    console.log(RawLexerOutput);

    return raw_nodes;
}


function strip_custom_brackets(tokens: string[]) {return [...tokens.matchAll(/<\[([^\]]*)\]>/g).map(m => m[1])];}

function generate_style_node(raw: string): StyleNode | null {
    // If it's not a style block, immediately return.
    if (!raw.includes("text-styling")) {
        console.log("Not text styling.")
        return null;
    }
    
    const raw_css_first_wrap = ['<div style="display: grid; grid-template-columns ', '>\\n'];
    const raw_css_second_wrap = ['<div style="grid-column: ', ';">'];
    const raw_css_content_suffix = ['</div>\\n</div>'];
    const tokens = raw.split("\n");
    
    const parsed_tokens = [];

    for (const t of tokens) {
        if (t.includes("<[") && t.includes("]>")) {
            parsed_tokens.push(t);
        }
    }

    if (parsed_tokens.length !== 1) {
        throw new Error("Style code is not formatted properly.");
    }

    const tok = strip_custom_brackets(parsed_tokens[0]);

    let stringcmpl = [];
    let content_idx = 0;
    let i = 0;

    for (const expr of tok) {
        if (!expr.includes("Content")) {
            let split_strings = expr.split("::");
            if (split_strings[1] === "Frozen") {
                stringcmpl.push(split_strings[0]+"%");
            } else if (split_strings[1] === "Flex") {
                stringcmpl.push("minmax(0," + split_strings[0]+"%)");
            } else {
                throw new Error("Style code has incorrect names.");
            }
        } else {
            stringcmpl.push("1fr");
            content_idx = i + 1;
        }
        i++
    }


    const grid_layout_string = stringcmpl.join(" ");
    const css_lines : CSSRecord = {"display": "grid", "grid-template-columns": `${grid_layout_string}`, "grid-column": `${content_idx}`};
    const string_returner = (text) => `<div style="display: grid; grid-template-columns: ${grid_layout_string};">\n<div style="grid-column: ${content_idx};">${text}</div>\n</div>`;

    const style_node : StyleNode = {
        kind: "style",
        content: {
            preset: null,
            raw: raw,
            css: css_lines
        },
        formatter: string_returner
    };
    return style_node;
}

function generate_text_node(raw: string): TextNode {
    let _node : TextNode = {
        kind: "text",
        raw: raw
    };
    return _node;
}

function generate_code_node(raw: string): GenericCodeNode {
    let _node : GenericCodeNode = {
        kind: "code",
        raw: `<pre><code>${raw}</code></pre>`
    };
    return _node;
}
function generate_tile_node(raw: string, text: string, lang: string): TileNode {
    const lang_tokens = lang.split("::");

    console.assert(lang_tokens[0] === "tile");
    console.log(`Detected Lang Tokens: ${lang_tokens}`)

    //TODO: Eliminate whitespace
    //TODO: Eventually settle on the names of the arguments parsed.

    let _name = lang_tokens[1] ?? "unnamed";
    let _alignment = SUPPORTED_PRESETS.includes(lang_tokens[2] ?? null) ? lang_tokens[2] : "center";
    let _subtile = false;
    let _vertical_percentage = "default";

    let _content = {app: "text", text: "No-Op"};
    if (lang_tokens[3] === "subtile") {
        _subtile = true; 
    } else {
        let _x = lang_tokens[3] ?? null;
        if (_x) {
            _content = {app: `${_x}`, text: "No-Op"};
        } else {
            _content = {app: "text", text: "No-Op"};
        }
    }

    //TODO: Stubbed for now. 
    let _other_nodes = null;

    const body = text;
    console.log(`Code body: ${body}`);

    if (body.includes("name:")) {
        _name = parse_arg_from_body("name",body);
    }

    if (body.includes("alignment:")) {
        _alignment = parse_arg_from_body("alignment",body);
    }

    if (body.includes("subtile")) {
        _subtile = parse_arg_from_body("subtile", body);
    }

    if (body.includes("content")) {
        let _content_grabbed = parse_arg_from_body("content", body);
        console.log(`Content during node gen: ${_content_grabbed.app}`)
        if (_content_grabbed.app) {
            _content.app = _content_grabbed.app
        }

        if (_content_grabbed.label) {
            _content.label = _content_grabbed.label
        }

        if (_content_grabbed.text) {
            _content.text = _content_grabbed.text
        }
    }
    if (body.includes("vertical_percentage")) {
        _vertical_percentage = parse_arg_from_body("vertical_percentage", body);
    }

    console.log(`About to populate content: ${_content.label}`)
    let _tile: TileNode = {
        kind: "tile",
        name: _name,
        alignment: _alignment,
        vertical_percentage: _vertical_percentage,
        content: _content,
        layout_ref: null,
        subtile: _subtile,
        raw: raw
    } 
    console.log(_tile)

    return _tile;
}

function parse_arg_from_body(key: string, body: string): (string | Record<string, string> | Record<string, number> | null) {
    // Assuming that each argument begins with a newline and is delimited by a semicolon at the very least
    // Fragilities: multi-line arguments include newlines which may make parsing annoying. Putting multiple
    // args in one line also makes this fragile.
    // TODO: Detect lack of semicolon and try to salvage regardless if it's inline.
    // This should rebuild the body with the correct syntax. Probably separate this functionality
    // out as a separate sanitization step. Crash out otherwise.
    

    const lines = body.split("\n");

    // This part needs a lot of work. It's basically paper mache quality code right now.
    // TODO: properly design the logic, parsing, and error handling for grabbing arguments from the body.
    let val = null;
    for (const line of lines) {
        const idx = line.indexOf(":")
        const k = line.slice(0,idx).trim();
        if (k === key){
            val = line.slice(idx+1).trim().replace(/\\n/g,"");
            console.log(val);
            if (val.slice(val.length-1,val.length) === ";") {
                val = val.slice(0, -1);
            }
            console.log(val);
            if (val.slice(0,1) === "{" && val.slice(val.length-1,val.length) === "}") {
                val = val.slice(1,-1);
            }
            console.log(val);
            break;
        }
    }

    if (val) {
        let v = null;
        let config = {}
        if (val.split(",")[0] !== ""){
            // Multiple Values in config
            let value_pairs = val.split(",");
            console.log(value_pairs)
            for (const v of value_pairs){
                let args = v.split(":");
                console.log(args);

                console.assert(args[0] !== '');

                let _args = args.map(a => a.trim());
                console.log(_args.length);

                config[_args[0]] = _args[1];
                    
            }
        } else {
            // Single value
            v = val.split(":");
            console.assert(v[0] !== '');
            let _args = v.map(a => a.trim());
            console.log(_args.length);

            if (!_args[1]) {
                // Literally just "content: <some string>"
                return _args[0];
            } else {
                config[_args[0]] = _args[1];
            }

        }
        return config;
    } else {
        return null;
    }
}

function tile_block_to_node(raw: string) : TileNode {
    const _tile : TileNode = {};
    const _rownode : RowNode[] = [];

    // Guards Here 
    
    // Split on newlines 
    
    // Sort into grid configuration section vs content configuration section 
    
    // Grid Configuration 

    // 1. Strip out all trailing and leading "<[=]>" symbols.
    // 2. 
    return _tile;
}
