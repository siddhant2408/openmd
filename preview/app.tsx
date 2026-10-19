// Renders a note's openui blocks in a plain browser page, with the plugin's real library, so animations
// and controls can be tried without Obsidian. The prose is left out. Add ?theme=dark for the dark palette.
import { createRoot } from "react-dom/client";
import { Renderer } from "@openuidev/react-lang";
import { ThemeProvider } from "@openuidev/react-ui";
import "@openuidev/react-ui/styles/index.css";
import { library } from "../src/library";
import { stitch } from "../src/stitch";

const dark = new URLSearchParams(location.search).get("theme") === "dark";
document.body.classList.toggle("theme-dark", dark);

fetch("note.md")
  .then((r) => r.text())
  .then((md) => {
    const { program, duplicates } = stitch(md);
    if (duplicates.length) console.warn("[intr] defined in more than one block:", duplicates);
    // No Obsidian blocks to portal into, so show each block's root in order instead of its Slot.
    const roots = [...program.matchAll(/^(_b\d+) =/gm)].map((m) => m[1]);
    const flat = program.replace(/^root = .*$/m, `root = Stack([${roots.join(", ")}])`).replace(/^_s\d+ = Slot.*$/gm, "");
    createRoot(document.getElementById("app")!).render(
      <ThemeProvider mode={dark ? "dark" : "light"}>
        <Renderer library={library} response={flat} onError={(errors) => errors.length && console.warn("[intr]", JSON.stringify(errors))} />
      </ThemeProvider>,
    );
  });
