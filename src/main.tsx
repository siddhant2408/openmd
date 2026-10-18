import { MarkdownRenderChild, Plugin, TFile } from "obsidian";
import { createRoot } from "react-dom/client";
import { Renderer } from "@openuidev/react-lang";
import { ThemeProvider } from "@openuidev/react-ui";
import "@openuidev/react-ui/styles/index.css";
import { RuntimeContext, library } from "./library";
import { blockId, statementNames, stitch } from "./stitch";

// One OpenUI renderer per note. It is never on screen itself; its Slots portal into the blocks.
class NoteRuntime {
  targets = new Map<string, HTMLElement>();
  program = "";
  duplicates: string[] = [];
  private listeners = new Set<() => void>();
  private root = createRoot(document.createElement("div"));

  constructor(private plugin: IntrPlugin) {}

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  attach(id: string, el: HTMLElement) {
    this.targets.set(id, el);
    this.listeners.forEach((fn) => fn());
  }

  detach(id: string, el: HTMLElement) {
    if (this.targets.get(id) !== el) return;
    this.targets.delete(id);
    this.listeners.forEach((fn) => fn());
  }

  setText(md: string) {
    const { program, duplicates } = stitch(md);
    this.duplicates = duplicates;
    if (program === this.program) return;
    this.program = program;
    this.render();
  }

  render() {
    const mode = document.body.classList.contains("theme-dark") ? "dark" : "light";
    this.root.render(
      <RuntimeContext.Provider value={this}>
        <ThemeProvider mode={mode}>
          <Renderer
            library={library}
            response={this.program}
            toolProvider={this.plugin.tools}
            onError={(errors) => errors.length && console.warn("[intr]", errors)}
          />
        </ThemeProvider>
      </RuntimeContext.Provider>,
    );
  }

  destroy() {
    this.root.unmount();
  }
}

// ponytail: naive CSV (no quoted commas); swap for a real parser when data needs it.
function parseCsv(text: string) {
  const [header, ...rows] = text.trim().split(/\r?\n/).map((line) => line.split(",").map((cell) => cell.trim()));
  return rows.map((cells) =>
    Object.fromEntries(header.map((key, i) => [key, cells[i] !== "" && !isNaN(Number(cells[i])) ? Number(cells[i]) : cells[i]])),
  );
}

export default class IntrPlugin extends Plugin {
  // ponytail: one runtime per opened note, kept until the plugin unloads; evict on file close if memory matters.
  private runtimes = new Map<string, NoteRuntime>();

  tools = {
    // Query("file", { path: "data/sales.csv" }, { rows: [] }) -> { rows } for CSV, the parsed value for JSON.
    file: async ({ path }: Record<string, unknown>) => {
      const file = this.app.vault.getFileByPath(String(path));
      if (!file) throw new Error(`No file at ${path}`);
      const text = await this.app.vault.cachedRead(file);
      return file.extension === "json" ? JSON.parse(text) : { rows: parseCsv(text) };
    },
  };

  async onload() {
    this.registerMarkdownCodeBlockProcessor("openui", (source, el, ctx) => {
      const runtime = this.runtime(ctx.sourcePath);
      const text = ctx.getSectionInfo(el)?.text;
      if (text) runtime.setText(text);

      const clashes = statementNames(source).filter((name) => runtime.duplicates.includes(name));
      if (clashes.length) el.createDiv({ cls: "intr-warning", text: `Also defined in another block: ${clashes.join(", ")}` });

      const id = blockId(source);
      const target = el.createDiv({ cls: "intr-block" });
      runtime.attach(id, target);
      const child = new MarkdownRenderChild(target);
      child.onunload = () => runtime.detach(id, target);
      ctx.addChild(child);
    });

    // Re-stitch on save, so deleting or adding a block elsewhere in the note is picked up.
    this.registerEvent(
      this.app.vault.on("modify", async (file) => {
        const runtime = this.runtimes.get(file.path);
        if (runtime && file instanceof TFile) runtime.setText(await this.app.vault.cachedRead(file));
      }),
    );
    this.registerEvent(this.app.workspace.on("css-change", () => this.runtimes.forEach((r) => r.render())));
  }

  onunload() {
    this.runtimes.forEach((r) => r.destroy());
  }

  private runtime(path: string): NoteRuntime {
    let runtime = this.runtimes.get(path);
    if (!runtime) {
      runtime = new NoteRuntime(this);
      this.runtimes.set(path, runtime);
      const file = this.app.vault.getFileByPath(path);
      if (file) void this.app.vault.cachedRead(file).then((text) => runtime!.setText(text));
    }
    return runtime;
  }
}
