import { createParser } from "@openuidev/lang-core";
import { library } from "./library";
import { stitch } from "./stitch";

export interface NoteProblems {
  errors: { message: string; component?: string; statementId?: string }[];
  unresolved: string[];
  duplicates: string[];
}

let parser: ReturnType<typeof createParser> | undefined;

// Parses a note's blocks against the library: type mismatches, unknown names, names defined twice.
export function checkNote(md: string): NoteProblems {
  parser ??= createParser(library.toJSONSchema());
  const { program, duplicates } = stitch(md);
  const { meta } = parser.parse(program);
  // A block whose root failed also reports an empty Slot; that one is noise.
  const errors = (meta.errors as NoteProblems["errors"]).filter((e) => e.component !== "Slot");
  return { errors, unresolved: meta.unresolved, duplicates };
}
