# Sign-ups by channel, January to April

Monthly sign-ups from search, social and referrals. Pick a channel and every number, the chart and the table below follow.

```openui
// The data. For a real file next to the note, use instead:
//   signups = Query("file", { path: "data/signups.csv" }, { rows: [] }).rows
signups = [
  {month: "Jan", channel: "search", count: 420}, {month: "Jan", channel: "social", count: 180}, {month: "Jan", channel: "referral", count: 95},
  {month: "Feb", channel: "search", count: 455}, {month: "Feb", channel: "social", count: 240}, {month: "Feb", channel: "referral", count: 110},
  {month: "Mar", channel: "search", count: 430}, {month: "Mar", channel: "social", count: 310}, {month: "Mar", channel: "referral", count: 160},
  {month: "Apr", channel: "search", count: 490}, {month: "Apr", channel: "social", count: 285}, {month: "Apr", channel: "referral", count: 205}
]
months = ["Jan", "Feb", "Mar", "Apr"]
$channel = "all"
shown = $channel == "all" ? signups : @Filter(signups, "channel", "==", $channel)
monthTotals = @Each(months, "m", @Sum(@Filter(shown, "month", "==", m).count))
total = @Sum(shown.count)
bestMonth = @First(@Sort(@Each(months, "m", {m: m, n: @Sum(@Filter(shown, "month", "==", m).count)}), "n", "desc"))
```

## Filter

```openui
root = Select("channel", [SelectItem("all", "All channels"), SelectItem("search", "Search"), SelectItem("social", "Social"), SelectItem("referral", "Referral")], null, null, $channel)
```

## Headline numbers

```openui
root = Grid([
  Tile("sign-ups, January to April", @Locale(total)),
  Tile("best month", bestMonth.m + " · " + @Locale(bestMonth.n)),
  Tile("average per month", @Locale(@Round(total / 4)))
])
```

## Month by month

```openui
root = BarChart(months, [Series("Sign-ups", monthTotals)])
```

## All rows

```openui
sortedRows = @Sort(shown, "count", "desc")
root = Table([Col("Month", sortedRows.month), Col("Channel", sortedRows.channel), Col("Sign-ups", sortedRows.count, "number")])
```

*Numbers are made up for this template. Replace `signups` with your data.*
