import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const EXCLUDED_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  "coverage",
  "__tests__",
  ".next",
  ".nuxt",
]);

const EXCLUDED_PATTERNS = [/\.test\./, /\.spec\./, /\.d\.ts$/];

export async function walkFiles(
  rootDir: string,
  extensions: string[],
): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
          await walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = "." + entry.name.split(".").pop();
        if (
          extensions.includes(ext) &&
          !EXCLUDED_PATTERNS.some((p) => p.test(entry.name))
        ) {
          results.push(relative(rootDir, fullPath));
        }
      }
    }
  }

  await walk(rootDir);
  return results.sort();
}
