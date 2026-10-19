// Turns the ```openui blocks of one note into ONE OpenUI program, so blocks share names, $state and queries.
// Each block's `root` becomes _bN, wrapped in a Slot keyed by the block's text; the plugin portals each
// Slot into that block's spot in the note. Obsidian renders the prose, so it is left out.

const FENCE = /^```openui[^\n]*\n([\s\S]*?)^```[ \t]*$/gm;
const STATEMENT_NAME = /^(\$?[A-Za-z_]\w*)\s*=/gm;

// Source line distinguishes identical blocks. Hosts use the opening fence's zero-based line.
export function blockId(source: string, line = 0): string {
  let h = 5381;
  for (const ch of source.trim()) h = (h * 33) ^ ch.charCodeAt(0);
  return `${(h >>> 0).toString(36)}-${line}`;
}

export function statementNames(code: string): string[] {
  return [...code.matchAll(STATEMENT_NAME)].map((m) => m[1]);
}

export function stitch(md: string): { program: string; duplicates: string[] } {
  const slots: string[] = [];
  const lines: string[] = [];
  const seen = new Map<string, number>();

  const unquoted = md.replace(/^(?:[ \t]*>[ \t]?)+/gm, ""); // blocks inside callouts and quotes
  [...unquoted.matchAll(FENCE)].forEach((match, i) => {
    const body = match[1];
    const line = unquoted.slice(0, match.index).split("\n").length - 1;
    const n = i + 1;
    for (const name of statementNames(body)) seen.set(name, (seen.get(name) ?? 0) + 1);
    const code = body.replace(/^root(\s*=)/m, `_b${n}$1`);
    lines.push(code.trimEnd());
    if (code === body) return; // a block with no root is data-only
    slots.push(`_s${n}`);
    lines.push(`_s${n} = Slot("${blockId(body, line)}", _b${n})`);
  });

  const duplicates = [...seen].filter(([name, count]) => count > 1 && name !== "root").map(([name]) => name);
  return { program: [`root = Stack([${slots.join(", ")}])`, ...lines].join("\n"), duplicates };
}
