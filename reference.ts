// Run: npm run reference [-- word]  — prints every component and function the plugin offers, with the
// exact positional signature, straight from the live library. A word filters by name or description.
import { library } from "./src/library";
import { figureComponents, functions } from "./src/figures";

const spec = library.toSpec() as {
  components: Record<string, { signature: string; description?: string }>;
  functions?: Record<string, { signature: string; description?: string }>;
};
const filter = (process.argv[2] ?? "").toLowerCase();
const show = (name: string, s: { signature: string; description?: string }) =>
  !filter || name.toLowerCase().includes(filter) || (s.description ?? "").toLowerCase().includes(filter);

const ours = new Set(["CountUp", "Progress", "Reveal", ...figureComponents.map((c) => c.name)]);
const section = (title: string, names: string[], prefix = "") => {
  const lines = names.filter((n) => show(n, spec.components[n] ?? spec.functions![n]));
  if (!lines.length) return;
  console.log(`\n## ${title}\n`);
  for (const n of lines) {
    const s = spec.components[n] ?? spec.functions![n];
    console.log(`${prefix}${s.signature}${s.description ? `\n    ${s.description}` : ""}`);
  }
};

const all = Object.keys(spec.components).filter((n) => n !== "Slot");
section("Added by this plugin", all.filter((n) => ours.has(n)));
section("Functions added by this plugin (call with @)", functions.map((f) => f.name), "@");
section("OpenUI standard components", all.filter((n) => !ours.has(n)));
if (!filter)
  console.log("\n## Built-in functions\n\n@Count @First @Last @Sum @Avg @Min @Max @Sort @Filter @Round @Abs @Floor @Ceil @Each(list, \"v\", template)\nActions: Action([@Set($x, value), @Reset($x, …)])");
