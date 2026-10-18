# Q1 store review

A test of connected blocks. All the numbers come from two files in this vault: `data/orders.csv` (60 orders) and `data/targets.json`. Every block below reads the same filters, so changing one control updates the whole note.

```openui
// ── Data and shared state. No root, so this block shows nothing. ──
orders = Query("file", { path: "data/orders.csv" }, { rows: [] })
targets = Query("file", { path: "data/targets.json" }, { monthly: {}, regional: {} })

$month = "mar"
$region = "all"
$minAmount = [0]
$search = ""
$sortBy = "amount"

inMonth = @Filter(orders.rows, "month", "==", $month)
inRegion = $region == "all" ? inMonth : @Filter(inMonth, "region", "==", $region)
bigEnough = @Filter(inRegion, "amount", ">=", $minAmount[0])
matched = @Filter(bigEnough, "customer", "contains", $search)
paid = @Filter(matched, "status", "==", "paid")
refunded = @Filter(matched, "status", "==", "refunded")

revenue = @Sum(paid.amount)
target = $region == "all" ? targets.monthly[$month] : targets.regional[$month][$region]
progress = target > 0 ? @Round(revenue / target * 100, 1) : 0
refundRate = @Count(matched) > 0 ? @Round(@Count(refunded) / @Count(matched) * 100, 1) : 0
avgRating = @Round(@Avg(matched.rating), 1)
```

## Filters

Pick a month and region, set a minimum order size, or search for a customer.

```openui
monthPick = Select("month", [SelectItem("jan", "January"), SelectItem("feb", "February"), SelectItem("mar", "March")], null, null, $month)
regionPick = Select("region", [SelectItem("all", "All regions"), SelectItem("north", "North"), SelectItem("south", "South"), SelectItem("east", "East"), SelectItem("west", "West")], null, null, $region)
minPick = Slider("minAmount", "discrete", 0, 10000, 500, [0], "Minimum order (₹)", null, $minAmount)
searchBox = Input("search", "Customer name contains…", "text", null, $search)
resetBtn = Button("Reset filters", Action([@Reset($month, $region, $minAmount, $search)]), "secondary", "normal", "small")
root = Stack([Stack([monthPick, regionPick], "row", "m"), minPick, Stack([searchBox, resetBtn], "row", "m", "center")], "column", "m")
```

## Headline numbers

```openui
kpis = Stack([
  Card([CountUp(revenue, "₹"), TextContent("Paid revenue", "small")]),
  Card([CountUp(@Count(paid)), TextContent("Paid orders, out of " + @Count(matched), "small")]),
  Card([CountUp(avgRating, null, " ★", 1), TextContent("Average rating", "small")])
], "row", "m", null, null, true)
goal = Card([Progress(revenue, target, "Progress to the ₹" + target + " target")])
status = progress >= 100 ? TextCallout("success", "On target", "Revenue has met the target for this selection.") : progress >= 80 ? TextCallout("warning", "Close", "Within 20% of the target.") : TextCallout("danger", "Behind target", "More than 20% short of the target.")
root = Reveal([kpis, goal, status], "slide")
```

The numbers roll to their new values when you change a filter, and the bar slides to the new percentage. The bar and the box below it both turn green at 100% of target, amber from 80%, red below that.

## Breakdown

```openui
monthPaid = @Filter(@Filter(orders.rows, "month", "==", $month), "status", "==", "paid")
regionScope = $region == "all" ? orders.rows : @Filter(orders.rows, "region", "==", $region)
trendPaid = @Filter(regionScope, "status", "==", "paid")
trend = [@Sum(@Filter(trendPaid, "month", "==", "jan").amount), @Sum(@Filter(trendPaid, "month", "==", "feb").amount), @Sum(@Filter(trendPaid, "month", "==", "mar").amount)]

categoryTotals = [@Sum(@Filter(paid, "category", "==", "apparel").amount), @Sum(@Filter(paid, "category", "==", "footwear").amount), @Sum(@Filter(paid, "category", "==", "accessories").amount)]
regionTotals = [@Sum(@Filter(monthPaid, "region", "==", "north").amount), @Sum(@Filter(monthPaid, "region", "==", "south").amount), @Sum(@Filter(monthPaid, "region", "==", "east").amount), @Sum(@Filter(monthPaid, "region", "==", "west").amount)]
regionTargets = [targets.regional[$month].north, targets.regional[$month].south, targets.regional[$month].east, targets.regional[$month].west]

root = Reveal([Tabs([
  TabItem("trend", "Trend", [LineChart(["Jan", "Feb", "Mar"], [Series("Paid revenue", trend)], "natural")]),
  TabItem("category", "By category", [PieChart(["Apparel", "Footwear", "Accessories"], categoryTotals, "donut")]),
  TabItem("region", "By region", [HorizontalBarChart(["North", "South", "East", "West"], [Series("Revenue", regionTotals), Series("Target", regionTargets)])])
])], "fade")
```

The trend tab ignores the month filter (it always shows Jan to Mar) but follows the region. The region tab ignores the region filter and always compares all four.

## Region cards

One card per region, built by a loop (`@Each`) instead of being written out four times. The cards pop in one after another, and each has its own bar toward that region's target.

```openui
delays = { north: 0, south: 120, east: 240, west: 360 }
regionCard = @Each(["north", "south", "east", "west"], "r", Reveal([Card([
  CardHeader(r),
  CountUp(@Sum(@Filter(monthPaid, "region", "==", r).amount), "₹", null, null, "medium"),
  Progress(@Sum(@Filter(monthPaid, "region", "==", r).amount), targets.regional[$month][r], "of target")
])], "scale", delays[r]))
root = Stack(regionCard, "row", "m", null, null, true)
```

## Orders

```openui
sortPick = Select("sortBy", [SelectItem("amount", "Sort by amount"), SelectItem("date", "Sort by date"), SelectItem("rating", "Sort by rating")], null, null, $sortBy, "small")
sorted = @Sort(matched, $sortBy, "desc")
table = Table([Col("Order", sorted.id), Col("Date", sorted.date), Col("Customer", sorted.customer), Col("Region", sorted.region), Col("Category", sorted.category), Col("Amount", sorted.amount, "number"), Col("Status", sorted.status), Col("Rating", sorted.rating, "number")])
root = Stack([Stack([TextContent("Showing " + @Count(sorted) + " orders"), sortPick], "row", "m", "center", "between"), table], "column", "s")
```

## Refunds check

> [!note] A block inside a callout
> This tests a block nested inside an Obsidian callout.
>
> ```openui
> root = refundRate > 10 ? TextCallout("danger", "Refunds are high", refundRate + "% of the selected orders were refunded.") : TextCallout("success", "Refunds look normal", refundRate + "% of the selected orders were refunded.")
> ```

## Things to try

1. Switch the month to **January**: every number, the region cards and the table should change.
2. Pick **North**: the trend line and the KPIs narrow to that region, while the region tab still shows all four.
3. Drag the slider up to ₹5,000: smaller orders drop out of the KPIs, the pie and the table.
4. Type a name such as `Meera` in the search box.
5. Click **Reset filters**.
6. Watch the animations: the headline numbers and region amounts roll to new values, the bars slide, and sections fade or pop in when the note opens.
