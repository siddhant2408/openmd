// What Query("file", { path }) returns, whichever host read the file: the parsed value for JSON,
// { rows } for CSV.
export function fileQueryResult(text: string, extension: string): unknown {
  return extension.toLowerCase() === "json" ? JSON.parse(text) : { rows: parseCsv(text) };
}

// ponytail: naive CSV (no quoted commas); swap for a real parser when data needs it.
export function parseCsv(text: string) {
  const [header, ...rows] = text.trim().split(/\r?\n/).map((line) => line.split(",").map((cell) => cell.trim()));
  return rows.map((cells) =>
    Object.fromEntries(header.map((key, i) => [key, cells[i] !== "" && !isNaN(Number(cells[i])) ? Number(cells[i]) : cells[i]])),
  );
}
