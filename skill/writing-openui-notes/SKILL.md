---
name: writing-openui-notes
description: Use when creating or editing an Obsidian note that uses ```openui blocks, when building an interactive figure, explainer, animation, calculator or dashboard inside Obsidian, or when turning an HTML page or slashdocs document into an Obsidian note.
---

# Writing OpenUI notes

The `intr` Obsidian plugin (repo `obsidian-openui`, local clone `~/mystuff/ai/projects/intr-obsidian`) renders each ` ```openui ` block as live UI. **All blocks in a note are one program**: names and `$state` are shared across blocks. A note holds only Markdown and ` ```openui ` blocks, never HTML. If something can't be expressed, add a generic component or function to the plugin (`src/figures.tsx`) and use it by name.

## Workflow

Run these in the plugin repo:

1. `npm run reference` lists every component and function with its exact positional signature. `npm run reference -- svg` filters. Read it before writing; arguments are positional, so don't guess the order.
2. Write the blocks.
3. `npm run check-note -- "path/to/note.md"` parses the note against the real library and reports type mismatches, unknown names and names defined twice.
4. `npm run preview -- "path/to/note.md"` serves the blocks at http://localhost:8765. Open it in a browser and try every Player, slider and button. Parsing can't show whether animations run.
5. `npm run build`, then copy `dist/main.js`, `dist/styles.css` and `dist/manifest.json` into `<vault>/.obsidian/plugins/intr/`. Do this only if the plugin changed.

## The language in brief

- A block shows its `root`. A block without `root` only defines data and state.
- Each name may be defined in one block only.
- `$x = 0` declares state. Bind it as a component's value argument, as in `Scrubber("x", 0, 10, 1, $x)`, and change it with `Action([@Set($x, 5)])`.
- Expressions support `+ - * / %`, comparisons, `&& || !`, `a ? b : c`, `a.b` and `a[i]`. `"text" + 3` joins as text.
- There are no user-defined functions. Inline the formula; for long, repetitive expressions, generate the block with a small script.
- `@Each(list, "v", template)` maps a list. Use `v` only inside the template.

## Traps

| Symptom | Fix |
| --- | --- |
| `expects Point but got plain object` | Literal data handed to a component must be built with it, e.g. `Point(x, y)` not `{x: x, y: y}`. Plain objects are fine for data you only filter or sort. |
| A slider doesn't move when a Player or button changes its variable | Use `Scrubber`. The built-in `Slider` ignores outside changes and binds arrays (`$v = [0]`, read `$v[0]`). |
| Circles render as ellipses, axes jump as data changes | Charts autoscale. Draw with `Svg` shapes instead. |
| Need motion over time | `Player(name, $var, to, ms, label?, pauseLabel?, autoplay?, loop?, ease?)`. Without a label it is invisible, which suits a looping effect. |
| A new library name collides | Component, function and built-in names share one namespace. For example, `Label` already exists, so SVG text is `SvgText`. |
| A new colour or line style is needed | `paint` words are classes in `styles.extra.css` (`"ring s1"` becomes `.intr-ring .intr-s1`). Add a token there with light and dark values. |

## Example

```openui
$grow = 0
radius = $grow / 100 * 80
root = Figure("FIG 1", "A growing circle", [
  Svg("0 0 400 200", [
    Circle(200, 95, radius, "ring s1"),
    SvgText(200, 192, @Fixed(radius, 0) + " px", "t-muted", "middle")
  ]),
  Controls([
    Player("grow", $grow, 100, 3000, "▶ Play", "❚❚ Pause", true),
    Scrubber("grow", 0, 100, 1, $grow, "size")
  ])
], "Captions accept **bold** and *italic*.")
```

For a full worked example, see `example-vault/How GPS knows where you are.md`.
