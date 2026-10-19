# The language and its traps

Run `openmd reference` for every component and function with its exact signature (`openmd reference plot` filters). Arguments are positional, so check the order instead of guessing.

## The rules

- A note's ` ```openui ` blocks are **one program**. Names and `$state` defined in one block can be used in any other.
- A block shows its `root`. A block without `root` only defines data and state.
- Each name may be defined in one block only.
- `$x = 0` declares state. Bind it as a component's value argument (`Scrubber("x", 0, 10, 1, $x)`); change it with `Action([@Set($x, 5)])` or a `Player`.
- Expressions: `+ - * / %`, comparisons, `&& || !`, `a ? b : c`, `a.b`, `a[i]`, object literals `{x: 1, y: 2}`, lists `[1, 2]`. `"text" + 3` joins as text.
- `@Each(list, "v", template)` maps a list. Use `v` only inside the template.
- Built-in functions: `@Count @First @Last @Sum @Avg @Min @Max @Sort @Filter @Round @Abs @Floor @Ceil @Each`. openmd adds `@Intersect @Distance @Polar @Sin @Cos @Sqrt @Log10 @Pow @Precision @Fixed @Pad @Locale @Join @Seq`.
- Comments start with `//`.

## No user-defined functions

Keep formulas from repeating:
- Name a value once and reuse it: `dA = @Distance(satA, you)`.
- Put charts in a `Plot`, so shapes take data values instead of pixel formulas.
- Use `@Intersect`, `@Distance` and `@Polar` for geometry.
- When a formula would repeat inside `@Each`, build a list of objects once (`curve = @Each(@Seq(0, 10, 1), "k", {x: k, y: k * k})`) and draw from it (`Polyline(curve)`).

## Traps

| Symptom | Fix |
| --- | --- |
| `expects Point but got plain object` | Literal data handed to a built-in chart must use its component: `Point(x, y)`, not `{x: x, y: y}`. Plain objects are fine for data you filter or sort, and for `Polygon`/`Polyline`. |
| A slider doesn't move when a Player or button changes its variable | Use `Scrubber`. The built-in `Slider` ignores outside changes and binds arrays (`$v = [0]`, read `$v[0]`). |
| Circles render as ellipses; axes jump as data changes | Built-in charts autoscale. Draw with `Svg` shapes in a `Plot` instead. |
| `"x" is defined in more than one block` | Rename one. Names are shared across the whole note. |
| `Unknown component` or `Unknown function` | Check the spelling against `openmd reference`. Library names share one namespace: `Label` already exists, so SVG text is `SvgText`. |
| A shape sits at the wrong place inside a `Plot` | Radii, `Path` and `SvgText`'s `dx`/`dy` stay in drawing units; everything else is a data value. |
| A figure looks blank at first | Its Player hasn't run yet (autoplay starts when the figure scrolls into view) or a `visible` condition is false at the start. Make the starting state worth seeing. |
| A value shows `NaN` or a shape vanishes | A name is misspelled or a list is empty (`@First` of `[]` is null). `openmd check` reports unknown names. |
| A new colour or line style is needed | Add a paint word to `@openmd/core`'s `styles.css` with light and dark values (see `style.md`). |
