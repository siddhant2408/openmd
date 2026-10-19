# From a request to an outline

A note is only as good as the plan behind it. Write the outline before any block, and show it to the person if the topic or the scope is unclear.

## Three kinds of input

**A topic** ("explain how GPS works", "how does compound interest grow").
- Research the real mechanism and the real numbers: units, typical values, the formula if there is one. Prefer primary sources (specs, textbooks, papers), then reputable explainers.
- Find the two to four ideas a reader must get, in the order they build on each other. Each becomes a section; most sections get one figure.
- Without web access, use what you know, mark estimates as estimates, and pick well-known values you're sure of.

**An existing document** (an HTML page, a slashdocs doc, a PDF, notes). See `converting.md`.

**Data** (a CSV, JSON, a table someone pasted). Decide the questions the reader will ask of it (which month was best, how does A compare with B), then one view per question. See `data.md`.

## The outline

A few lines per section, before writing anything else:

```
Title: How a pendulum keeps time
Reader: curious adults, no physics needed
1 Watch it swing     FIG 1  pendulum animated with its real motion; slider: length → swing speeds up / slows down
                     state: $lengthM (shared), $swingT (Player, loops)
2 Why length matters FIG 2  period against length, dot at the current length (driven by FIG 1's slider)
Try this             two concrete things to try, with the numbers they should see
Sources              the formula and the constant used
```

For every figure, write:
- **the one idea it shows.** If it shows two, split it.
- **the real sequence** it plays, if it moves (see the rule below).
- **the state** that drives it (`$names`), and which other figures read that state.
- **what the reader does:** watch, drag, press. A figure that only sits there is a picture; it needs a reason to be a figure.

## Follow the real process

When a figure shows something happening, write the real sequence first: each step, and where every thing is after it. Signals leave together → the nearest arrives first → a second arrives → the third pins the position. Then:
- each control or Player stage is one real step, in the real order;
- things move only along their real path. Nothing appears where it couldn't get to, and no step is skipped;
- an out-of-order action does something sensible (runs the missing step first, or a readout says why not).

Check the finished figure against the list, not just that "something moved".

## Figure types that work

| Type | Use it for | Built with |
|---|---|---|
| Mechanism | how something works, step by step | `Svg` shapes, `Player` (autoplay), stage text in a `Readout` |
| Parameter explorer | "what if I change X" | `Scrubber` → computed values → `Readout` sentence with bold numbers |
| Relationship chart | how Y depends on X | `Plot` + `Polyline` from `@Each(@Seq(…))`, a dot at the current value |
| Step-through | a sequence the reader controls | `Btn("Next", Action([@Set($step, $step + 1)]))`, drawing reads `$step` |
| Comparison | A against B | `BarChart`, `HorizontalBarChart`, or two `Polyline`s in one `Plot` |
| Map or space | where things are | `Svg` with a scale bar; positions in real units through a `Plot` |
| Numbers | the headline facts | `Grid` of `Tile`s, `CountUp` |

## Shared state is the superpower

A slider in one figure can drive a chart three sections later. Put shared state and the formulas that use it in a block with no `root` near the top, so every figure reads the same values. Name state for what it means (`$lengthM`, `$clockError`), not `$x`.
