---
name: writing-openui-notes
description: Write interactive Markdown notes (openmd, or Obsidian with the openmd plugin) whose figures animate, respond to sliders and buttons, and share state, using ```openui blocks. Use it when someone asks to explain how something works interactively, wants a visual or animated explainer, an interactive note, a calculator, a what-if explorer or a dashboard from data in Markdown or Obsidian, or wants an HTML page or slashdocs document turned into a note, even if they don't name openmd. For a standalone hand-drawn isometric object page use colorfigures instead; for a published HTML document use slashdocs.
license: MIT
compatibility: Node.js 18+ for the openmd CLI (npx openmd). Any agent that can write files; checking needs a shell.
---

# Writing OpenUI notes

An openmd note is a plain Markdown file. Each ` ```openui ` block in it renders as live UI: drawings, charts, sliders, buttons, animations. All of a note's blocks are **one program**, so a slider in one figure can drive a chart three sections later. It renders in the live viewer (`openmd preview`) and in Obsidian through the openmd plugin.

A note holds only Markdown and ` ```openui ` blocks, **never HTML**. If something can't be expressed, the fix is a new generic component or function in `@openmd/core`, not markup in the note.

Read as needed:
- `references/planning.md`: from a topic, a document or data to an outline; figure types; "follow the real process".
- `references/figures.md`: drawings, `Plot` charts, geometry, `Player` motion, readouts and captions.
- `references/data.md`: notes built on CSV or JSON: filters, totals, tables.
- `references/converting.md`: turning an HTML page or slashdocs document into a note.
- `references/style.md`: paint words, taste, wording, accessibility.
- `references/language.md`: the language's rules and its traps.

## Inputs: three cases

**A topic** ("explain how tides work"): research the real mechanism and numbers, then find the two to four ideas a reader must get, in order.

**A document** (HTML, slashdocs, PDF, notes): inventory its sections, figures, controls, animations and numbers; port them faithfully (`references/converting.md`).

**Data** (CSV, JSON, a pasted table): decide the questions a reader will ask of it; one view per question (`references/data.md`).

## Workflow

1. **Outline first.** A few lines per section: the one idea each figure shows, what moves and in what real order, the `$state` that drives it, and what the reader does. Show it to the person if the scope or the topic is unclear (`references/planning.md`).
2. **Start from a template.** Copy the closest one from `templates/` and replace its content. Don't start from a blank note.
   - `explainer.md`: an animated figure with a Player, a chart in a `Plot`, one slider shared by two figures.
   - `dashboard.md`: data, a shared filter, headline numbers, a chart and a table.
   - `calculator.md`: inputs, computed results, a chart that follows them.
   - For a large worked example, see **How GPS knows where you are** in the openmd example vault.
3. **Write the blocks.** Run `openmd reference` (or `openmd reference <word>`) for exact signatures; arguments are positional.
4. **Check:** `openmd check note.md` must report no problems. Fix everything it lists.
5. **Look at it**, in at most two rounds of look → fix:
   - `openmd preview <folder or note>` opens a live viewer that updates on every save;
   - look at each figure in its starting state, play its main sequence once, and drag each slider to both ends;
   - check every figure against its outline: right sequence, right numbers, nothing overlapping or unreadable;
   - without a browser, say that the figures were checked by `openmd check` only.
6. **Hand over:** the note's path, one line per figure on what its controls do, and what you didn't verify.

## Rules

- **Follow the real process.** For anything that moves, write the real sequence first. Each control or animation stage is one real step, in order; nothing appears where it couldn't get to.
- **True numbers.** Real values with units, from sources you name in the note. Mark estimates as estimates.
- **One idea per figure, and every figure does something.** If a figure only sits there, it should be a sentence or a table instead.
- **The figure starts in a state worth seeing.** Autoplay a mechanism when it scrolls into view, or open on its most telling state.
- **Captions say what to try and what to notice.** Readouts are sentences with bold numbers, not bare values.
- **Neat over busy:** about 8–18 repeated lines, 6 labels or fewer per figure, one accent colour for what matters now.
- **Prose explains; figures show.** Long explanations go in the Markdown, not inside drawings.
- **Defaults give way.** If the person asks for a style, length, audience or number of figures, that wins over these rules.

## Files

| Path | What |
|---|---|
| `templates/explainer.md`, `dashboard.md`, `calculator.md` | Working notes to copy and adapt. `openmd check` passes on all three. |
| `references/*.md` | The detail behind each workflow step, read when needed. |
| `openmd reference`, `check`, `preview` | Signatures, problems, the live viewer. Run with `npx openmd …`, or install once with `npm i -g openmd`. |
