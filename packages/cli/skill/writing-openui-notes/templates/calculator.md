# What will this loan cost?

Set the amount, the interest rate and the term. The monthly payment (EMI), the total interest and the chart of what you still owe all update as you go.

```openui
// EMI = P · r · (1 + r)ⁿ / ((1 + r)ⁿ − 1), with r the monthly rate and n the number of months.
$loanAmount = 500000
$ratePct = 10
$termMonths = 36
monthlyRate = $ratePct / 12 / 100
growth = @Pow(1 + monthlyRate, $termMonths)
emi = $loanAmount * monthlyRate * growth / (growth - 1)
totalPaid = emi * $termMonths
interest = totalPaid - $loanAmount
root = Figure("FIG 1", "Your loan", [
  Controls([Scrubber("loanAmount", 50000, 2000000, 10000, $loanAmount, "amount (₹)")]),
  Controls([Scrubber("ratePct", 1, 24, 0.25, $ratePct, "interest (% a year)")]),
  Controls([Scrubber("termMonths", 6, 84, 6, $termMonths, "term (months)")]),
  Grid([
    Tile("monthly payment (EMI)", "₹" + @Locale(@Round(emi))),
    Tile("total interest", "₹" + @Locale(@Round(interest))),
    Tile("total you pay", "₹" + @Locale(@Round(totalPaid)))
  ]),
  Readout("Borrowing **₹" + @Locale($loanAmount) + "** at **" + $ratePct + "%** for **" + $termMonths + " months** costs **₹" + @Locale(@Round(interest)) + "** in interest, " + @Fixed(interest / $loanAmount * 100, 1) + "% of the amount.")
], "Try a longer term: the EMI drops, but **the total interest rises**.")
```

## What you still owe

Each payment covers that month's interest first, so the balance falls slowly at the start and faster at the end.

```openui
balanceCurve = @Each(@Seq(0, $termMonths, 1), "k", {x: k, y: $loanAmount * @Pow(1 + monthlyRate, k) - emi * (@Pow(1 + monthlyRate, k) - 1) / monthlyRate})
root = Figure("FIG 2", "Balance month by month", [
  Svg("0 0 640 290", [Plot([0, $termMonths], [0, $loanAmount], [80, 20, 520, 230], [
    @Each([0, 0.25, 0.5, 0.75, 1], "f", Group([
      Line(0, f * $loanAmount, $termMonths, f * $loanAmount, f == 0 ? "axis" : "gridline"),
      SvgText(0, f * $loanAmount, "₹" + @Locale(@Round(f * $loanAmount / 1000)) + "k", "t-muted", "end", null, -8, 4)
    ])),
    @Each([0, 0.25, 0.5, 0.75, 1], "f", SvgText(@Round(f * $termMonths), 0, @Round(f * $termMonths) + " mo", "t-muted", "middle", null, null, 20)),
    Polyline(balanceCurve, "live-net stroke-accent")
  ])], "The outstanding balance from the full amount down to zero over the term, curving: slow at first, faster at the end.")
], "Raise the rate in Figure 1: **the curve bulges higher**, because more of each early payment goes to interest and the balance stays high for longer.")
```

*EMI uses the standard reducing-balance formula. Real loans may add fees.*
