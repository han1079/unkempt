
const CellNodePlaceholder: CellNode = {};
const RowNodePlaceholder: RowNode = {};
const TileNodePlaceholder: TileNode = {};
const TileASTPlaceholder: TileAST = {};

let LexerOutput: Any[] = [];
let RawLexerOutput: Any[] = [];
function parse_code_block(text: string) {
    console.log(text);
}

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
