# Building figures

`openmd reference` has every signature; this file is how to combine them. `templates/explainer.md` and the example vault's **How GPS knows where you are** show all of it working.

## Frame

```text
root = Figure("FIG 1", "A pendulum swinging", [
  Svg("0 0 640 350", [ ...shapes... ], "What the drawing shows, for screen readers."),
  Controls([ Player(...), Scrubber(...) ]),
  Readout("A **1.00 m** pendulum takes **2.01 s** to swing there and back.")
], "One or two sentences: what to try, and what to notice.")
```

- Draw on a 640-wide canvas; pick the height to fit (200–460). The drawing scales to the page.
- Always give `Svg` its third argument, a plain description of the picture.

## Two coordinate systems

**Drawing units** (the `Svg` viewBox, y points down) for scenes: satellites, a pendulum, a map.

**Data values** inside a `Plot`, for anything on axes:

```text
Plot([0, 24], [-10, 50], [56, 20, 470, 190], [
  @Each([-10, 0, 10, 20, 30, 40, 50], "v", Group([
    Line(0, v, 24, v, v == 0 ? "axis" : "gridline"),
    SvgText(0, v, (v > 0 ? "+" : "") + v, "t-muted", "end", null, -8, 4)
  ])),
  Polyline(curve, "live-net stroke-accent"),
  Circle(now, valueNow, 5, "fill-accent")
])
```

- `x` is `[left value, right value]` and `y` is `[bottom value, top value]`. `box` is `[left, top, width, height]` in drawing units. Leave about 60 on the left and 40 below for labels.
- Inside a `Plot`, radii, `Path` and `SvgText`'s `dx`/`dy` stay in drawing units; use `dx`/`dy` to nudge labels off their points.
- Curves come from a list: `curve = @Each(@Seq(0, 24, 0.5), "h", {x: h, y: 38.5 * h / 24})`, then `Polyline(curve, …)`. Keep lists to about 500 points or fewer.
- A domain can be computed (`Plot([0, $termMonths], [0, $loanAmount], …)`); the chart rescales as the input changes.

## Geometry without formulas

- `@Distance(a, b)`: between two `{x, y}` points.
- `@Polar(x, y, r, angle)`: the point at that distance and angle. y points down in a drawing, so `angle = π/2 − θ` puts θ = 0 straight down (a pendulum at rest).
- `@Intersect(a, b, near)`: where circles `{x, y, r}` cross; `@First` is the one nearest `near`. `@Count(...) > 0` tells you they touch.
- Name repeated values once: `dA = @Distance(satA, you)`, then reuse `dA`.

## Motion

`Player(name, $var, to, ms, label?, pauseLabel?, autoplay?, loop?, ease?)` moves a number over time.

| Want | Player |
|---|---|
| Plays when scrolled into view, Play/Pause after | `Player("t", $t, 1000, 7500, "▶ Play", "❚❚ Pause", true)` |
| Runs forever, no button (a pulse, a swing) | `Player("pulse", $pulse, 1, 2600, null, null, true, true)` |
| A smooth jump to a value on press ("Solve") | `Player("err", $err, 0, 1100, "Solve", null, false, false, "out")` |

- Drive the drawing from the variable with real formulas (`angle = θ₀ · cos(2πt/T)`), not from canned keyframes. Then sliders and the Player cooperate.
- Pair a Player with a `Scrubber` on the same variable so the reader can scrub; touching the slider pauses the Player.
- A full sequence plays in 3–10 s. Loops can be longer if the motion itself is slow and calm.
- Reduced motion is handled for you: Players jump to their end.

## Showing and hiding

- Give a shape `visible` (its last look argument) instead of building two drawings: `Circle(x, y, 7, "xmark", null, heard == 2)`.
- Fade with `opacity`; group things that appear together in a `Group([...], null, null, opacity, visible)`.
- Draw back to front: grid and axes, then data, then highlights, then labels.

## Readouts and captions

- **Readout:** one live sentence with the numbers in bold. "A **1.00 m** pendulum takes **2.01 s**." Not a bare number.
- **Caption:** what to try and what to notice, in one or two sentences. Bold the key idea.
- **Stage text:** for a mechanism, the Readout says what is happening at each stage (`heard == 1 ? "…" : …`).
