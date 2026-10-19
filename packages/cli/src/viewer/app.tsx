// The live viewer page. Markdown becomes HTML with an empty placeholder for every ```openui block;
// one OpenUI renderer per note portals each block's UI into its placeholder, as the Obsidian plugin does.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import MarkdownIt from "markdown-it";
import { Renderer } from "@openuidev/react-lang";
import { ThemeProvider } from "@openuidev/react-ui";
import "@openuidev/react-ui/styles/index.css";
import { RuntimeContext, blockId, fileQueryResult, library, stitch, type SlotTargets } from "@openmd/core";
import "@openmd/core/styles.css";
import "./viewer.css";

// Raw HTML in notes is shown as text: notes are often written by an AI, so they are not trusted.
const markdown = new MarkdownIt({ html: false, linkify: true });
const fence = markdown.renderer.rules.fence!;
markdown.renderer.rules.fence = (tokens, idx, options, env, self) =>
  tokens[idx].info.trim().split(/\s+/)[0] === "openui"
    ? `<div class="omd-block" data-omd-block="${blockId(tokens[idx].content)}"></div>`
    : fence(tokens, idx, options, env, self);

const api = (path: string, kind: "note" | "file") => `/api/${kind}?path=${encodeURIComponent(path)}`;
const folderOf = (path: string) => path.split("/").slice(0, -1).join("/");
const joinPath = (folder: string, href: string) => {
  const parts = (folder ? `${folder}/${href}` : href).split("/");
  const out: string[] = [];
  for (const p of parts) p === ".." ? out.pop() : p && p !== "." && out.push(p);
  return out.join("/");
};

// "> [!note] Title" blockquotes become callouts, as in Obsidian.
function decorateCallouts(root: HTMLElement) {
  for (const quote of root.querySelectorAll("blockquote")) {
    const first = quote.querySelector(":scope > p");
    const match = first?.textContent?.match(/^\[!(\w+)\][-+]?[ \t]*([^\n]*)/);
    if (!first || !match) continue;
    first.innerHTML = first.innerHTML.replace(/^\[!\w+\][-+]?[ \t]*[^\n<]*\n?/, "");
    if (!first.innerHTML.trim()) first.remove();
    const title = document.createElement("div");
    title.className = "omd-callout-title";
    title.textContent = match[2] || match[1][0].toUpperCase() + match[1].slice(1);
    quote.prepend(title);
    quote.classList.add("omd-callout", `omd-callout-${match[1].toLowerCase()}`);
  }
}

