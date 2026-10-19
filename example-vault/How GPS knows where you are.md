# How GPS knows where you are

*Explainer · Navigation & timekeeping*

Your phone never measures a distance. It reads the time. Everything else, including a correction from Einstein, follows from that.

> [!tldr] The short version
> Each GPS satellite broadcasts the time from an atomic clock. Your receiver compares that time with its own clock to see how long the signal took to arrive. Multiply by the speed of light and you get a distance.
>
> Distances to **four** satellites give your position and also correct your phone's cheap clock. Light covers 30 cm per nanosecond, so the satellite clocks must agree to within a few nanoseconds. Relativity makes the orbiting clocks gain about **38 microseconds a day**. Left alone, that would add about **11 km** of error every day, so the satellite clocks are built to tick slightly slow.

```openui
root = Grid([
  Tile("orbit altitude above Earth", "20,200 km"),
  Tile("distance light travels in 1 nanosecond", "30 cm"),
  Tile("satellites for a position fix", "4"),
  Tile("how fast orbiting clocks run, net", "+38 μs/day")
])
```

## 1 Timing is distance

About 31 GPS satellites orbit roughly 20,200 km up, each circling Earth twice a day. Every satellite carries atomic clocks and transmits a steady signal. The signal includes the time it was sent, measured against a shared timescale called *GPS time*, and the satellite's exact position in orbit.

Your receiver only listens. When a signal arrives, it compares the time stamp with its own clock. The difference is how long the signal took to get to you. The signal travels at the speed of light, so:

```text
distance = speed of light × (time received − time sent)
```

From a satellite straight overhead the trip takes about 67 milliseconds. From one near the horizon, about 86.

```openui
// The pulse runs along the signal for the first 80% of each 2.6 s loop, then fades.
$pulse = 0
pulseK = $pulse < 0.8 ? $pulse / 0.8 : 1
pulseFade = $pulse < 0.8 ? 1 : (1 - $pulse) / 0.2
root = Figure("FIG 1", "One signal, one distance", [
  Svg("0 0 640 190", [
    Path("M 90 58 L 560 128", "signal"),
    Circle(90 + 470 * pulseK, 58 + 70 * pulseK, 6, "pulse", pulseFade),
    Glyph("satellite", 40, 34, 100, 50, "s1"),
    Glyph("phone", 545, 105, 30, 48),
    SvgText(40, 104, "sent at", "t-muted"),
    SvgText(40, 122, "12:00:00.000 000 000", "t-mono"),
    SvgText(430, 174, "heard at", "t-muted"),
    SvgText(430, 186, "12:00:00.067 380 000", "t-mono"),
    SvgText(320, 28, "0.067 38 s × 299,792 km/s ≈ 20,200 km", "t-big", "middle")
  ], "A satellite sends a time-stamped signal to a phone. Sent at 12:00:00.000000000, heard at 12:00:00.067380000; 0.06738 seconds times 299,792 kilometres per second is 20,200 kilometres."),
  Player("pulse", $pulse, 1, 2600, null, null, true, true)
], "The satellite stamps the time on the signal. The receiver notes when it arrived. The gap, multiplied by the speed of light, is the distance. **This only works if both clocks agree.** That requirement drives the rest of this explainer.")
```

## 2 Circles that meet at one point

One distance doesn't tell you where you are. It tells you that you are somewhere on a sphere around that satellite. On a flat page, that sphere is a circle. Add a second satellite and the two circles cross at two points. A third circle passes through only one of them.

The figure plays this out in 2D. All three satellites send at the same instant, because their clocks agree. Each wavefront spreads outward, and the receiver hears the closest satellite first.

```openui
// Shared by figures 2 and 3: three satellites and you, in drawing units (y points down).
you = {x: 300, y: 240}
satA = {x: 130, y: 170}
satB = {x: 430, y: 420}
satC = {x: 580, y: 80}
dA = @Distance(satA, you)
dB = @Distance(satB, you)
dC = @Distance(satC, you)
satellites = [
  Glyph("satellite", satA.x - 32, satA.y - 16, 64, 32, "s1"), SvgText(satA.x - 26, satA.y - 18, "A", "t-big s1", "middle"),
  Glyph("satellite", satB.x - 32, satB.y - 16, 64, 32, "s2"), SvgText(satB.x + 26, satB.y - 18, "B", "t-big s2", "middle"),
  Glyph("satellite", satC.x - 32, satC.y - 16, 64, 32, "s3"), SvgText(satC.x + 26, satC.y - 18, "C", "t-big s3", "middle")
]
```

