// Run: npm run preview -- "path/to/note.md"  — serves the note's blocks at http://localhost:8765.
// Saving the note updates the page on the next reload.
import * as esbuild from "esbuild";
import { copyFileSync, mkdirSync, watchFile, writeFileSync } from "node:fs";

const note = process.argv[2];
if (!note) {
  console.error('Usage: npm run preview -- "path/to/note.md"');
  process.exit(1);
}
const out = "dist/preview";
mkdirSync(out, { recursive: true });
const copyNote = () => copyFileSync(note, `${out}/note.md`);
copyNote();
watchFile(note, { interval: 500 }, copyNote);
copyFileSync("styles.extra.css", `${out}/styles.extra.css`);
writeFileSync(
  `${out}/index.html`,
  `<!doctype html><html><head><meta charset="utf-8"><title>OpenUI note preview</title>
<link rel="stylesheet" href="app.css"><link rel="stylesheet" href="styles.extra.css">
<style>
  :root { --font-monospace: ui-monospace, Menlo, monospace; --font-interface: -apple-system, BlinkMacSystemFont, sans-serif; }
  body { font: 16px var(--font-interface); max-width: 760px; margin: 20px auto; padding: 0 16px; background: #fbfaf7; }
  body.theme-dark { background: #0f1115; color: #e6e8ec; }
</style></head>
<body><div class="intr-block" id="app"></div><script type="module" src="app.js"></script></body></html>`,
);

const ctx = await esbuild.context({
  entryPoints: ["preview/app.tsx"],
  bundle: true,
  format: "esm",
  jsx: "automatic",
  outdir: out,
  define: { "process.env.NODE_ENV": '"development"' },
  logLevel: "warning",
});
await ctx.rebuild();
const { port } = await ctx.serve({ servedir: out, port: 8765 });
console.log(`Preview of ${note}: http://localhost:${port}/  (add ?theme=dark for dark mode)`);
