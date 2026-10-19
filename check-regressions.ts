import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { test } from "node:test";
import MarkdownIt from "markdown-it";
import { blockId, stitch } from "./packages/core/src/stitch";
import { serve } from "./packages/cli/src/serve";

// Use only disposable, non-personal fixtures under the checkout's ignored build folder.
mkdirSync("dist", { recursive: true });
const fixture = mkdtempSync(resolve("dist/preview-test-"));
const root = join(fixture, "notes");
mkdirSync(root);
writeFileSync(join(root, "note.md"), "# Preview test");
writeFileSync(join(fixture, "outside.txt"), "outside marker");
symlinkSync(join(fixture, "outside.txt"), join(root, "escape.txt"));
symlinkSync(join(root, "note.md"), join(root, "inside.md"));
// A symlinked preview root should work without weakening containment.
symlinkSync(root, join(fixture, "linked-root"), "dir");
const server = serve(join(fixture, "linked-root"), 0, false);
await once(server, "listening");
const address = server.address();
assert.ok(address && typeof address !== "string");
const url = `http://127.0.0.1:${address.port}`;

try {
  await test("preview listens only on IPv4 loopback", () => {
    assert.equal(address.address, "127.0.0.1");
  });
  await test("port fallback also stays on loopback", async () => {
    const fallback = serve(root, address.port, false);
    await new Promise<void>((done) => fallback.once("listening", done));
    try {
      const bound = fallback.address();
      assert.ok(bound && typeof bound !== "string");
      assert.equal(bound.address, "127.0.0.1");
      assert.notEqual(bound.port, address.port);
    } finally {
      await new Promise<void>((done, reject) => fallback.close((error) => error ? reject(error) : done()));
    }
  });
  await test("preview serves notes and symlinks that remain inside its root", async () => {
    const response = await fetch(`${url}/api/file?path=inside.md`);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "# Preview test");
  });
  await test("both file endpoints reject symlink escapes", async () => {
    for (const endpoint of ["file", "note"]) {
      const response = await fetch(`${url}/api/${endpoint}?path=escape.txt`);
      assert.equal(response.status, 403);
    }
  });
  await test("preview rejects traversal and sibling-prefix paths", async () => {
    for (const path of ["../outside.txt", join(fixture, "notes-sibling/file.txt")]) {
      assert.equal((await fetch(`${url}/api/file?path=${encodeURIComponent(path)}`)).status, 403);
    }
  });
  await test("missing files still return 404", async () => {
    assert.equal((await fetch(`${url}/api/file?path=missing.csv`)).status, 404);
  });
} finally {
  await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
  rmSync(fixture, { recursive: true, force: true });
}

await test("identical blocks have distinct placement IDs matching source lines", () => {
  const body = 'root = TextContent("hello")';
  const md = `# Title\n\n\`\`\`openui\n${body}\n\`\`\`\n\nText\n\n\`\`\`openui\n${body}\n\`\`\``;
  const ids = [...stitch(md).program.matchAll(/Slot\("([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2);
  assert.deepEqual(ids, [blockId(body, 2), blockId(body, 8)]);
  const tokens = new MarkdownIt().parse(md, {}).filter((token) => token.type === "fence");
  assert.deepEqual(ids, tokens.map((token) => blockId(token.content, token.map![0])));
});
await test("callout block placement uses its original line number", () => {
  const body = 'root = TextContent("hello")';
  assert.ok(stitch(`> [!note]\n> \`\`\`openui\n> ${body}\n> \`\`\``).program.includes(`Slot("${blockId(body, 1)}"`));
});