```openui
// Wavefronts spread 420 units over the slider's 0–1000; each ring locks when it reaches you.
$t = 0
waveR = $t / 1000 * 420
heardCount = (waveR >= dA ? 1 : 0) + (waveR >= dB ? 1 : 0) + (waveR >= dC ? 1 : 0)
falseCrossing = @Last(@Intersect({x: satA.x, y: satA.y, r: dA}, {x: satB.x, y: satB.y, r: dB}, you))
stageText = heardCount == 0 ? "The signals leave all three satellites at the same instant. Their clocks agree, which is the whole point." : heardCount == 1 ? "A’s signal arrives first. Its travel time gives a distance, so you are somewhere on that circle." : heardCount == 2 ? "B arrives next. Two circles cross at two points, and you are at one of them." : "C arrives last. Only one point lies on all three circles. That is your position."
root = Figure("FIG 2", "Three wavefronts, one place they agree", [
  Svg("0 0 640 460", [
    Circle(satA.x, satA.y, @Max([0.01, waveR]), "wave s1", waveR < dA ? 0.75 : @Max([0, 1 - (waveR - dA) / 70]) * 0.5),
    Circle(satB.x, satB.y, @Max([0.01, waveR]), "wave s2", waveR < dB ? 0.75 : @Max([0, 1 - (waveR - dB) / 70]) * 0.5),
    Circle(satC.x, satC.y, @Max([0.01, waveR]), "wave s3", waveR < dC ? 0.75 : @Max([0, 1 - (waveR - dC) / 70]) * 0.5),
    Circle(satA.x, satA.y, dA, "ring s1", null, waveR >= dA),
    Circle(satB.x, satB.y, dB, "ring s2", null, waveR >= dB),
    Circle(satC.x, satC.y, dC, "ring s3", null, waveR >= dC),
    Group([
      Circle(falseCrossing.x, falseCrossing.y, 7, "xmark"),
      SvgText(falseCrossing.x + 12, falseCrossing.y + 4, heardCount == 3 ? "ruled out: not on C’s circle" : "a second candidate", "t-muted")
    ], null, null, heardCount == 3 ? 0.45 : 1, heardCount >= 2),
    Circle(you.x, you.y, 7, "xmark", null, heardCount == 2),
    Glyph("pin", you.x - 12, you.y - 36, 24, 36, "pin-you", null, heardCount == 3),
    SvgText(you.x + 14, you.y + 18, "you are here", "t-big", null, heardCount == 3),
    satellites
  ], "Three satellites send signals at the same moment. Expanding circles reach the receiver one after another; three circles share one point, the receiver's position."),
  Controls([
    Player("t", $t, 1000, 7500, "▶ Play", "❚❚ Pause", true),
    Scrubber("t", 0, 1000, 1, $t, "time since broadcast")
  ]),
  Readout(stageText)
], "Dashed rings are wavefronts still on their way. A solid ring locks in when its signal reaches you. Its radius is the measured distance. **In 3D the circles become spheres.** Two spheres meet in a circle, and a third sphere cuts that circle at two points. Usually one of those points is far out in space or deep inside Earth, so the receiver can rule it out.")
```

## 3 The fourth satellite fixes your clock

Figure 2 assumed your receiver knows the exact time. It doesn't. A phone has a quartz oscillator that costs a few cents and can drift by tens of microseconds per second. Light covers 300 m in one microsecond, so a 1 μs error makes every measured distance 300 m wrong.

Your clock's error is the same for every satellite, at the same moment. If your clock is ahead by *b*, every signal seems to take *b* longer to arrive, and every circle grows by the same amount, *c·b*. The circles stop meeting at one point. Because they all grow by the same amount, there is exactly one value of *b* that brings them back together.

So the receiver treats its clock error as one more unknown and solves for it. Its measurements are called *pseudoranges*, because each one includes the clock error:

```text
ρᵢ = √((xᵢ−x)² + (yᵢ−y)² + (zᵢ−z)²) + c·b    for i = 1 … 4
four unknowns: x, y, z (where you are) and b (how wrong your clock is)
```

In 3D there are four unknowns, so you need four satellites. On a flat page there are three unknowns: x, y and b. Use the slider to put the receiver clock out of step, then let the receiver solve for the error.

