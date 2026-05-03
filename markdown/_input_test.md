### INPUT TEST FILE

1. There needs to be 5 sections. This generates "isolation bars", "flex bars", and content section.
2. Collapse gets collapsed first until zero. Then Flex gets collapsed to zero. Then Frozen.
3. The number is a percentage. sum of numbers must be lower than 100.
```text-styling
<[10::Frozen]> <[10::Flex]> <[Content::Flex]> <[10::Flex]> <[10:Frozen]>
```

Tile is a generic container. It is a rectangle that stretches to the full width of the center content.

The **content** of the tile is parsed by looking for the variable "content"

#### Basic Tile Demo
```tile 
name: {my_name};
alignment: {start: 20, end: 80};
content: {text: "my_text"};
```

This can be short circuited using the "::" infix. The syntax is as follows

tile::[name]::[alignment_preset]::[content]. If there is no arg, for simplicity, we can reserve "|" in this parsing area as "null"

```text-styling
<[Content::Flex]> <[10::Flex]> <[10::Flex]> <[10::Flex]> <[10:Frozen]>
```
**name** is the key that uniquely identifies the tile.

**alignment_preset** affects the HORIZTONAL fit. We will begin by assuming a specific amount of vertical tiling.
- tile::fit -> this is the default. Fills the whole width.
- tile::left|right|middle -> this creates a "rule of thirds" set of vertical positions.
- tile::<start-end> -> this creates a "vertical slice" starting from start% to end% of the horizontal space.

**content** comes from a list of existing widgets, or is the name of a module or js app:
- button
- slider 
- my_app1
- katex
- etc



#### Default Empty Tile
```tile
asdfdsa
```

#### Default Empty Button
```tile::|::|::button
Default Empty Button Backup Code Block Output
```

#### Left Justified Preset Empty Button

```tile::|::left::button
Default Left Button Backup Code Block Output
```


