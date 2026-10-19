# Notes built on data

`templates/dashboard.md` is the starting point.

## Getting the data in

- **A file next to the note:** `sales = Query("file", { path: "data/sales.csv" }, { rows: [] })`. CSV becomes `sales.rows`, a list of objects keyed by the header; numbers are parsed. JSON is returned as parsed. Paths are relative to the vault (Obsidian) or the previewed folder (`openmd preview`).
- **Small data:** write it inline as a list of objects in a block with no `root`.
- The CSV reader is simple: no quoted commas. Pre-clean such files, or use JSON.

## Shaping it

- Pluck a column: `rows.amount` is the list of amounts.
- Filter: `@Filter(rows, "region", "==", $region)`, with operators `== != > < >= <= contains`. Chain filters for several conditions.
- Totals: `@Sum`, `@Avg`, `@Min`, `@Max`, `@Count`, `@Round(x, 1)`.
- Group by hand: `@Each(months, "m", @Sum(@Filter(rows, "month", "==", m).amount))`.
- Best or worst: `@First(@Sort(list, "field", "desc"))`.
- "All" filters: `shown = $region == "all" ? rows : @Filter(rows, "region", "==", $region)`.

## Showing it

- One block with no `root` holds the data, the filter state and every derived value. Each view is its own small block.
- Filters first (`Select`, `Scrubber`, `Input`), then headline numbers (`Grid` of `Tile`s or `CountUp`), then charts, then the table.
- Built-in charts (`BarChart`, `LineChart`, `PieChart`, `HorizontalBarChart`) suit categories. For exact axes, a custom scale or anything drawn on top, use `Svg` + `Plot` (see `figures.md`).
- Tables: `Table([Col("Month", rows.month), Col("Amount", rows.amount, "number")])`; sort first with `@Sort`.
- Say which filters each view ignores, if any, in the text around it.

## Rules

- Format numbers for people: `@Locale(n)` for thousands, `@Fixed(n, 1)` for decimals, units in the label.
- Totals in the headline numbers must match the chart and the table for the same filter. Derive all three from the same list.
- Say where the data comes from and when, in a line under the views.