```openui
// Every circle grows by the same clock error. The three pairwise crossings nearest you form the
// orange triangle; it shrinks to a point when the error is zero.
$bErr = 34
ringA = {x: satA.x, y: satA.y, r: dA + $bErr}
ringB = {x: satB.x, y: satB.y, r: dB + $bErr}
ringC = {x: satC.x, y: satC.y, r: dC + $bErr}
abHits = @Intersect(ringA, ringB, you)
bcHits = @Intersect(ringB, ringC, you)
acHits = @Intersect(ringA, ringC, you)
ab = @First(abHits)
bc = @First(bcHits)
ac = @First(acHits)
crossCount = (@Count(abHits) > 0 ? 1 : 0) + (@Count(bcHits) > 0 ? 1 : 0) + (@Count(acHits) > 0 ? 1 : 0)
spread = @Max([@Distance(ab, bc), @Distance(bc, ac), @Distance(ab, ac)])
solved = @Abs($bErr) < 0.5
errUnits = @Abs(@Round($bErr))
biasText = solved ? "**Clock error ≈ 0.** All three circles meet at one point. The receiver now knows both where it is and what time it is." : "Receiver clock is **" + ($bErr > 0 ? "ahead" : "behind") + "** by " + errUnits + " units. Every signal seems to take " + ($bErr > 0 ? "longer" : "less time") + ", so every circle is " + errUnits + " units too " + ($bErr > 0 ? "big" : "small") + ". " + (crossCount < 3 ? "Some circles no longer even touch." : "The three crossings are **" + @Fixed(spread, 0) + " units** apart.")
root = Figure("FIG 3", "A wrong clock inflates every circle by the same amount", [
  Svg("0 0 640 460", [
    Circle(ringA.x, ringA.y, @Max([1, ringA.r]), "ring s1"),
    Circle(ringB.x, ringB.y, @Max([1, ringB.r]), "ring s2"),
    Circle(ringC.x, ringC.y, @Max([1, ringC.r]), "ring s3"),
    Polygon(crossCount == 3 ? [ab, bc, ac] : [], "mismatch"),
    Circle(ab.x, ab.y, 4, "crossing", null, @Count(abHits) > 0),
    Circle(bc.x, bc.y, 4, "crossing", null, @Count(bcHits) > 0),
    Circle(ac.x, ac.y, 4, "crossing", null, @Count(acHits) > 0),
    Circle(you.x, you.y, 14, "true-ring"),
    SvgText(you.x - 18, you.y + 30, "true position", "t-muted", "end"),
    satellites,
    Glyph("pin", you.x - 12, you.y - 36, 24, 36, "pin-you", null, solved)
  ], "The same three satellites with every circle enlarged or shrunk by the receiver's clock error. The pairwise crossings form a triangle around the true position that shrinks to a point at zero error."),
  Controls([
    Scrubber("bErr", -30, 60, 1, $bErr, "receiver clock error"),
    Player("bErr", $bErr, 0, 1100, "Solve for the clock error", null, false, false, "out")
  ]),
  Readout(biasText)
], "The orange triangle connects the three places where pairs of circles cross. The larger the clock error, the larger the triangle. The receiver adjusts *b* until the triangle shrinks to a point. In 2D that takes three satellites; in 3D, four. Errors are exaggerated so you can see them. **Side effect:** once the solution converges, your phone knows the time to within tens of nanoseconds. Cellular networks and power grids use GPS receivers as precision clocks for exactly this reason.")
```

## 4 Why nanoseconds matter

The receiver can only correct an error that is the same for every satellite, like its own clock error. It can't correct satellites that disagree with each other. If one satellite's clock is 10 ns off, that distance alone is 3 m wrong, and the position fix is wrong with it.

So the satellite clocks must agree with GPS time to within a few nanoseconds. Use the slider to see how fast a small timing error grows into a large position error.

