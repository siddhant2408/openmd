import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { checkNote } from "@openmd/core";
import { referenceText } from "./reference";
import { serve } from "./serve";

const pkgDir = join(__dirname, "..");
const skillDir = join(pkgDir, "skill", "writing-openui-notes");

const help = `openmd: interactive Markdown notes

  openmd preview [folder | note.md]   live viewer at http://localhost:8765, updates as files change
  openmd check <note.md> [...]        report problems in the notes' openui blocks
  openmd reference [word]             every component and function, with exact signatures
  openmd prompt                       a guide to paste into AI assistants that can't run commands
  openmd install-skill [--dir <dir>]  install the writing-openui-notes skill (default ~/.claude/skills)
`;

const [command, ...args] = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};

switch (command) {
  case "preview": {
    const port = Number(flag("--port") ?? 8765);
    const open = !args.includes("--no-open");
    serve(args.find((a) => !a.startsWith("--")) ?? ".", port, open);
    break;
  }
  case "check": {
    if (!args.length) fail("Usage: openmd check <note.md> [...]");
    let bad = 0;
    for (const file of args) {
      const problems = checkNote(readFileSync(file, "utf8"));
      const lines = [
        ...problems.duplicates.map((n) => `"${n}" is defined in more than one block`),
        ...problems.unresolved.map((n) => `"${n}" is used but never defined`),
        // Unknown-component errors list the whole catalogue; point at the reference instead.
        ...problems.errors.map((e) => `${e.component ? `${e.component}: ` : ""}${e.message.split(". Available components")[0]}`),
      ];
      if (lines.length) bad++;
      console.log(lines.length ? `✗ ${file}\n${lines.map((l) => `    ${l}`).join("\n")}` : `✓ ${file}`);
    }
    if (bad) console.log("\nRun `openmd reference` for every component's signature.");
    process.exit(bad ? 1 : 0);
  }
  case "reference":
    console.log(referenceText(args[0]));
    break;
  case "prompt": {
    // The skill without its frontmatter and the steps that need a terminal, then the full reference.
    const skill = readFileSync(join(skillDir, "SKILL.md"), "utf8")
      .replace(/^---[\s\S]*?---\s*/, "")
      .replace(/## Workflow[\s\S]*?(?=\n## )/, "");
    console.log(`${skill.trim()}\n\n# Every component and function\n\n${referenceText()}`);
    break;
  }
  case "install-skill": {
    const dest = join(flag("--dir") ?? join(homedir(), ".claude", "skills"), "writing-openui-notes");
    if (existsSync(dest) && realpathSync(dest) === realpathSync(skillDir)) {
      console.log(`Already installed: ${dest} links to this package's skill.`);
      break;
    }
    mkdirSync(dest, { recursive: true });
    cpSync(skillDir, dest, { recursive: true });
    console.log(`Installed the writing-openui-notes skill in ${dest}`);
    break;
  }
  case undefined:
  case "help":
  case "--help":
  case "-h":
    console.log(help);
    break;
  default:
    fail(`Unknown command "${command}".\n\n${help}`);
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
