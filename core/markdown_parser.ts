
const CellNodePlaceholder: CellNode = {};
const RowNodePlaceholder: RowNode = {};
const TileNodePlaceholder: TileNode = {};
const TileASTPlaceholder: TileAST = {};

let LexerOutput: Any[] = [];
let RawLexerOutput: Any[] = [];

function parse_lexer_output(tokens: any[]) {
    console.log(tokens);
    const lexer_nodes = [];
    let lex_buffer = [];
    const raw_nodes = [];
    let raw_text = "";
    for (const t of tokens){
        if (t.type != "code") {
            lex_buffer.push(t);
            raw_text += t.raw;
        } else {
            if (lex_buffer.length !== 0) {
                lexer_nodes.push({node_type: "text", "lex": lex_buffer});
                raw_nodes.push({node_type: "text", "raw": raw_text});
                lex_buffer = []
                raw_text = "";
            }
            
            if (t.lang.includes("tile")) {
                lexer_nodes.push({node_type: "tile", "lex":t});
                raw_nodes.push({node_type: "tile", "raw":t.raw});
            } else if (t.lang.includes("text-styling")) {
                lexer_nodes.push({node_type: "style", "lex":t});
                raw_nodes.push({node_type: "style", "raw":t.raw});
            } else {
                lexer_nodes.push({node_type: "other_code", "lex":t});
                raw_nodes.push({node_type: "other_code", "raw":t.raw});
            }
        }
    }

    LexerOutput = lexer_nodes;
    RawLexerOutput = raw_nodes;
    console.log(LexerOutput);
    console.log(RawLexerOutput);

    return raw_nodes;
}

function strip_custom_brackets(tokens: string[]) {

    return [...tokens.matchAll(/<\[([^\]]*)\]>/g).map(m => m[1])];
}

function text_style_to_css(raw: string) {
    // If it's not a style block, immediately return.
    if (!raw.includes("text-styling")) {
        return;
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
        throw new Error("Style code is not formatted properly.")
    }

    const tok = strip_custom_brackets(parsed_tokens[0]);

    const missing_len = (3 - tok.length);
    for (let i = 0; i < missing_len; i++) {
        tok.push("");
    }

    let stringcmpl = [];
    let content_idx = 0;
    let i = 0;

    console.log(tok);
    for (const expr of tok) {
        console.log(expr);
        if (expr == "") {
            i++;
            continue;
        }
        if (!expr.includes("Content")) {
            let split_strings = expr.split("::");
            console.log(split_strings[1]);
            if (split_strings[1] === "Frozen") {
                stringcmpl.push(split_strings[0]+"%");
            } else if (split_strings[1] === "Flex") {
                stringcmpl.push("minmax(0," + split_strings[0]+"%)");
            } else if {
                throw new Error("Style code has incorrect names.")
            }
        } else {
            stringcmpl.push("1fr");
            content_idx = i;
        }
        i++
    }


    const grid_layout_string = stringcmpl.join(" ");
    const string_returner = (text) => `<div style="display: grid; grid-template-columns: ${grid_layout_string};">\n<div style="grid-column: ${content_idx};">${text}</div>\n</div>`;

    console.log(string_returner("asdf"));
    return string_returner;
}
