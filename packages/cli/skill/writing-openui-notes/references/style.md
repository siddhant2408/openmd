# Look and feel

## Paint words

`paint` is a space-separated list of words, each a style from `@openmd/core`'s `styles.css`. Light and dark themes are handled for you.

| Words | Use for |
|---|---|
| `t`, `t-muted`, `t-mono`, `t-big`, `italic` | text: normal, secondary, numbers, headline, emphasis |
| `s1`, `s2`, `s3` | the three series colours (blue, purple, teal); colour text, rings and glyphs together |
| `c-accent`, `c-ok`, `c-warn` | text in the accent (orange), good (green) or warning (red) colour |
| `fill-accent`, `fill-ok`, `fill-warn`, `fill-muted`, `fill-grid`, `fill-panel`, `fill-s1`, `fill-s2` | solid shapes |
| `stroke-accent`, `stroke-ok`, `stroke-s1`, `stroke-s2` | line colour, combined with a line style below |
| `axis`, `axis-thick`, `gridline`, `tick-ref`, `cursor` | chart furniture |
| `live`, `live-net`, `curve`, `ghost` | data lines: normal, bold, dashed, faint dotted guide |
| `ring`, `wave`, `signal`, `trail`, `link` | outlines, dashed wavefronts, dotted paths |
| `crossing`, `mismatch`, `xmark`, `hollow`, `true-ring`, `cursor-dot` | markers and highlights |
| `pin-you`, `pin-gps` | pin glyph colours (green, red) |
| `fill-land`, `fill-park`, `fill-road`, `river`, `road`, `ringroad`, `street` | simple maps |

Need a look that isn't here? Add a word to `styles.css` with light and dark values, rather than approximating.

## Taste

- **Neat over busy.** Repeated lines (gridlines, ticks, streets) about 8–18; labels on a figure 6 or fewer. Every detail must read at normal size.
- **One accent.** Orange marks what matters now (the current value, the moving thing). Series colours tell things apart. Don't use colour as decoration.
- **Fill the frame.** Size the viewBox to the content; no big empty margins.
- **Real proportions.** Draw to the real ratios of the thing, or say in the caption that it isn't to scale.
- **Text is text.** Explanations belong in Markdown around the figure, not drawn inside it. Inside a figure: short labels only.

## Words

- Headings say what the section shows ("Why length matters"), not "Section 2".
- Captions: what to try, then what to notice. Readouts: full sentences with bold numbers and units.
- Write for the reader the person named. Without one, write for a curious adult who isn't an expert.

## Accessibility

- Give every `Svg` a description (its third argument).
- Don't rely on colour alone: a label, a dash pattern or a marker should carry the meaning too.
- Reduced motion is automatic: Players jump to their end, so a figure must still make sense in its final state.
