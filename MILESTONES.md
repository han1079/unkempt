# Tile Parser — Architecture & Milestones

## Current State (2026-05-03)

### What works
- `build_ast`: lexer tokens → flat array of `TextNode | StyleNode | TileNode | GenericCodeNode`
- `generate_style_node`: parses `text-styling` fence → CSS grid formatter lambda
- `compile_markdown`: walks AST, applies formatter per node, returns HTML string
- `generate_text_node`, `generate_code_node`: trivial wrappers, correct

### Known bugs to fix before moving forward
[x] `compile_markdown` line 21: `n.formatter` → `node.formatter`
[x] `generate_style_node` lines 167-168: `css_lines` uses `grid_layout_string` before it's defined — swap the two lines
[x] `build_ast` line 75: `generate_text_node(t.raw)` passes the *code* token's raw instead of the accumulated `raw_text` buffer
[x] `generate_style_node`: `content_idx` is 0-based, CSS `grid-column` is 1-based — add 1 on assignment
[x] `generate_style_node`: padding `tok` to length 3 is wrong — remove that block, handle arbitrary column count
6. `TileNode.layout_ref` is typed `RowNode[]` but initialized to `null` in `generate_tile_node` — either change type to `RowNode[] | null` or init to `[]`

---

## Milestone 1 — Buttons on a Grid

**Goal:** Render a tile fence as a visible HTML element with correct grid placement.

**What needs to happen:**
- `generate_tile_node` must parse the lang string (`tile::name::preset::widget`) into fields
- `compile_tile` must emit an HTML div with the right classes/data attributes for the widget system to pick up
- A stub button widget must exist in `TILE_REGISTRY` that renders a visible element on `mount()`

**Pseudocode — `generate_tile_node(raw, lang)`:**
```
lang_tokens = lang.split("::")          // ["tile", name|"", preset|"", widget|""]
name   = lang_tokens[1] || null         // "" → null
preset = lang_tokens[2] || null
widget = lang_tokens[3] || null

body = raw (everything between the backtick fences, stripped of the lang line)

// Check if body overrides name
if body contains "name:" key:
    name = parse_name_from_body(body)

// Check if body sets subtile
subtile = lang_tokens includes "subtile" OR body contains "subtile: true"

return TileNode {
    kind: "tile", name, preset, widget,
    alignment: null,      // filled by Milestone 3
    layout_ref: [],       // filled by Milestone 2
    subtile,
    raw: raw
}
```

**Pseudocode — `compile_tile(node)`:**
```
if node.subtile: return ""   // subtiles don't render inline

widget = node.widget ?? "default"
name   = node.name   ?? ""

return `<div class="tile-mount" data-widget="${widget}" data-name="${name}"></div>`
```

**Watch out for:**
- The `lang` string is on the fence opener line, not in `raw`. `raw` in the marked token includes the backtick lines. You need `t.lang` from the lexer token, not from `raw`. Thread `lang` into `generate_tile_node` as a second argument.
- `|` as null placeholder in `tile::|::|::button` — the split gives `""`, treat `""` and `"|"` both as null.

---

## Milestone 2 — Tile Body Parsing (Layout + Config)

**Goal:** Parse the interior of a tile fence into `RowNode[]` (layout grid) and a config map.

**Tile body structure:**
```
<layout rows>       ← zero or more, each is cells separated by spaces
<[=]>               ← separator (any /^\s*<[-=]+>\s*$/ pattern)
<config lines>      ← key: value pairs
```

**Row delimiter regex:** `/^\s*<[-=]+>\s*$/` — matches `<[=]>`, `<===>`, `<->`, `<[---------==]>` etc.

**Pseudocode — `tile_block_to_node(raw, lang)`:**
```
// Step 1: strip fence backtick lines from raw if present
body = strip_fence_lines(raw)

// Step 2: split into layout section and config section on <[=]> separator
parts = body.split(LAYOUT_CONFIG_SEPARATOR_REGEX)   // splits on <[=]>
layout_raw = parts[0]
config_raw = parts[1] ?? ""

// Step 3: parse layout rows
rows = []
for line in layout_raw.split("\n"):
    line = line.trim()
    if line is empty: continue
    if line matches ROW_SEPARATOR_REGEX:   // <[-]>, <--->, etc.
        rows.push(current_row); current_row = new RowNode
        continue
    cells = strip_custom_brackets(line)    // extracts ["btn_a", "btn_b"] etc.
    for cell_name in cells:
        layers = cell_name.split("::")     // <[a::b]> → ["a", "b"]
        is_self = layers.includes("self")
        is_empty = cell_name.trim() === ""
        current_row.cells.push(CellNode { names: is_empty ? null : layers, is_self })
    rows.push(current_row) after last line

// Step 4: parse config section
config = parse_config(config_raw)

// Step 5: lint the grid
lint_result = lint_grid(rows)     // see Milestone 5

return TileNode { ..., layout_ref: rows, config }
```

