import type { ScanResult } from "./types.js";
import { basename } from "node:path";

export function generateBossQuests(quests: ScanResult[]): ScanResult[] {
  // Group quests by filePath
  const byFile = new Map<string, Set<string>>();
  for (const q of quests) {
    if (!byFile.has(q.filePath)) {
      byFile.set(q.filePath, new Set());
    }
    byFile.get(q.filePath)!.add(q.scanner);
  }

  const bossQuests: ScanResult[] = [];
  for (const [filePath, scannerTypes] of byFile) {
    if (scannerTypes.size >= 2) {
      const fileName = basename(filePath);
      const nameWithoutExt = fileName.replace(/\.\w+$/, "");
      bossQuests.push({
        id: `boss-${nameWithoutExt}`,
        title: `🐉 BOSS: Purify ${fileName}`,
        description: `Complete ALL quests for this file in a single session to slay the boss`,
        filePath,
        scanner: "boss",
        difficulty: 4,
        xp: 50,
        hint: "Fix all issues in this file: add documentation, resolve TODOs, and create tests",
      });
    }
  }

  return bossQuests;
}
