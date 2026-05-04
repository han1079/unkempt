# AST Test Document

This document is a test case for the document parser. Each section is annotated
with what the AST should produce. Read the prose, then check the console log output
matches the described structure.

---

## Section 1 — Default Style, Prose Only

No `text-styling` fence precedes this section. The parser should produce a default
`StyleNode` at the start of the document (full width, single column), followed by
a `TextNode` containing all prose up to the first fence.

**Expected AST:**
- `StyleNode` (default — single column, full width)
- `TextNode` (all prose above)

---

## Section 2 — First Style Change

The following `text-styling` fence defines a 3-column layout: two frozen margins
and a flex content column in the center. Everything after this fence until the next
`text-styling` inherits this layout.

```text-styling
<[15::Frozen]> <[Content::Flex]> <[15::Frozen]>
```

This prose appears after the style change. The parser should attach this `TextNode`
to the `StyleNode` above. The section div generated from this should have
`grid-template-columns: 15% 1fr 15%`.

**Expected AST:**
- `StyleNode` (3 columns: 15% frozen, 1fr flex, 15% frozen)
- `TextNode` (this prose)

---

## Section 3 — First Tile

Still inside the same style section. A single full-width tile with no content
configured. The parser should produce a `TileNode` with `name: null`,
`preset: null`, `content: null`, inheriting the current `StyleNode`.

```tile
```