**Pseudocode — `parse_config(config_raw)`:**
```
result = {}
for line in config_raw.split("\n"):
    line = line.trim().replace(/;$/, "")   // strip trailing semicolons
    if line is empty: continue
    [key, value_raw] = line.split(":")     // first colon only
    key = key.trim()
    value = parse_value(value_raw.trim())
    // normalize: "label" and "text" are the same key
    if key === "text": key = "label"
    result[key] = value
return result
```

**Watch out for:**
- The layout/config separator `<[=]>` and the row separator `<[-]>` are visually similar but different. The layout/config separator appears *once* to split the block; row separators appear between rows. Make the regexes distinct.
- `strip_custom_brackets` currently takes a string and returns all `<[...]>` contents. It strips the `<[` and `]>` wrappers — make sure whitespace inside brackets is trimmed: `<[  self  ]>` → `"self"`.
- Empty cell `<[]>` → `strip_custom_brackets` returns `""` → `names: null`. Handle this before the `split("::")` step.

---

## Milestone 3 — Named Tiles and Forward References

**Goal:** Pass 1 populates `DocumentAST.named_tiles`. Pass 2 resolves `CellNode.names` references against it.

**Pseudocode — pass 1 (already inside `build_ast`, just needs wiring):**
```
named_tiles = {}
for node in raw_nodes:
    if node.kind === "tile" and node.name !== null:
        named_tiles[node.name] = node
    // also register tiles defined in config sections:
    for key in node.config:
        if config value defines a widget:
            named_tiles[key] = synthesize_tile_node_from_config(key, value)
```

**Pseudocode — pass 2 (new function `resolve_references`):**
```
for node in ast.nodes:
    if node.kind !== "tile": continue
    for row in node.layout_ref:
        for cell in row.cells:
            if cell.names === null: continue
            cell.resolved = cell.names.map(name => named_tiles[name] ?? null)
            // null means forward reference couldn't resolve → lint warning
```

**Watch out for:**
- Tiles defined in config bodies (e.g. `button_a: { widget: button, label: "Left" }`) need to be registered in `named_tiles` during pass 1, not just after the parent tile is fully parsed.
- A tile referencing itself by name is valid (`<[self_demo]>` inside `tile::self_demo`) — don't block it, the `is_self` flag handles it.
- Circular references (tile A references tile B which references tile A) — flag as a lint error, don't recurse.

---

## Milestone 4 — Subtiles and Visibility

**Goal:** Tiles with `subtile: true` don't render inline; they exist only in `named_tiles` for reference.

**Changes needed:**
- `generate_tile_node`: detect subtile from lang tokens (`lang_tokens.includes("subtile")`) or body (`config.subtile === true`)
- `compile_tile`: return `""` if `node.subtile`
- `compile_markdown`: still add subtiles to `named_tiles` in pass 1, just skip HTML output

**Watch out for:**
- A subtile referenced in another tile's layout *does* get rendered — inside the referencing tile's HTML, not inline. `compile_tile` only suppresses inline rendering; tile mounting handles the actual render.
- `tile::|::|::subtile` — `subtile` is in the widget slot (index 3), not a separate flag. Detect it there too.

---

## Milestone 5 — Grid Linting and Rectangle Validation

**Goal:** Validate that a tile's layout grid can be rendered as a valid CSS grid. Bounded 5×5 max.

**The problem:** Given a grid of cells (rows may have different lengths), find the largest contiguous rectangular sub-grid. If the full grid isn't rectangular, warn and use the best rectangle found.

**Definitions:**
- Grid is *valid* if all rows have the same cell count.
- If invalid, find the largest area rectangle where all cells in the bounding box are filled (no holes).
- Tie-break: smallest `|width - height|` (most square). Second tie-break: first in parse order.

**Pseudocode — `lint_grid(rows)`:**
```
// Build occupancy matrix (5x5 max, truncate silently)
W = min(max(row.cells.length for row in rows), 5)
H = min(rows.length, 5)
occupied[H][W] = true for every cell present, false for missing

// Find largest filled rectangle (classic histogram approach, O(H*W))
best = { area: 0, r0, c0, r1, c1 }
for each row r:
    height[c] = occupied[r][c] ? height[c]+1 : 0   // histogram heights
    scan histogram for largest rectangle:
        use monotonic stack → O(W) per row

return {
    valid: (best.area === H*W),
    rect: { r0, c0, r1, c1 },
    warnings: ["Grid is not rectangular, using largest valid sub-rectangle"] if !valid
}
```

**Watch out for:**
- Cells beyond column 5 or row 5 are *silently truncated* — add a warning but don't throw.
- An empty layout (no cells) is valid and means the tile fills its column naturally.
- The histogram / monotonic stack approach is standard but the boundary conditions are fiddly. Validate with the Python test cases below before porting.

---

## Milestone 6 — Overlap and Layering

**Goal:** `<[a::b::c]>` means three tiles stacked at this grid cell, rendered front-to-back by parse order (first = topmost).

