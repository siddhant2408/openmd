// The live viewer's server: lists the notes under a folder (or one note), serves them and the files
// their Query("file", …) blocks read, and tells open pages when anything changes.
import { spawn } from "node:child_process";
import { readdirSync, readFileSync, realpathSync, statSync, watch } from "node:fs";
import { createServer, type ServerResponse } from "node:http";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";

const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", json: "application/json" };

const SKIP = new Set(["node_modules", ".git", ".obsidian", ".trash"]);

export function serve(target: string, port: number, open: boolean) {
  const full = resolve(target);
  let stat;
  try {
    stat = statSync(full);
  } catch {
    console.error(`No such file or folder: ${target}`);
    process.exit(1);
  }
  const single = stat.isFile();
  const root = realpathSync(single ? dirname(full) : full);

  // ponytail: rescans the folder on every request; cache it if folders get huge.
  const notes = (): string[] => {
    if (single) return [basename(full)];
    const found: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith(".") || SKIP.has(entry.name)) continue;
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (entry.name.endsWith(".md")) found.push(relative(root, path).split(sep).join("/"));
        if (found.length >= 5000) return;
      }
    };
    walk(root);
    return found.sort((a, b) => a.localeCompare(b));
  };

  // Only files inside the folder being previewed can be read.
  const inside = (path: string) => {
    const p = resolve(root, path);
    if (p !== root && !p.startsWith(root + sep)) return null;
    const real = realpathSync(p);
    return real === root || real.startsWith(root + sep) ? real : null;
  };

  const assets = join(__dirname);
  const pages = new Set<ServerResponse>();
  const send = (res: ServerResponse, status: number, type: string, body: string | Buffer) => {
    res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
    res.end(body);
  };

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const path = url.searchParams.get("path") ?? "";
    try {
      switch (url.pathname) {
        case "/":
          return send(res, 200, "text/html; charset=utf-8", page(single ? basename(full) : basename(root)));
        case "/viewer.js":
          return send(res, 200, "text/javascript", readFileSync(join(assets, "viewer.js")));
        case "/viewer.css":
          return send(res, 200, "text/css", readFileSync(join(assets, "viewer.css")));
        case "/api/notes":
          return send(res, 200, "application/json", JSON.stringify(notes()));
        case "/api/note":
        case "/api/file": {
          const file = inside(path);
          if (!file) return send(res, 403, "text/plain", "Outside the previewed folder");
          return send(res, 200, TYPES[extname(file).slice(1).toLowerCase()] ?? "text/plain; charset=utf-8", readFileSync(file));
        }
        case "/api/events":
          res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
          res.write(": connected\n\n");
          pages.add(res);
          req.on("close", () => pages.delete(res));
          return;
        default:
          return send(res, 404, "text/plain", "Not found");
      }
    } catch (error) {
      send(res, 404, "text/plain", String((error as Error).message));
    }
  });

  // One event per changed file; the page refetches what it shows.
  const watcher = watch(root, { recursive: true }, (_event, file) => {
    if (!file || file.split(sep).some((part) => part.startsWith(".") || SKIP.has(part))) return;
    const data = `data: ${JSON.stringify(file.split(sep).join("/"))}\n\n`;
    for (const res of pages) res.write(data);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") return server.listen(++port, "127.0.0.1");
    throw error;
  });
  server.listen(port, "127.0.0.1", () => {
    const address = server.address();
    const actualPort = address && typeof address !== "string" ? address.port : port;
    const url = `http://127.0.0.1:${actualPort}/`;
    console.log(`openmd is previewing ${single ? full : `${root} (${notes().length} notes)`}\n${url}\nPress Ctrl+C to stop.`);
    if (open) spawn(process.platform === "darwin" ? "open" : process.platform === "win32" ? "explorer" : "xdg-open", [url], { stdio: "ignore", detached: true }).unref();
  });
  server.on("close", () => watcher.close());
  return server;
}

const page = (title: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title.replace(/[<&"]/g, "")} · openmd</title><link rel="stylesheet" href="/viewer.css"></head>
<body><div id="app"></div><script type="module" src="/viewer.js"></script></body></html>`;

