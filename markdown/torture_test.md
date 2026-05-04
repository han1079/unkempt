
## Section 14 - Torture Test 
A configuration of the vertical tile. Subtile means it should not be rendered.
It itself renders a subtile of type "single_button".
Add in tons of jank and typos to test parser ability to ignore.
```tile::|::|::subtile
<===>

<===>

<[single_button]>
<==>
<=>
ffwefaeunc

<->

name: vertical;
```

Just a single button. Get rid of the default margin. Default renders in place because it's not a subtile.
```tile::single_button::no-margin::button
content: {label: single button};
```

An normally hidden single button. Force the name to be parsed in the code block instead of the the language hint.
Also force the button formatter to accept both "text" and "label" as equivalent for purposes of labeling the widget.
```tile::|::no-margin::|
name: hidden_single_button;
content: {app:button, label: single button};
subtile: true;
```


Horizontal tiling. Add in typos for delimiters to do proper garbage collection. All in mixed row delimiter to test regex.
Set subtile in lang modifier. Multiple instances of "self" with {} syntax to show that this is just an "individual cell"
that contains a full tile.
```tile::horizontal::|::subtile
<[]=>
<[]=>
<[]=>
<[self{0}]><[self{1}]><[self{2}]>
<[-----------------------==]>
content: {app: text, text: horiz};
```

Rectangle, but with incorrectly formatted row. Demonstrate that system "picks the bottom one".
"self" here will be parsed to occupy the following grid spots:

```text
[X] [X] [X] [X] [X] [X]
[ ] [ ] [ ] [X] [X] [X] 
[X] [X] [X] [X] [ ] [ ]
```

Obviously, this is not a proper rectangle. The default will be to pick the most "rectangular" chunk
to render. This will be a challenge for the "grid allocation" algorithm to overcome. Priorities should be:

1. Find largest "area" contiguous rectangle 
2. If tie, select the one where Abs(X.dim - Y.dim) is the smallest.
3. If all tie, select for the first one parsed.

We can also put in, as default, that all grids must be properly constructed, or else it refuses to render.

```tile::rectangle::|::|
<[=]>
<[single_button]>
<[self]>
<[=]>
<[hidden_single_button]> <[self]>
<[=]>
<[self]> <[self]> <[single_button]>
<[=]>
<[vertical]>
content: {app: latex, text: \frac{1}{2}\n\frac{1}{2}}
```

A single tile with subtiles that yields overlapping tiles. Add in arbitrarily long row delimiters. Add in whitespace to enforce whitespace collapse filter.

Syntax parsing challenge - `<[a::b::...]>` forces formatter to bias to rendering the "leftmost" on top. This also forces layer count detection. Eventually
we can use this to test a layering "bring to front, send to back, shift up/down X layers" system prior to SVG generator design. 

Mangled rectangle detection should also kick in here and cut off the stub "1X2 self" that overlaps with horizontal.
```tile::overlapping::Left::button
<[self]>       <[vertical::self]>   <[self::rectangle]>         <[rectangle]>
<===========================================================================>
<[self]>       <[vertical::self]>   <[self::rectangle]>         <[rectangle]>
<===========================================================================>
<[self]>       <[     self     ]>   <[self::rectangle]>         <[rectangle]>
<===========================================================================>
<[self::horizontal]> <[  horizontal  ]>   <[horizontal::rectangle::vertical]>   <[rectangle]>
<===========================================================================>
<[self]>           <[]>                 <[vertical]> 
content: {app: button, label: self};
```

