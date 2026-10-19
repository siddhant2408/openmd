# openmd

Interactive Markdown notes, written in [OpenUI Lang](https://www.openui.com). Put a ` ```openui ` block anywhere in a note and it renders as live UI: charts, tables, dropdowns, sliders, tabs, forms, animated figures. It's made for notes your AI writes. Your AI gets a reference, a checker and a skill to follow; you get a live viewer that updates as it saves.

**Every block in a note is connected.** A dropdown in one block can drive a chart three headings down, because all of a note's blocks are stitched into one OpenUI program. Notes stay plain Markdown files.

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

## Use it

```bash
npx openmd preview ~/notes          # live viewer: every note in the folder, updated on each save
npx openmd check "my note.md"       # problems in a note's blocks; exits 1 if any
npx openmd reference                # every component and function, with exact signatures
npx openmd prompt                   # a guide to paste into ChatGPT, Claude.ai or Cursor rules
npx openmd install-skill            # teach Claude Code to write these notes (~/.claude/skills)
```

To read and edit notes in Obsidian, install the openmd plugin (see **Try it** below).

## Write notes with your AI

1. **Teach your AI the format.** In Claude Code, run `npx openmd install-skill`. For ChatGPT, Claude.ai or Cursor, paste the output of `npx openmd prompt` into the chat or your rules.
2. **Ask for what you want**, in plain words: "explain how tides work as an interactive note", "turn this CSV into a dashboard", "make a loan calculator". The skill has the AI outline the note first, start from a template, check its work with `openmd check`, and tell you what each control does.
3. **Watch it appear.** Keep `npx openmd preview <folder>` open; the page updates every time the AI saves.

Writing by hand? Copy a template from `packages/cli/skill/writing-openui-notes/templates/`: `explainer.md` (an animated figure and a chart), `dashboard.md` (data, a filter, numbers, a chart and a table) or `calculator.md` (inputs, results and a chart).

## How it works

- Each block's `root` is what it shows. A block without `root` shows nothing but can define data and state for the others.
- Names (`rows`, `$month`, …) are shared across the note, like cells in a spreadsheet. If two blocks define the same name, you get a warning.
- `Query("file", { path })` reads a CSV or JSON file next to your notes. Nothing leaves your machine.
- One hidden OpenUI renderer runs per note, and each block's UI is portaled into its place.

Besides the [standard OpenUI components](https://www.openui.com/docs), openmd adds:

| Component | What it does |
| --- | --- |
| `CountUp(value, prefix?, suffix?, decimals?, size?)` | A number that rolls to its new value, with thousands separators |
| `Progress(value, max, label?)` | A bar that fills toward `max`; green at 100%, amber from 80%, red below |
| `Reveal([children], "fade" \| "slide" \| "scale", delayMs?)` | Animates its children in when they appear |

For figures there is a small drawing kit:

| Component | What it does |
| --- | --- |
| `Svg(viewBox, [children])` | A drawing. Children: `Circle`, `Ellipse`, `Line`, `Path`, `Polygon`, `Polyline`, `Rect`, `SvgText`, `Span`, `Group`, `Glyph("satellite" \| "pin" \| "phone", …)`. Every coordinate can be an expression; `paint` picks a style token (see `packages/core/src/styles.css`) |
| `Plot([xMin, xMax], [yMin, yMax], [left, top, width, height], [children])` | A chart frame inside an `Svg`: its children give positions as data values, so no pixel formulas. `Polygon` and `Polyline` also accept a list of `{x, y}` |
| `Player(name, $var, to, ms, label?, pauseLabel?, autoplay?, loop?, ease?)` | Moves `$var` towards `to` over time: Play/Pause buttons, autoplay on scroll, looping, or an eased jump (`"out"`). Invisible without a label. Gives way when anything else changes `$var` |
| `Scrubber(name, min, max, step, $var, label?)`, `Check(name, label, $var)` | A slider and a checkbox that follow `$var` while a Player moves it |
| `Btn(label, Action([...]), variant?)` | A plain button |
| `Figure(tag, title, [children], caption?)`, `Controls`, `Readout`, `Grid`, `Tile` | Layout for figures; captions and readouts accept `**bold**` and `*italic*` |

And functions: `@Intersect` (where two circles cross), `@Distance`, `@Polar`, `@Sin`, `@Cos`, `@Sqrt`, `@Log10`, `@Pow`, `@Precision`, `@Fixed`, `@Pad`, `@Locale`, `@Join`, `@Seq`. **How GPS knows where you are** in the example vault is built from these alone. Run `openmd reference` for every signature.

Animations are off when the OS "reduce motion" setting is on.

## Try it

```bash
npm install
npm run build
npm run openmd -- preview example-vault   # the live viewer, from this repo
npm run install-vault                     # the Obsidian plugin, into example-vault/.obsidian/plugins/openmd
```

Open `example-vault/` in Obsidian (**Open folder as vault**), trust it, and open **Q1 store review** or **How GPS knows where you are**.

## Skill for coding agents

`packages/cli/skill/writing-openui-notes/` teaches an agent to write good interactive notes: `SKILL.md` (inputs, an outline-first workflow, rules, hand-over), `references/` (planning, figures, data, converting, style, language) and `templates/` (explainer, dashboard, calculator) to start from. `openmd install-skill` copies it into `~/.claude/skills`; `--dir` picks another folder. To track this repo instead:

```bash
ln -s "$PWD/packages/cli/skill/writing-openui-notes" ~/.claude/skills/writing-openui-notes
```

## Develop

| Package | What it is |
| --- | --- |
| `packages/core` (`@openmd/core`) | The renderer every host shares: `library.tsx` (component library and `Slot`), `figures.tsx` (drawing kit, Player, controls, functions), `stitch.ts` (joins a note's blocks into one program), `check.ts`, `files.ts` (what `Query("file", …)` returns), `styles.css` (theme as `--omd-*` variables) |
| `packages/cli` (`openmd`) | The command-line tool and live viewer: `cli.ts`, `serve.ts` (notes, data files, change events), `viewer/` (the page), `skill/` |
| `packages/obsidian` (`@openmd/obsidian`) | The Obsidian plugin: block processor, per-note runtime, the vault `file` tool, Obsidian theme mapping |

- `npm run check` parses the example notes and the skill's templates against the real library, then type-checks. CI (`.github/workflows/ci.yml`) runs it on every PR and push to `main`, along with the build, `openmd check` on the example notes and templates, and `npm audit` for high-severity issues.
- `npm run build` builds the plugin into `packages/obsidian/dist` and the CLI into `packages/cli/dist`.

## Limits

- Values you pick (a dropdown, a slider) reset when the note is reopened.
- In Obsidian, adding or deleting a block elsewhere in the note is picked up when Obsidian saves (about 2 s).
- The live viewer reads a note's data files once; edits to them show after reopening the note.
- The CSV reader does not handle quoted commas.
- The plugin bundle is about 3.7 MB and the viewer about 4 MB, mostly OpenUI's component library.

## License

MIT