function useDark() {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const [dark, setDark] = useState(query.matches);
  useEffect(() => {
    const onChange = () => setDark(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  useEffect(() => void document.body.classList.toggle("theme-dark", dark), [dark]);
  return dark;
}

function Note({ path, text, dark }: { path: string; text: string; dark: boolean }) {
  const article = useRef<HTMLElement>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const html = useMemo(() => markdown.render(text), [text]);
  const { program, duplicates } = useMemo(() => stitch(text), [text]);

  // The note's block placeholders, for the Slots to portal into.
  const runtime = useMemo<SlotTargets & { notify: () => void }>(() => {
    const listeners = new Set<() => void>();
    return {
      targets: new Map(),
      subscribe: (fn) => (listeners.add(fn), () => void listeners.delete(fn)),
      notify: () => listeners.forEach((fn) => fn()),
    };
  }, []);

  useLayoutEffect(() => {
    const el = article.current!;
    el.innerHTML = html;
    decorateCallouts(el);
    for (const img of el.querySelectorAll("img")) {
      const src = img.getAttribute("src") ?? "";
      if (src && !/^[a-z]+:|^\//i.test(src)) img.src = api(joinPath(folderOf(path), src), "file");
    }
    runtime.targets.clear();
    for (const slot of el.querySelectorAll<HTMLElement>("[data-omd-block]")) runtime.targets.set(slot.dataset.omdBlock!, slot);
    runtime.notify();
  }, [html, path]);

  const tools = useMemo(
    () => ({
      // ponytail: data files are read once per note; edits to them show after reopening the note.
      file: async ({ path: file }: Record<string, unknown>) => {
        const res = await fetch(api(String(file), "file"));
        if (!res.ok) throw new Error(`No file at ${file}`);
        return fileQueryResult(await res.text(), String(file).split(".").pop() ?? "");
      },
    }),
    [],
  );

  // Links to other notes open in the viewer.
  const onClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a");
    const href = a?.getAttribute("href");
    if (!href || /^[a-z]+:/i.test(href) || !href.split("#")[0].endsWith(".md")) return;
    e.preventDefault();
    location.hash = encodeURIComponent(joinPath(folderOf(path), decodeURIComponent(href.split("#")[0])));
  };

  const shown = [...duplicates.map((n) => `"${n}" is defined in more than one block`), ...problems];
  return (
    <>
      {shown.length > 0 && (
        <div className="omd-problems" role="alert">
          <strong>openmd found {shown.length === 1 ? "a problem" : `${shown.length} problems`} in this note</strong>
          <ul>{shown.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
      )}
      <article ref={article} className="omd-note" onClick={onClick} />
      <RuntimeContext.Provider value={runtime}>
        <ThemeProvider mode={dark ? "dark" : "light"}>
          <div hidden>
            <Renderer
              library={library}
              response={program}
              toolProvider={tools}
              onError={(errors) => setProblems(errors.filter((e) => e.component !== "Slot").map((e) => `${e.component ? `${e.component}: ` : ""}${e.message.split(". Available components")[0]}`))}
            />
          </div>
        </ThemeProvider>
      </RuntimeContext.Provider>
    </>
  );
}

function App() {
  const dark = useDark();
  const [notes, setNotes] = useState<string[]>([]);
  const [hash, setHash] = useState(() => decodeURIComponent(location.hash.slice(1)));
  const [text, setText] = useState<string | null>(null);
  const current = notes.includes(hash) ? hash : notes[0];

  useEffect(() => {
    const onHash = () => setHash(decodeURIComponent(location.hash.slice(1)));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const loadNotes = () => fetch("/api/notes").then((r) => r.json()).then(setNotes);
  const loadNote = (path: string) => fetch(api(path, "note")).then((r) => (r.ok ? r.text() : `> [!warning] Can't open ${path}`)).then(setText);

  useEffect(() => void loadNotes(), []);
  useEffect(() => {
    if (current) loadNote(current);
  }, [current]);

  // The server sends the path of every file that changes.
  const live = useRef({ current });
  live.current.current = current;
  useEffect(() => {
    const events = new EventSource("/api/events");
    events.onmessage = (e) => {
      const changed = JSON.parse(e.data) as string;
      if (changed === live.current.current) loadNote(changed);
      if (changed.endsWith(".md")) loadNotes();
    };
    return () => events.close();
  }, []);

  useEffect(() => {
    const title = text?.match(/^# (.+)$/m)?.[1];
    document.title = `${title ?? current ?? "openmd"} · openmd`;
  }, [text, current]);

  return (
    <div className={notes.length > 1 ? "omd-app omd-with-list" : "omd-app"}>
      {notes.length > 1 && (
        <nav className="omd-list" aria-label="Notes">
          {notes.map((n) => (
            <a key={n} href={`#${encodeURIComponent(n)}`} aria-current={n === current ? "page" : undefined} title={n}>
              {n.replace(/\.md$/, "")}
            </a>
          ))}
        </nav>
      )}
      <main>
        {!notes.length ? <p className="omd-empty">No Markdown notes here yet. Save a .md file in this folder and it appears.</p> : text != null && current && <Note key={current} path={current} text={text} dark={dark} />}
      </main>
    </div>
  );
}

createRoot(document.getElementById("app")!).render(<App />);
