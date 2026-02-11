import { access } from "node:fs/promises";
import { join, basename, dirname } from "node:path";
import type { Scanner, ScanResult } from "./types.js";
import { walkFiles } from "../utils/file-walker.js";

const SKIP_PATTERNS = [/\.test\./, /\.spec\./, /^index\./, /\.d\.ts$/, /^types\./];

const TITLE_TEMPLATES = [
  (name: string) => `The Untested Dragon: ${name}`,
  (name: string) => `Uncharted Territory: ${name}`,
  (name: string) => `Dragon of ${name}`,
];

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function shouldSkip(fileName: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(fileName));
}

export class MissingTestsScanner implements Scanner {
  name = "missing-tests";

  async scan(rootDir: string): Promise<ScanResult[]> {
    const files = await walkFiles(rootDir, [".ts", ".js"]);
    const results: ScanResult[] = [];
    let titleIndex = 0;

    for (const filePath of files) {
      const fileName = basename(filePath);
      if (shouldSkip(fileName)) continue;

      const ext = fileName.includes(".ts") ? ".ts" : ".js";
      const nameWithoutExt = fileName.replace(/\.(ts|js)$/, "");
      const dir = dirname(filePath);
      const fullDir = join(rootDir, dir);

      // Check for test file in various locations
      const candidates = [
        join(fullDir, `${nameWithoutExt}.test${ext}`),
        join(fullDir, `${nameWithoutExt}.spec${ext}`),
        join(fullDir, "__tests__", `${nameWithoutExt}.test${ext}`),
        join(fullDir, "__tests__", `${nameWithoutExt}.spec${ext}`),
        join(rootDir, "test", `${nameWithoutExt}.test${ext}`),
        join(rootDir, "tests", `${nameWithoutExt}.test${ext}`),
        join(rootDir, "test", `${nameWithoutExt}.spec${ext}`),
        join(rootDir, "tests", `${nameWithoutExt}.spec${ext}`),
      ];

      let hasTest = false;
      for (const candidate of candidates) {
        if (await fileExists(candidate)) {
          hasTest = true;
          break;
        }
      }

      if (!hasTest) {
        results.push({
          id: `missing-tests-${filePath.replace(/[\/\\\.]/g, "-")}`,
          title: TITLE_TEMPLATES[titleIndex % TITLE_TEMPLATES.length](nameWithoutExt),
          description: `${filePath} has no corresponding test file`,
          filePath,
          scanner: this.name,
          difficulty: 3,
          xp: 25,
          hint: "Create a test file with at least one test case using describe/it or test blocks",
        });
        titleIndex++;
      }
    }

    return results;
  }
}
