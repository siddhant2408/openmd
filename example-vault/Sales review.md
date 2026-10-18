# Sales review

The numbers come from `data/sales.csv` in this vault. Edit that file and reopen the note to see them change.

```openui
// Data-only block: no root, so it shows nothing, but every block below can use these names.
sales = Query("file", { path: "data/sales.csv" }, { rows: [] })
$month = "jan"
rows = @Filter(sales.rows, "month", "==", $month)
```

## Pick a month

Everything further down follows this choice.

```openui
root = Select("month", [SelectItem("jan", "January"), SelectItem("feb", "February"), SelectItem("mar", "March")], null, null, $month)
```

## Daily revenue

Some ordinary notes here. Obsidian renders this text; only the blocks are OpenUI.

```openui
root = BarChart(rows.day, [Series("Revenue", rows.amount)])
```

## Summary

> A callout or quote between blocks works too.

```openui
root = TextContent("Total: ₹" + @Sum(rows.amount) + " across " + @Count(rows) + " days", "large-heavy")
```