```openui
// The slider is log10(ns) × 100: 0 is 1 ns, 600 is 1 ms. The ruler plots log10(ns) across.
$nsLog = 100
clockNs = @Pow(10, $nsLog / 100)
clockM = clockNs * 0.299792458
clockText = clockNs < 1000 ? @Precision(clockNs, 3) + " ns" : clockNs < 1000000 ? @Precision(clockNs / 1000, 3) + " μs" : @Precision(clockNs / 1000000, 3) + " ms"
distText = clockM < 1 ? @Precision(clockM * 100, 3) + " cm" : clockM < 1000 ? @Precision(clockM, 3) + " m" : @Precision(clockM / 1000, 3) + " km"
sizeRefs = [{m: 0.3, n: "a 30 cm ruler"}, {m: 1.7, n: "a person standing up"}, {m: 4.5, n: "a car"}, {m: 25, n: "a blue whale"}, {m: 105, n: "a football pitch"}, {m: 330, n: "the Eiffel Tower"}, {m: 1000, n: "a 12-minute walk"}, {m: 11500, n: "one day of uncorrected relativity"}, {m: 42195, n: "a marathon"}, {m: 290000, n: "Bengaluru to Chennai, as the crow flies"}]
closestRef = @First(@Sort(@Each(sizeRefs, "r", {n: r.n, gap: @Abs(@Log10(r.m / clockM))}), "gap")).n
nsText = "**" + clockText + "** of clock error → **" + distText + "** of distance error. Roughly " + closestRef + "." + (clockNs <= 10 ? " Within the GPS budget." : "")
decades = [{i: 0, a: "1 ns", b: "30 cm"}, {i: 1, a: "10 ns", b: "3 m"}, {i: 2, a: "100 ns", b: "30 m"}, {i: 3, a: "1 μs", b: "300 m"}, {i: 4, a: "10 μs", b: "3 km"}, {i: 5, a: "100 μs", b: "30 km"}, {i: 6, a: "1 ms", b: "300 km"}]
rulerMarks = @Each([{m: 1.7, n: "person", y: 30}, {m: 4.5, n: "car", y: 56}, {m: 25, n: "whale", y: 30}, {m: 330, n: "Eiffel Tower", y: 56}, {m: 11500, n: "1 day of relativity", y: 30}, {m: 290000, n: "Bengaluru → Chennai", y: 56}], "r", {x: @Log10(r.m / 0.299792458), y: r.y, n: r.n})
root = Figure("FIG 4", "From clock error to position error", [
  Svg("0 0 640 150", [Plot([0, 6], [150, 0], [40, 0, 560, 150], [
    Rect(0, 96, 6, 10, 5, "fill-grid"),
    Rect(0, 96, 1, 10, 5, "fill-ok", 0.35),
    SvgText(0, 90, "GPS budget", "t-muted c-ok"),
    Rect(0, 96, @Log10(clockNs), 10, 5, "fill-accent", 0.85),
    @Each(decades, "d", Group([
      Line(d.i, 108, d.i, 116, "axis"),
      SvgText(d.i, 130, d.a, "t-mono", "middle"),
      SvgText(d.i, 145, d.b, "t-muted", "middle")
    ])),
    @Each(rulerMarks, "r", Group([
      Line(r.x, r.y + 4, r.x, 94, "tick-ref"),
      Circle(r.x, 101, 2.5, "fill-muted"),
      SvgText(r.x, r.y, r.n, "t-muted", r.x > 5.14 ? "end" : "middle")
    ])),
    Group([Path("M0 0 L-7 -12 L7 -12 Z", "fill-accent")], null, null, null, null, [@Log10(clockNs), 94])
  ])], "A log scale from 1 nanosecond (30 centimetres) to 1 millisecond (300 kilometres), with familiar objects marked along it."),
  Controls([Scrubber("nsLog", 0, 600, 1, $nsLog, "clock error")]),
  Controls([
    Btn("Good atomic clock (≈2 ns)", Action([@Set($nsLog, 30.10299957)])),
    Btn("Phone quartz after 1 s (≈20 μs)", Action([@Set($nsLog, 430.10299957)])),
    Btn("Relativity, one day (≈38 μs)", Action([@Set($nsLog, 458.5460729)]))
  ]),
  Readout(nsText)
], "Position error = clock error × speed of light, at about **0.3 m per nanosecond**. An error of a few nanoseconds keeps GPS accurate to a few metres. One day of uncorrected relativity is about 38,000 ns.")
```

## 5 Relativity makes the orbiting clocks drift

A clock in orbit doesn't keep the same time as an identical clock on the ground. Two effects act on it, in opposite directions:

- **Special relativity: speed slows the clock.** A GPS satellite moves at about 3.9 km/s relative to Earth's centre. Clocks in motion tick more slowly, by about **7.2 μs per day** at that speed.
- **General relativity: height speeds the clock up.** Clocks deeper in a gravity field tick more slowly. The satellite sits 20,200 km above us, where Earth's gravity is weaker, so its clock gains about **45.7 μs per day** on a ground clock.

