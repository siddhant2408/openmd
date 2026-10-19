# obsidian-openui

Interactive blocks for Obsidian notes, written in [OpenUI Lang](https://www.openui.com). Put a ` ```openui ` block anywhere in a note and it renders as live UI: charts, tables, dropdowns, sliders, tabs, forms.

**Every block in a note is connected.** A dropdown in one block can drive a chart three headings down, because the plugin stitches all of a note's blocks into one OpenUI program. Notes stay plain Markdown files.

````markdown
```openui
sales = Query("file", { path: "data/sales.csv" }, { rows: [] })
$month = "jan"
rows = @Filter(sales.rows, "month", "==", $month)
```

Pick a month:

```openui
root = Select("month", [SelectItem("jan", "January"), SelectItem("feb", "February")], null, null, $month)
```

Some ordinary notes in between.

```openui
root = BarChart(rows.day, [Series("Revenue", rows.amount)])
```
````

## How it works

- Each block's `root` is what it shows. A block without `root` shows nothing but can define data and state for the others.
- Names (`rows`, `$month`, …) are shared across the note, like cells in a spreadsheet. If two blocks define the same name, a warning appears above them.
- `Query("file", { path })` reads a CSV or JSON file from the vault. Nothing leaves your machine; there is no server.
- One hidden OpenUI renderer runs per note, and each block's UI is portaled into its place.

Besides the [standard OpenUI components](https://www.openui.com/docs), the plugin adds:

| Component | What it does |
| --- | --- |
| `CountUp(value, prefix?, suffix?, decimals?, size?)` | A number that rolls to its new value, with thousands separators |
| `Progress(value, max, label?)` | A bar that fills toward `max`; green at 100%, amber from 80%, red below |
| `Reveal([children], "fade" \| "slide" \| "scale", delayMs?)` | Animates its children in when they appear |

For figures there is a small drawing kit:

| Component | What it does |
| --- | --- |
| `Svg(viewBox, [children])` | A drawing. Children: `Circle`, `Ellipse`, `Line`, `Path`, `Polygon`, `Polyline`, `Rect`, `SvgText`, `Span`, `Group`, `Glyph("satellite" \| "pin" \| "phone", …)`. Every coordinate can be an expression; `paint` picks a style token (see `styles.extra.css`) |
| `Player(name, $var, to, ms, label?, pauseLabel?, autoplay?, loop?, ease?)` | Moves `$var` towards `to` over time: Play/Pause buttons, autoplay on scroll, looping, or an eased jump (`"out"`). Invisible without a label. Gives way when anything else changes `$var` |
| `Scrubber(name, min, max, step, $var, label?)`, `Check(name, label, $var)` | A slider and a checkbox that follow `$var` while a Player moves it |
| `Btn(label, Action([...]), variant?)` | A plain button |
| `Figure(tag, title, [children], caption?)`, `Controls`, `Readout`, `Grid`, `Tile` | Layout for figures; captions and readouts accept `**bold**` and `*italic*` |

And functions: `@Sin`, `@Cos`, `@Sqrt`, `@Log10`, `@Pow`, `@Precision`, `@Fixed`, `@Pad`, `@Locale`, `@Join`, `@Seq`. **How GPS knows where you are** in the example vault is built from these alone.

Animations are off when the OS "reduce motion" setting is on.

## Try it

```bash
npm install
npm run install-vault   # builds into example-vault/.obsidian/plugins/intr
```

Open `example-vault/` in Obsidian (**Open folder as vault**), trust it, and open **Q1 store review**.

## Develop

- `src/stitch.ts` joins a note's blocks into one program.
- `src/library.tsx` holds the component library, including `Slot` and the animated components.
- `src/main.tsx` is the plugin: block processor, per-note runtime, the `file` tool.
- `npm run check` parses the example notes against the real library and type-checks.

## Limits

- Values you pick (a dropdown, a slider) reset when the note is reopened.
- Adding or deleting a block elsewhere in the note is picked up when Obsidian saves (about 2 s).
- The CSV reader does not handle quoted commas.
- The bundle is about 3.7 MB, mostly OpenUI's component library.

## License

MIT
