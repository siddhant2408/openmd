# How a pendulum keeps time

A pendulum's swing takes the same time whether it swings wide or narrow. What sets the time is its length. That's why a clock's pendulum can keep time for years: small changes in the swing don't change the beat.

> [!tldr] The short version
> The time for one swing there and back is **T = 2π√(L/g)**: it depends only on the length *L* and gravity *g*. Four times the length doubles the time.

```openui
// Shared by both figures: the length in metres, set by the slider in Figure 1.
$lengthM = 1
gravity = 9.81
periodS = 2 * 3.141592653589793 * @Sqrt($lengthM / gravity)
```

## 1 Watch it swing

```openui
// $swingT is simulated time in seconds; the Player runs it 0 → 60 s and loops. The angle follows the
// real motion, θ(t) = θ₀ · cos(2πt / T), so a new length changes the swing straight away.
$swingT = 0
swingAngle = 0.35 * @Cos(2 * 3.141592653589793 * $swingT / periodS)
rodPx = 30 + $lengthM * 135
bob = @Polar(320, 24, rodPx, 1.5707963267948966 - swingAngle)
root = Figure("FIG 1", "A pendulum swinging", [
  Svg("0 0 640 350", [
    Line(230, 24, 410, 24, "axis-thick"),
    Line(320, 24, 320, 24 + rodPx, "ghost stroke-accent"),
    Line(320, 24, bob.x, bob.y, "axis-thick"),
    Circle(bob.x, bob.y, 16, "fill-accent"),
    Circle(320, 24, 4, "fill-muted"),
    SvgText(24, 44, "T = " + @Fixed(periodS, 2) + " s", "t-big")
  ], "A pendulum hanging from a bar, swinging left and right. Its length is set by the slider below."),
  Controls([
    Player("swingT", $swingT, 60, 60000, "▶ Swing", "❚❚ Pause", true, true),
    Scrubber("lengthM", 0.25, 2, 0.01, $lengthM, "length (m)")
  ]),
  Readout("A **" + @Fixed($lengthM, 2) + " m** pendulum takes **" + @Fixed(periodS, 2) + " s** to swing there and back.")
], "Drag the length and watch the beat slow down or speed up. **How wide it swings doesn't matter**, only how long it is.")
```

## 2 Why length matters

The time grows with the square root of the length, so the curve bends over: each extra metre adds less time than the one before.

```openui
periodCurve = @Each(@Seq(0.25, 2, 0.05), "len", {x: len, y: 2 * 3.141592653589793 * @Sqrt(len / gravity)})
root = Figure("FIG 2", "Swing time against length", [
  Svg("0 0 640 290", [Plot([0, 2], [0, 3], [60, 20, 540, 230], [
    @Each([0, 1, 2, 3], "s", Group([
      Line(0, s, 2, s, s == 0 ? "axis" : "gridline"),
      SvgText(0, s, s + " s", "t-muted", "end", null, -8, 4)
    ])),
    @Each([0, 0.5, 1, 1.5, 2], "m", SvgText(m, 0, m + " m", "t-muted", "middle", null, null, 20)),
    Polyline(periodCurve, "live-net stroke-accent"),
    Line($lengthM, 0, $lengthM, periodS, "cursor"),
    Circle($lengthM, periodS, 6, "fill-accent"),
    SvgText($lengthM, periodS, @Fixed(periodS, 2) + " s", "t", "start", null, 10, 18)
  ])], "Swing time in seconds against pendulum length in metres, rising steeply at first and then flattening. A dot marks the current length."),
  Readout("At **" + @Fixed($lengthM, 2) + " m**, one swing takes **" + @Fixed(periodS, 2) + " s**. Doubling the length would make it **" + @Fixed(periodS * 1.4142135623730951, 2) + " s**.")
], "Move the slider in Figure 1: the dot follows. **Four times the length only doubles the time.**")
```

## Try this

1. Set the length to **0.25 m**, then **1 m**: the swing time doubles, from about 1 s to 2 s.
2. A grandfather clock beats once a second each way, so its full swing takes 2 s. Find the length that gives **T = 2.00 s**: it's just under 1 m.

*Source: the small-angle pendulum formula, T = 2π√(L/g), with g = 9.81 m/s².*
