import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Scanner, ScanResult } from "./types.js";
import { walkFiles } from "../utils/file-walker.js";

const TODO_REGEX = /\/\/\s*(TODO|FIXME|HACK|XXX)\s*:?\s*(.+)/gi;

const TITLE_MAP: Record<string, (comment: string) => string> = {
  TODO: (c) => `The Forgotten Task: ${c}`,
  FIXME: (c) => `The Broken Artifact: ${c}`,
  HACK: (c) => `The Cursed Workaround: ${c}`,
  XXX: (c) => `The Dark Mark: ${c}`,
};

function truncate(str: string, max: number): string {
  const trimmed = str.trim();
  return trimmed.length > max ? trimmed.slice(0, max) + "…" : trimmed;
}

export class TodoHunterScanner implements Scanner {
  name = "todo-hunter";

  async scan(rootDir: string): Promise<ScanResult[]> {
    const files = await walkFiles(rootDir, [".ts", ".js", ".tsx", ".jsx"]);
    const results: ScanResult[] = [];

    for (const filePath of files) {
      const fullPath = join(rootDir, filePath);
      const content = await readFile(fullPath, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        // Reset regex lastIndex for each line
        const lineRegex = /\/\/\s*(TODO|FIXME|HACK|XXX)\s*:?\s*(.+)/gi;
        let match: RegExpExecArray | null;
        while ((match = lineRegex.exec(lines[i])) !== null) {
          const type = match[1].toUpperCase();
          const comment = truncate(match[2], 50);
          const titleFn = TITLE_MAP[type] || TITLE_MAP["TODO"];

          results.push({
            id: `todo-hunter-${filePath.replace(/[\/\\\.]/g, "-")}-${i + 1}`,
            title: titleFn(comment),
            description: `${type}: ${match[2].trim()} (${filePath}:${i + 1})`,
            filePath,
            line: i + 1,
            scanner: this.name,
            difficulty: 2,
            xp: 15,
            hint: "Implement the change described in the comment, then remove the TODO/FIXME comment",
          });
        }
      }
    }

    return results;
  }
}
