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