**Expected AST (continuing section 2's StyleNode):**
- `TileNode` (name: null, preset: null, content: null, config: "")

---

## Section 4 — Named Tile

A tile with a name registered. The parser should store this in `named_tiles`
under the key `"demo_btn"` during pass 1.

```tile::demo_btn
```

**Expected AST:**
- `TileNode` (name: "demo_btn", preset: null, content: null)
- `named_tiles["demo_btn"]` should point to this node after pass 1

---

## Section 5 — Named Tile With Widget

A tile with name, left alignment preset, and a button content.

```tile::demo_btn_2::Left::button
```

**Expected AST:**
- `TileNode` (name: "demo_btn_2", alignment: Left, content: "button")

---

## Section 6 — Left Content, Flex Middle, Frozen Right

Content column on the left takes remaining space, a flex buffer in the middle,
and a frozen right margin. Tests asymmetric layouts where content is left-anchored.

```text-styling
<[Content::Flex]> <[15::Flex]> <[15::Frozen]>
```

This prose should sit in the content column on the left. The flex middle column
acts as a gutter, and the frozen right column is a fixed margin.

**Expected AST:**
- `StyleNode` (3 columns: 1fr content, 15% flex, 15% frozen)
- `TextNode` (this prose)

---

## Section 7 — Tile Row With Two Buttons

Two buttons side by side inside the 3-column section. The tile layout uses
`<[-]>` as row separator (only one row here). Both buttons should fit inside the 
`<[Content]>` slot.
The tile is anonymous (no name).

```tile
<[button_a]> <[button_b]>
<[=]>
button_a: { content: button, label: "Left" }
button_b: { content: button, label: "Right" }
```

**Expected AST:**
- `TileNode` (name: null, layout: 1 row × 2 cells, config has button_a and button_b)
- `RowNode[0]`: `CellNode` ref="button_a", `CellNode` ref="button_b"
- `named_tiles["button_a"]` and `named_tiles["button_b"]` populated from config

---

## Section 8 — Tile Row With Mixed Content

Three columns: a katex formula, an empty cell, and a button. The `<[]>` empty
cell should produce an empty mount div.

```tile
<[formula]> <[]> <[action_btn]>
<[=]>
formula:    { content: katex,  content: "E = mc^2" }
action_btn: { content: button, label: "Compute" }
```

**Expected AST:**
- `TileNode` (1 row × 3 cells)
- `CellNode` ref="formula", `CellNode` ref=null (empty), `CellNode` ref="action_btn"

---

## Section 9 — Multi-Row Tile

Two rows separated by `<[-]>`. First row has 3 buttons, second row has 2.
The grid for each row is inferred from cell count — 3-column then 2-column.

```tile
<[btn_a]> <[btn_b]> <[btn_c]>
<[-]>
<[btn_d]> <[btn_e]>
<[=]>
btn_a: { content: button, label: "A" }
btn_b: { content: button, label: "B" }
btn_c: { content: button, label: "C" }
btn_d: { content: button, label: "D" }
btn_e: { content: button, label: "E" }
```

**Expected AST:**
- `TileNode` (2 rows)
- `RowNode[0]`: 3 cells (btn_a, btn_b, btn_c)
- `RowNode[1]`: 2 cells (btn_d, btn_e)

---

## Section 10 — Self Reference

A tile that uses `<[self]>` to place its own content block inside the layout.
The content below `<[=]>` fills the self slot.

```tile::self_demo
<[self]>
<[=]>
content: button
label: "I am self"
```

**Expected AST:**
- `TileNode` (name: "self_demo", 1 row × 1 cell, is_self: true)
- Config section parsed as content config for the self slot

---

## Section 11 — Forward Reference

This tile references `demo_btn` which was defined back in Section 4.
Pass 2 should resolve the reference by looking up `named_tiles["demo_btn"]`.

```tile
<[demo_btn]>
```

**Expected AST:**
- `TileNode` (1 row × 1 cell)
- `CellNode` ref="demo_btn" — resolved in pass 2 to the TileNode from Section 4

---

## Section 12 — Style Reset to Full Width

Return to single full-width column. Any tiles after this should fill the
entire center content width.

```text-styling
<[Content::Flex]>
```

This prose is now back to full width. The section div should have
`grid-template-columns: 1fr`.

**Expected AST:**
- `StyleNode` (1 column: 1fr flex)
- `TextNode` (this prose)

---

## Section 13 — Full Width Button

A single full-width button to close out the document.

```tile::|::|::button
```

**Expected AST:**
- `TileNode` (name: null, preset: null, content: "button")

---

## Section 14 - Torture Test 

A single tile with subtiles that yields overlapping tiles.

```tile::overlapping::Left::button
<[self]>       <[vertical::self]>   <[self::rectangle]>         <[rectangle]>
<===========================================================================>
<[self]>       <[vertical::self]>   <[self::rectangle]>         <[rectangle]>
<===========================================================================>
<[self]>       <[     self     ]>   <[self::rectangle]>         <[rectangle]>
<===========================================================================>
<[horizontal]> <[  horizontal  ]>   <[horizontal::rectangle]>   <[rectangle]>
content: {app: button, label: self};
```

## Full Document Expected AST Summary

```
DocumentAST {
  nodes: [
    StyleNode  (default)
    TextNode   (section 1 prose)
    StyleNode  (3-col: 15% 1fr 15%)
    TextNode   (section 2 prose)
    TileNode   (empty)
    TileNode   (name: demo_btn)
    TileNode   (name: demo_btn_2, content: button)
    StyleNode  (4-col: 20% 1fr 1fr 20%)
    TextNode   (section 6 prose)
    TileNode   (1×2: button_a, button_b)
    TileNode   (1×3: formula, empty, action_btn)
    TileNode   (2 rows: 3+2 buttons)
    TileNode   (name: self_demo, self slot)
    TileNode   (1×1: forward ref demo_btn)
    StyleNode  (1-col: 1fr)
    TextNode   (section 12 prose)
    TileNode   (content: button)
  ]
  named_tiles: {
    demo_btn:    TileNode (section 4)
    demo_btn_2:  TileNode (section 5)
    button_a:    TileNode (from section 7 config)
    button_b:    TileNode (from section 7 config)
    formula:     TileNode (from section 8 config)
    action_btn:  TileNode (from section 8 config)
    btn_a..e:    TileNode (from section 9 config)
    self_demo:   TileNode (section 10)
  }
}
```