**Changes needed:**
- `CellNode.names: string[]` already supports multiple names — this is already the right shape.
- `compile_tile`: for a cell with N names, emit N divs at the same grid position with `z-index` 0..N-1 in reverse order, all `position: absolute` inside a `position: relative` wrapper.
- Layer count detection: `max(cell.names.length for all cells in all rows)` — if > 1, switch that cell to stacked rendering.

**Watch out for:**
- The parent tile div needs `position: relative` for absolute children to work.
- Mangled rectangle detection still applies — the largest-rectangle algorithm should treat a cell as "occupied" regardless of how many layers it has.

---

## Milestone 7 — Torture Test

Features exercised:
- Subtile registration and inline suppression
- Name override from body (`name: hidden_single_button`)
- Flexible/garbage-tolerant delimiters (`<[]=>`, `<[-----------==]>`)
- Multiple `self{N}` slots (extend `is_self` to `self_index: number | null`)
- Forward references between named tiles
- Overlap rendering with z-ordering
- Rectangle detection for irregular grids
- All of the above in a single document

---

## Python Grid Algorithm Prototype

Port `lint_grid` to Python first. Test cases follow.

### Setup
```python
def lint_grid(rows: list[list[bool]]) -> dict:
    """
    rows: list of lists of bool (True = occupied)
    returns: { valid, rect: (r0,c0,r1,c1), area, warnings }
    Max 5x5, truncate silently.
    """
    H = min(len(rows), 5)
    W = min(max((len(r) for r in rows), default=0), 5)
    # pad rows to uniform width
    occ = [[( c < len(rows[r]) and rows[r][c]) for c in range(W)] for r in range(H)]
    # histogram + monotonic stack for largest rectangle
    ...
```

### Test Cases

**Case 1 — Valid 3×2 rectangle (all filled)**
```
input:
  [ [T, T, T],
    [T, T, T] ]
expected: valid=True, rect=(0,0,1,2), area=6
```

**Case 2 — Ragged rows (3, 2, 3)**
```
input:
  [ [T, T, T],
    [T, T],
    [T, T, T] ]
occupancy (padded):
  [ [T, T, T],
    [T, T, F],
    [T, T, T] ]
expected: valid=False, rect=(0,0,2,1), area=6  (3 rows × 2 cols)
warnings: ["Grid is not rectangular, using largest valid sub-rectangle"]
```

**Case 3 — Torture test irregular grid (from torture_test.md)**
```
input (the rectangle tile):
  row 0: [single_button]                         → 1 cell
  row 1: [hidden_single_button, self]            → 2 cells
  row 2: [self, self, single_button]             → 3 cells
occupancy:
  [ [T, F, F],
    [T, T, F],
    [T, T, T] ]
expected: valid=False
largest rect: (0,0,2,0) area=3 (3 rows × 1 col)  OR  (1,0,2,1) area=4 (2 rows × 2 cols)
tie-break: area=4 wins → rect=(1,0,2,1)
```

**Case 4 — 5×5 full (boundary test)**
```
input: 5 rows × 5 cols, all True
expected: valid=True, rect=(0,0,4,4), area=25
```

**Case 5 — 6×6 input (truncation test)**
```
input: 6 rows × 6 cols, all True
expected: valid=True, rect=(0,0,4,4), area=25
warnings: ["Grid truncated to 5×5"]
```

**Case 6 — Single cell**
```
input: [ [T] ]
expected: valid=True, rect=(0,0,0,0), area=1
```

**Case 7 — Empty grid**
```
input: []
expected: valid=True, rect=None, area=0
```

**Case 8 — Single hole in center**
```
input:
  [ [T, T, T],
    [T, F, T],
    [T, T, T] ]
expected: valid=False
largest rect: any 3×1 or 1×3 strip has area=3; any 2×2 has area=4
→ rect could be (0,0,1,1) or (0,1,1,2) or (1,0,2,1) or (1,1,2,2), area=4
tie-break: most square (all are 2×2, tie) → first in parse order → (0,0,1,1)
```

**Case 9 — L-shape**
```
input:
  [ [T, T],
    [T, F] ]
occupancy:
  [ [T, T],
    [T, F] ]
expected: valid=False
candidates: (0,0,0,1) area=2, (0,0,1,0) area=2
tie on area AND squareness (both 1×2 or 2×1) → first parsed → (0,0,0,1)
```

**Case 10 — Overlapping torture test grid (5×4)**
```
input (the overlapping tile):
  row 0: [self, vertical::self, self::rectangle, rectangle]  → 4 cells
  row 1: [self, vertical::self, self::rectangle, rectangle]  → 4 cells
  row 2: [self, self,           self::rectangle, rectangle]  → 4 cells
  row 3: [self::horizontal, horizontal, horizontal::rectangle::vertical, rectangle] → 4 cells
  row 4: [self, <empty>,    vertical]                        → 3 cells
occupancy:
  [ [T, T, T, T],
    [T, T, T, T],
    [T, T, T, T],
    [T, T, T, T],
    [T, F, T, F] ]    ← row 4 has 3 cells, padded to 4 with F; but col 3 also absent
expected: valid=False
largest rect: (0,0,3,3) area=16
```
