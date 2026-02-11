import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Scanner, ScanResult } from "./types.js";
import { walkFiles } from "../utils/file-walker.js";

const TITLE_TEMPLATES = [
  (name: string) => `The Undocumented ${name}`,
  (name: string) => `Scrolls of ${name}`,
  (name: string) => `Lost Documentation of ${name}`,
  (name: string) => `Chronicle the ${name}`,
];

const EXPORT_REGEX =
  /^export\s+(?:async\s+)?(?:function|class|const|let)\s+(\w+)/;

function pickTitle(name: string, index: number): string {
  return TITLE_TEMPLATES[index % TITLE_TEMPLATES.length](name);
}

function hasJSDocAbove(lines: string[], lineIndex: number): boolean {
  let i = lineIndex - 1;
  // skip blank lines
  while (i >= 0 && lines[i].trim() === "") i--;
  if (i < 0) return false;

  // Check for end of JSDoc block
  if (lines[i].trim().endsWith("*/")) {
    // Walk upward to find the opening /**
    while (i >= 0) {
      if (lines[i].includes("/**")) return true;
      i--;
    }
  }
  return false;
}

export class MissingDocsScanner implements Scanner {
  name = "missing-docs";

  async scan(rootDir: string): Promise<ScanResult[]> {
    const files = await walkFiles(rootDir, [".ts", ".js"]);
    const results: ScanResult[] = [];
    let titleIndex = 0;

    for (const filePath of files) {
      const fullPath = join(rootDir, filePath);
      const content = await readFile(fullPath, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(EXPORT_REGEX);
        if (match && !hasJSDocAbove(lines, i)) {
          const name = match[1];
          results.push({
            id: `missing-docs-${filePath.replace(/[\/\\\.]/g, "-")}-${name}`,
            title: pickTitle(name, titleIndex++),
            description: `Add JSDoc documentation to \`${name}\` in ${filePath}`,
            filePath,
            line: i + 1,
            scanner: this.name,
            difficulty: 1,
            xp: 10,
            hint: "Add JSDoc documentation with @param and @returns tags",
          });
        }
      }
    }

    return results;
  }
}
