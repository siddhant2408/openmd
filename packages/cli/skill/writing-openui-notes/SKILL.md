---
name: writing-openui-notes
description: Use when creating or editing a Markdown note that uses ```openui blocks (openmd, or its Obsidian plugin), when building an interactive figure, explainer, animation, calculator or dashboard in a note, or when turning an HTML page or slashdocs document into a note.
---

# Writing OpenUI notes

openmd renders each ` ```openui ` block in a Markdown note as live UI: in its own live viewer (`openmd preview`) and in Obsidian through the openmd plugin. **All blocks in a note are one program**: names and `$state` are shared across blocks. A note holds only Markdown and ` ```openui ` blocks, never HTML. If something can't be expressed, add a generic component or function to `@openmd/core` (`packages/core/src/figures.tsx` in the openmd repo) and use it by name.

## Workflow

Run `openmd` with `npx openmd …`, or install it once with `npm i -g openmd`.

1. `openmd reference` lists every component and function with its exact positional signature, and `openmd reference svg` filters. Read it before writing. Arguments are positional, so don't guess the order.
2. Write the blocks.
3. `openmd check "path/to/note.md"` parses the note against the real library. It reports type mismatches, unknown names and names defined twice, and exits 1 on any problem. Fix everything it reports.
4. `openmd preview "path/to/folder-or-note"` opens a live viewer that updates on every save. Try every Player, slider and button. Parsing can't show whether animations run.

## The language in brief

- A block shows its `root`. A block without `root` only defines data and state.
- Each name may be defined in one block only.
- `$x = 0` declares state. Bind it as a component's value argument, as in `Scrubber("x", 0, 10, 1, $x)`, and change it with `Action([@Set($x, 5)])`.
- Expressions support `+ - * / %`, comparisons, `&& || !`, `a ? b : c`, `a.b` and `a[i]`. `"text" + 3` joins as text.
- There are no user-defined functions, so keep formulas from repeating:
  - Name a value once and reuse it, as in `dA = @Distance(satA, you)`.
  - Draw charts inside `Plot([xMin, xMax], [yMin, yMax], [left, top, width, height], [...])`, so shapes take data values instead of pixel formulas.
  - Use `@Intersect`, `@Distance` and `@Polar` for geometry.
  - When a formula would repeat inside `@Each`, compute a list of objects once (`curve = @Each(@Seq(0, 10, 1), "k", {x: k, y: k * k})`) and draw from it (`Polyline(curve)`).
- `@Each(list, "v", template)` maps a list. Use `v` only inside the template.

## Traps

| Symptom | Fix |
| --- | --- |
| `expects Point but got plain object` | Literal data handed to a component must be built with it, e.g. `Point(x, y)` not `{x: x, y: y}`. Plain objects are fine for data you only filter or sort. |
| A slider doesn't move when a Player or button changes its variable | Use `Scrubber`. The built-in `Slider` ignores outside changes and binds arrays (`$v = [0]`, read `$v[0]`). |
| Circles render as ellipses, axes jump as data changes | Charts autoscale. Draw with `Svg` shapes instead. |
| Every shape in a chart needs a pixel formula | Wrap them in a `Plot`. Its children use data values; nudge labels with `SvgText`'s `dx`/`dy`. |
| Need motion over time | `Player(name, $var, to, ms, label?, pauseLabel?, autoplay?, loop?, ease?)`. Without a label it is invisible, which suits a looping effect. |
| A new library name collides | Component, function and built-in names share one namespace. For example, `Label` already exists, so SVG text is `SvgText`. |
| A new colour or line style is needed | `paint` words are classes in `@openmd/core`'s `styles.css` (`"ring s1"` becomes `.omd-ring .omd-s1`). Add a token there with light and dark values. |

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
