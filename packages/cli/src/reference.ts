// Every component and function, with the exact positional signature, straight from the live library.
// A word filters by name or description.
import { figureComponents, functions, library } from "@openmd/core";

type Spec = { signature: string; description?: string };

export function referenceText(filter = ""): string {
  const spec = library.toSpec() as { components: Record<string, Spec>; functions?: Record<string, Spec> };
  const word = filter.toLowerCase();
  const find = (name: string) => spec.components[name] ?? spec.functions![name];
  const shown = (name: string) => !word || name.toLowerCase().includes(word) || (find(name).description ?? "").toLowerCase().includes(word);

  const ours = new Set(["CountUp", "Progress", "Reveal", ...figureComponents.map((c) => c.name)]);
  const out: string[] = [];
  const section = (title: string, names: string[], prefix = "") => {
    const listed = names.filter(shown);
    if (!listed.length) return;
    out.push(`\n## ${title}\n`);
    for (const n of listed) out.push(`${prefix}${find(n).signature}${find(n).description ? `\n    ${find(n).description}` : ""}`);
  };

  const all = Object.keys(spec.components).filter((n) => n !== "Slot");
  section("Added by openmd", all.filter((n) => ours.has(n)));
  section("Functions added by openmd (call with @)", functions.map((f) => f.name), "@");
  section("OpenUI standard components", all.filter((n) => !ours.has(n)));
  if (!word)
    out.push('\n## Built-in functions\n\n@Count @First @Last @Sum @Avg @Min @Max @Sort @Filter @Round @Abs @Floor @Ceil @Each(list, "v", template)\nActions: Action([@Set($x, value), @Reset($x, …)])');
  return out.join("\n").trimStart();
}
