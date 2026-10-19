// Run: npm run check (bundles this with the real component library, then runs it)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createParser } from "@openuidev/lang-core";
import { library } from "./src/library";
import { blockId, stitch } from "./src/stitch";

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

// The figures note leans on the drawing, Player and maths additions.
{
  const { program, duplicates } = stitch(readFileSync("example-vault/How GPS knows where you are.md", "utf8"));
  const result = parser.parse(program);
  assert.deepEqual(duplicates, []);
  assert.deepEqual(result.meta.errors, []);
  assert.deepEqual(result.meta.unresolved, []);
  assert.ok("$bErr" in result.stateDeclarations);
}

assert.match(stitch(readFileSync("example-vault/Sales review.md", "utf8")).program, /^root = Stack\(\[_s2, _s3, _s4\]\)/); // block 1 is data-only
assert.equal(blockId("x = 1\n"), blockId("x = 1")); // Obsidian hands the processor the body without its trailing newline
assert.deepEqual(stitch("```openui\nx = 1\n```\n```openui\nx = 2\n```").duplicates, ["x"]);
assert.match(stitch("> [!note]\n> ```openui\n> root = TextContent(\"hi\")\n> ```").program, /_b1 = TextContent/);
console.log("ok");