Gravity wins. Net, a GPS satellite clock runs **about 38.5 μs per day fast**. That's 4.5 parts in 10 billion, a tiny fraction, but it equals more than a thousand times the timing error GPS can tolerate.

```openui
// A simulated day runs in 9 s. The orbiting clock gains 38.5 μs/day unless the factory offset is on.
$clockHours = 0
$factoryFix = false
daySeconds = @Floor($clockHours * 3600)
dayHours = daySeconds / 3600
driftRate = $factoryFix ? 0 : 38.5
driftUs = driftRate * dayHours / 24
clockHms = @Pad(@Floor(daySeconds / 3600) % 24, 2) + ":" + @Pad(@Floor(daySeconds / 60) % 60, 2) + ":" + @Pad(daySeconds % 60, 2)
driftTenths = @Round(driftUs * 10)
orbitDigits = @Each([0, 1, 2, 3, 4, 5, 6], "i", Span(@Floor(driftTenths / @Pow(10, 6 - i)) % 10 + (i == 2 || i == 5 ? " " : ""), driftTenths > 0 && @Pow(10, 6 - i) <= driftTenths ? "hot" : ""))
root = Figure("FIG 5", "Two identical clocks, one on the ground and one in orbit", [
  Grid([
    Tile("On the ground", clockHms + ".000 000 0", "reference: GPS time", "clock"),
    Tile("In orbit, 20,200 km up", [Span(clockHms + "."), orbitDigits], [Span("gap: "), Span("+" + @Fixed(driftUs, 1) + " μs", $factoryFix ? "diff-big zero" : "diff-big")], "clock")
  ], 240),
  Svg("0 0 640 250", [Plot([0, 24], [-10, 50], [56, 20, 470, 190], [
    @Each([-10, 0, 10, 20, 30, 40, 50], "v", Group([
      Line(0, v, 24, v, v == 0 ? "axis" : "gridline"),
      SvgText(0, v, (v > 0 ? "+" : "") + v, "t-muted", "end", null, -8, 4)
    ])),
    @Each([0, 6, 12, 18, 24], "h", SvgText(h, -10, h + " h", "t-muted", "middle", null, null, 22)),
    SvgText(0, 50, "μs ahead", "t-muted", "start", null, -8, -6),
    Line(0, 0, 24, 45.7, "ghost stroke-s1"),
    Line(0, 0, 24, -7.2, "ghost stroke-s2"),
    Line(0, 0, 24, 38.5, "ghost stroke-accent"),
    SvgText(24, 45.7, "height +45.7", "t-muted s1", null, null, 6, 4),
    SvgText(24, 38.5, "net +38.5", "t-muted c-accent", null, null, 6, 4),
    SvgText(24, -7.2, "speed −7.2", "t-muted s2", null, null, 6, 4),
    Line(0, 0, dayHours, 45.7 * dayHours / 24, "live stroke-s1", $factoryFix ? 0.25 : 1),
    Line(0, 0, dayHours, -7.2 * dayHours / 24, "live stroke-s2", $factoryFix ? 0.25 : 1),
    Line(0, 0, dayHours, driftUs, $factoryFix ? "live-net stroke-ok" : "live-net stroke-accent"),
    Circle(dayHours, driftUs, 5, $factoryFix ? "fill-ok" : "fill-accent")
  ])], "How far the orbiting clock is from the ground clock over 24 hours: general relativity alone adds 45.7 microseconds, special relativity alone removes 7.2, and the net gap reaches 38.5 microseconds after one day."),
  Controls([
    Player("clockHours", $clockHours, 24, 9000, "▶ Run one day", "❚❚ Pause", true),
    Btn("Reset", Action([@Set($clockHours, 0)])),
    Check("factoryFix", "Apply the factory frequency offset (section 7)", $factoryFix)
  ]),
  Svg("0 0 640 92", [
    SvgText(0, 21, "General relativity (height)", "t"),
    Line(280, 4, 280, 28, "cursor"),
    Rect(280, 9, 239.75, 14, 3, "fill-s1"),
    SvgText(640, 21, "+45.7 μs", "t-mono", "end"),
    SvgText(0, 51, "Special relativity (speed)", "t"),
    Line(280, 34, 280, 58, "cursor"),
    Rect(242.2, 39, 37.8, 14, 3, "fill-s2"),
    SvgText(640, 51, "−7.2 μs", "t-mono", "end"),
    SvgText(0, 81, "Net, per day", "t-big"),
    Line(280, 64, 280, 88, "cursor"),
    Rect(280, 69, 201.95, 14, 3, "fill-accent"),
    SvgText(640, 81, "+38.5 μs", "t-big", "end")
  ], "Breakdown of the daily drift: +45.7 μs from height, −7.2 μs from speed, +38.5 μs net.")
], "Each clock readout shows ten-millionths of a second, the last digit. The two clocks agree to the microsecond place until the gap reaches about a microsecond, roughly 37 simulated minutes in. After that the orange digits climb steadily. A day takes about nine seconds here.")
```

