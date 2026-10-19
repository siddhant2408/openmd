// Run: npm run check (bundles this with the real component library, then runs it, then type-checks)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createParser } from "@openuidev/lang-core";
import { blockId, library, stitch } from "@openmd/core";

const parser = createParser(library.toJSONSchema());

// Every demo note must stitch into a program that parses cleanly against the plugin's library.
for (const note of ["Sales review.md", "Q1 store review.md"]) {
  const { program, duplicates } = stitch(readFileSync(`example-vault/${note}`, "utf8"));
  const result = parser.parse(program);
  assert.deepEqual(duplicates, [], note);
  assert.deepEqual(result.meta.errors, [], note);
  assert.deepEqual(result.meta.unresolved, [], note);
  assert.ok("$month" in result.stateDeclarations, note);
}

// The figures note and the skill's templates must parse cleanly too.
const skill = "packages/cli/skill/writing-openui-notes";
for (const path of ["example-vault/How GPS knows where you are.md", ...["explainer", "dashboard", "calculator"].map((t) => `${skill}/templates/${t}.md`)]) {
  const { program, duplicates } = stitch(readFileSync(path, "utf8"));
  const result = parser.parse(program);
  assert.deepEqual(duplicates, [], `${path}: names defined in more than one block`);
  assert.deepEqual(result.meta.errors, [], `${path}: parse errors`);
  assert.deepEqual(result.meta.unresolved, [], `${path}: unknown names`);
}

assert.match(stitch(readFileSync("example-vault/Sales review.md", "utf8")).program, /^root = Stack\(\[_s2, _s3, _s4\]\)/); // block 1 is data-only
assert.equal(blockId("x = 1\n"), blockId("x = 1")); // Obsidian hands the processor the body without its trailing newline
assert.deepEqual(stitch("```openui\nx = 1\n```\n```openui\nx = 2\n```").duplicates, ["x"]);
assert.match(stitch("> [!note]\n> ```openui\n> root = TextContent(\"hi\")\n> ```").program, /_b1 = TextContent/);
console.log("ok");
