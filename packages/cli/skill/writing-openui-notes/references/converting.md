# Turning a document into a note

For an HTML page, a slashdocs document (`slashdocs docs pull <id> --out page.html`), a PDF or plain notes. The aim is the same content and the same figures behaving the same way, written as Markdown and ` ```openui ` blocks. Never paste HTML into the note.

## 1. Take inventory

Read the whole source first, including its scripts. List:
- the sections and their text;
- each figure: what it draws, every control, and every animation (what moves, from what to what, how long, what starts it: autoplay, a button, scrolling into view);
- every number and formula behind a figure. Copy constants exactly.
- static pieces: callouts, tables, stat boxes, code or equation blocks.

## 2. Map each piece

| In the source | In the note |
|---|---|
| Headings, paragraphs, lists, tables | Markdown |
| A callout or aside box | `> [!note] Title` |
| A stat strip or boxed numbers | `Grid` of `Tile`s |
| An SVG figure | `Svg` with the same viewBox and coordinates, shape by shape |
| Axes and charts drawn with pixel formulas | `Plot` with the same box and ranges |
| A `requestAnimationFrame` loop or a CSS/SMIL animation | `Player` on a variable; the drawing reads the variable |
| A slider, checkbox or button | `Scrubber`, `Check`, `Btn` (with `Action([@Set(...)])`) or `Player` |
| `element.textContent = …` | `Readout` or `SvgText` with an expression |
| Circle crossings, distances, polar positions | `@Intersect`, `@Distance`, `@Polar` |

Port the logic, not the look: keep the source's coordinates and formulas so the result lands on the same pixels.

## 3. Check it matches

- At the same control settings, the readouts must show the same numbers as the source. Work a few out from the source's own code.
- Compare figures at the default, at both ends of each slider, and at the end of each animation.
- If something can't be reproduced (custom fonts, page-level CSS), say so in the hand-over rather than approximating silently.
- Bugs in the source: don't copy them. Fix them and say so.