### Why this orbit, in particular

The two effects depend on altitude in different ways. In low orbit you move fast and gain little from height, so your clock runs slow. Astronauts on the ISS age slightly less than people on the ground. Higher up, the gain from height takes over. The two effects cancel at about 3,200 km altitude.

```openui
// Weak-field rates for circular orbits: Δf/f ≈ ΔΦ/c² − v²/2c², in μs per day.
$altKm = 20200
muDay = 398600441800000 / 89875517873681764 * 86400000000
altCurve = @Each(@Seq(0, 40000, 200), "k", {k: k, gr: muDay * (1 / 6371000 - 1 / (6371000 + k * 1000)), sr: 0 - muDay / (6371000 + k * 1000) / 2})
orbitMarks = @Each([{k: 400, n: "ISS"}, {k: 20200, n: "GPS"}, {k: 35786, n: "geostationary"}], "p", {k: p.k, n: p.n, net: muDay * (1 / 6371000 - 1 / (6371000 + p.k * 1000)) - muDay / (6371000 + p.k * 1000) / 2})
altGr = muDay * (1 / 6371000 - 1 / (6371000 + $altKm * 1000))
altSr = 0 - muDay / (6371000 + $altKm * 1000) / 2
altNet = altGr + altSr
farEnd = @Last(altCurve)
altText = "At **" + @Locale($altKm) + " km**: height " + (altGr >= 0 ? "+" : "−") + @Fixed(@Abs(altGr), 1) + " μs, speed " + (altSr >= 0 ? "+" : "−") + @Fixed(@Abs(altSr), 1) + " μs, net **" + (altNet >= 0 ? "+" : "−") + @Fixed(@Abs(altNet), 1) + " μs per day**. The clock runs " + (altNet >= 0 ? "fast" : "slow") + "."
root = Figure("FIG 6", "Clock drift by orbit altitude (circular orbits)", [
  Svg("0 0 640 300", [Plot([0, 40000], [-35, 60], [60, 25, 540, 225], [
    @Each([-30, -15, 0, 15, 30, 45, 60], "v", Group([
      Line(0, v, 40000, v, v == 0 ? "axis" : "gridline"),
      SvgText(0, v, (v > 0 ? "+" : "") + v, "t-muted", "end", null, -8, 4)
    ])),
    @Each([0, 10000, 20000, 30000, 40000], "k", SvgText(k, -35, k / 1000 + "k km", "t-muted", "middle", null, null, 22)),
    SvgText(0, 60, "μs/day vs ground", "t-muted", null, null, -8, -11),
    Polyline(@Each(altCurve, "p", {x: p.k, y: p.gr}), "curve stroke-s1"),
    Polyline(@Each(altCurve, "p", {x: p.k, y: p.sr}), "curve stroke-s2"),
    Polyline(@Each(altCurve, "p", {x: p.k, y: p.gr + p.sr}), "live-net stroke-accent"),
    SvgText(40000, farEnd.gr, "height", "t-muted s1", "end", null, -4, -8),
    SvgText(40000, farEnd.sr, "speed", "t-muted s2", "end", null, -4, 16),
    Circle(3185.5, 0, 4, "hollow"),
    SvgText(3185.5, 0, "break-even ≈ 3190 km", "t-muted", null, null, 8, 16),
    @Each(orbitMarks, "p", Group([
      Circle(p.k, p.net, 5, "fill-accent"),
      SvgText(p.k, p.net, p.n + " " + (p.net > 0 ? "+" : "−") + @Fixed(@Abs(p.net), 1), "t", p.k > 30000 ? "end" : "start", null, p.k > 30000 ? -8 : 8, -10)
    ])),
    Line($altKm, 60, $altKm, -35, "cursor"),
    Circle($altKm, altNet, 6, "cursor-dot")
  ])], "Clock drift from 0 to 40,000 km altitude. The height gain rises, the speed loss shrinks, and the net crosses zero near 3,200 km. ISS −24.7, GPS +38.5, geostationary +46.5 microseconds per day."),
  Controls([Scrubber("altKm", 200, 40000, 100, $altKm, "altitude")]),
  Readout(altText)
], "Computed from the weak-field formulas (Δf/f ≈ ΔΦ/c² − v²/2c²) for a circular orbit, compared with a clock at rest at sea level. The small effect of Earth's rotation on the ground clock is left out.")
```

## 6 If nobody corrected it

Turn 38.5 μs into distance and you get **about 11.5 km of ranging error per day**, adding up day after day. After a week the error would be about the length of a big city.

```openui
// The slider counts tenths of an hour. The pin drifts 11.54 km/day (369 px at 32 px/km) in a
// wobbling direction; each trail point is that drift so far, at that hour's angle.
$mapTenths = 0
$mapFix = false
mapStep = @Round($mapTenths)
mapHours = mapStep / 10
pinTrail = $mapFix ? [] : @Each(@Seq(0, mapHours, 0.1), "k", @Polar(130, 330, 369.344308256 * k / 24, -0.55 + 0.32 * @Sin(k / 24 * 6.283185307179586 * 1.5) + 0.14 * @Sin(k / 24 * 6.283185307179586 * 4.3 + 1)))
pinNow = $mapFix ? {x: 130, y: 330} : @Last(pinTrail)
hoursText = mapStep % 10 == 0 ? @Fixed(mapHours, 0) : @Fixed(mapHours, 1)
mapText = $mapFix ? "With the correction applied, the pin stays on you. After " + hoursText + " h, the relativistic error is effectively **zero**." : "After **" + hoursText + " h** without correction, the timing error equals **" + @Fixed(11.542009633 * mapHours / 24, 2) + " km**."
root = Figure("FIG 7", "A pin that wanders away from you", [
  Svg("0 0 640 400", [
    Rect(0, 0, 640, 400, null, "fill-land"),
    @Each(@Seq(0, 640, 22), "x", Line(x, 0, x, 400, "street")),
    @Each(@Seq(0, 400, 22), "y", Line(0, y, 640, y, "street")),
    Rect(380, 262, 96, 58, 8, "fill-park"),
    Rect(58, 52, 80, 54, 8, "fill-park"),
    Path("M-10 214 C 120 172, 200 262, 320 232 S 520 140, 650 190", "river"),
    Ellipse(310, 205, 205, 150, "ringroad"),
    Path("M0 318 L640 292 M246 0 L276 400 M0 90 L640 130", "road"),
    Group([Rect(520, 330, 96, 16, 2, "fill-road")], "rotate(-14 568 338)"),
    SvgText(530, 372, "airport", "t-muted"),
    SvgText(404, 296, "park", "t-muted"),
    SvgText(560, 172, "river", "t-muted italic"),
    Polyline(pinTrail, "trail"),
    Line(130, 330, pinNow.x, pinNow.y, "link"),
    Glyph("pin", 118, 294, 24, 36, "pin-you"),
    SvgText(144, 334, "you", "t-big"),
    Glyph("pin", pinNow.x - 12, pinNow.y - 36, 24, 36, "pin-gps", null, !$mapFix && mapHours >= 0.05),
    SvgText(pinNow.x + 14, pinNow.y - 18, "GPS says", "t-big c-warn", null, !$mapFix && mapHours >= 0.3),
    Group([
      Rect(-8, -16, 160, 34, 6, "fill-panel", 0.9),
      Line(0, 6, 144, 6, "axis-thick"),
      Line(0, 1, 0, 11, "axis"),
      Line(72, 2, 72, 10, "axis"),
      Line(144, 1, 144, 11, "axis"),
      SvgText(0, -3, "0", "t-muted"),
      SvgText(72, -3, "2.25", "t-muted", "middle"),
      SvgText(144, -3, "4.5 km", "t-muted", "end")
    ], "translate(470 30)")
  ], "A city map, 20 kilometres wide. A green pin marks where you are; a red pin marks where uncorrected GPS would place you, drifting about 11.5 kilometres over 24 hours."),
  Controls([
    Player("mapTenths", $mapTenths, 240, 8000, "▶ Let a day pass", "❚❚ Pause"),
    Scrubber("mapTenths", 0, 240, 1, $mapTenths, "hours since last correction"),
    Check("mapFix", "Relativity correction applied", $mapFix)
  ]),
  Readout(mapText)
], "The size of the drift is real: about 11.5 km per day. The direction is made up. The wobbly path is only there to show that the error doesn't point in a straight line.")
```

> [!note] Fine print for the careful reader
> Relativity shifts every satellite clock by almost the same amount. A receiver would absorb much of a shared shift into its own clock unknown, *b*, the same way it does in Figure 3. So "your pin moves 11 km a day" exaggerates how one fix would look. The real damage is elsewhere. The satellites would no longer agree with GPS time, which the orbit data and corrections are all based on. Ground control would be fighting a drift it never stops. Any differences between satellites, such as orbit shape or each clock's own history, would leak straight into positions. 11.5 km a day measures the size of the problem, not where your pin would actually end up.

## 7 How the system corrects it

The fix is simple. The steady part of the drift is predictable, so the satellite clocks are built to tick slightly slow. GPS signals come from a 10.23 MHz master frequency. Before launch, each satellite's oscillator is set about 4.465 parts in 10¹⁰ lower. Once in orbit, seen from the ground, it ticks at exactly 10.23 MHz.

```openui
root = Figure("FIG 8", "Built slow on purpose", [
  Grid([
    Tile("Set on the ground", "10.229 999 995 43 MHz", null, "freq"),
    Tile("relativity adds 4.465 × 10⁻¹⁰ in orbit", "→", null, "arrow"),
    Tile("Seen from Earth, in orbit", "10.230 000 000 00 MHz", null, "freq")
  ], 150)
], "The main L1 signal is 154 × 10.23 MHz = 1575.42 MHz. Correcting the master frequency corrects every signal and every time stamp derived from it. In Figure 5, tick “Apply the factory frequency offset” to see the gap stay at zero.")
```

The fixed offset handles the steady drift. The remaining effects are smaller, and different parts of the system handle each one:

| Effect | Size | Who corrects it |
| --- | --- | --- |
| Steady relativistic drift (speed + height) | +38.5 μs/day | The satellite clock is set slow before launch |
| Slightly elliptical orbit: the clock speeds up and slows down as the satellite moves farther from and closer to Earth | up to ≈ ±46 ns | The receiver, using a one-line formula and the orbit data in the broadcast |
| Earth rotates while the signal is in flight (Sagnac effect) | up to ≈ 133 ns | The receiver, when it computes the satellite's position |
| Each satellite clock's own wander | a few ns | Ground control measures each clock and uploads correction terms in the broadcast |
| Signal slowed by the ionosphere and the lower atmosphere | metres to tens of metres | Receiver models; dual-frequency receivers measure it directly |

## What to remember

1. **GPS measures time, not distance.** Distance is travel time × the speed of light.
2. **Four satellites, four unknowns.** Three give you x, y and z. The fourth corrects your receiver's cheap clock, which is why you get both a position and very accurate time.
3. **1 ns ≈ 30 cm.** Satellite clocks must agree to within a few nanoseconds for metre-level accuracy.
4. **Orbiting clocks gain about 38 μs per day.** They gain about 45.7 μs from weaker gravity and lose about 7.2 μs from speed.
5. **The fix is built in.** Satellite oscillators are set 4.465 × 10⁻¹⁰ slow before launch, and receivers handle the smaller periodic effects.

### Numbers used in this document

| Quantity | Value |
| --- | --- |
| Speed of light, c | 299,792,458 m/s (≈ 0.3 m/ns) |
| GPS orbit radius / altitude | ≈ 26,560 km / ≈ 20,200 km |
| Orbital speed / period | ≈ 3.87 km/s / 11 h 58 min |
| Signal travel time (zenith → horizon) | ≈ 67 → 86 ms |
| Gravitational (height) effect | +45.7 μs/day |
| Velocity (speed) effect | −7.2 μs/day |
| Net effect | +38.5 μs/day ≈ 11.5 km/day |
| Factory frequency offset | −4.465 × 10⁻¹⁰ (10.22999999543 MHz) |

### Further reading

- Neil Ashby, “Relativity in the Global Positioning System”, *Living Reviews in Relativity* 6 (2003): [link.springer.com/article/10.12942/lrr-2003-1](https://link.springer.com/article/10.12942/lrr-2003-1)
- GPS interface specification IS-GPS-200 (signal and navigation message): [gps.gov/technical/icwg](https://www.gps.gov/technical/icwg/)
- GPS space segment overview: [gps.gov/systems/gps/space](https://www.gps.gov/systems/gps/space/)
