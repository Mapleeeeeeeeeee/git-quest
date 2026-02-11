import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { ScanResult } from "../scanners/types.js";
import { getLevel, getProgress, type Level } from "./xp.js";
import { checkNewBadges, type Badge } from "./badges.js";

export interface CompletedQuest {
  id: string;
  scanner: string;
  difficulty: 1 | 2 | 3 | 4;
  xp: number;
  completedAt: string;
}

export interface ActiveQuest {
  id: string;
  questNumber: number;
  scanResult: ScanResult;
  acceptedAt: string;
}

export interface GameStateData {
  version: number;
  player: {
    xp: number;
    questsCompleted: number;
    firstPlayed: string;
    lastPlayed: string;
  };
  completedQuests: CompletedQuest[];
  activeQuests: ActiveQuest[];
  badges: string[];
  lastScanResults?: ScanResult[];
  lastScanAllCompleted?: boolean;
}

const DEFAULT_STATE: GameStateData = {
  version: 1,
  player: {
    xp: 0,
    questsCompleted: 0,
    firstPlayed: new Date().toISOString(),
    lastPlayed: new Date().toISOString(),
  },
  completedQuests: [],
  activeQuests: [],
  badges: [],
};

export class GameState {
  private data: GameStateData;
  private filePath: string;

  constructor(projectRoot: string) {
    this.filePath = join(projectRoot, ".git-quest.json");
    this.data = this.loadData();
  }

  private loadData(): GameStateData {
    if (existsSync(this.filePath)) {
      try {
        const raw = readFileSync(this.filePath, "utf-8");
        return JSON.parse(raw) as GameStateData;
      } catch {
        return { ...DEFAULT_STATE };
      }
    }
    return { ...DEFAULT_STATE, player: { ...DEFAULT_STATE.player } };
  }

  save(): void {
    this.data.player.lastPlayed = new Date().toISOString();
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
  }

  get xp(): number {
    return this.data.player.xp;
  }

  get completedQuests(): CompletedQuest[] {
    return this.data.completedQuests;
  }

  get activeQuests(): ActiveQuest[] {
    return this.data.activeQuests;
  }

  get badges(): string[] {
    return this.data.badges;
  }

  get playerData() {
    return this.data.player;
  }

  get raw(): GameStateData {
    return this.data;
  }

  get lastScanResults(): ScanResult[] {
    return this.data.lastScanResults || [];
  }

  setLastScanResults(results: ScanResult[]): void {
    this.data.lastScanResults = results;
  }

  addXP(amount: number): { newXP: number; leveledUp: boolean; newLevel?: Level } {
    const oldLevel = getLevel(this.data.player.xp);
    this.data.player.xp += amount;
    const newLevel = getLevel(this.data.player.xp);
    const leveledUp = newLevel.name !== oldLevel.name;

    return {
      newXP: this.data.player.xp,
      leveledUp,
      ...(leveledUp ? { newLevel } : {}),
    };
  }

  completeQuest(quest: ScanResult): {
    xpGained: number;
    leveledUp: boolean;
    newLevel?: Level;
    newBadges: Badge[];
  } {
    const xpResult = this.addXP(quest.xp);

    this.data.completedQuests.push({
      id: quest.id,
      scanner: quest.scanner,
      difficulty: quest.difficulty,
      xp: quest.xp,
      completedAt: new Date().toISOString(),
    });

    this.data.player.questsCompleted++;

    // Remove from active quests
    this.data.activeQuests = this.data.activeQuests.filter(
      (aq) => aq.id !== quest.id,
    );

    // Check for new badges
    const newBadges = checkNewBadges(this.data);
    for (const badge of newBadges) {
      this.data.badges.push(badge.id);
    }

    // Check if all quests from last scan are completed
    if (this.data.lastScanResults) {
      this.data.lastScanAllCompleted = this.data.lastScanResults.every((sr) =>
        this.data.completedQuests.some((cq) => cq.id === sr.id),
      );
    }

    return {
      xpGained: quest.xp,
      leveledUp: xpResult.leveledUp,
      ...(xpResult.newLevel ? { newLevel: xpResult.newLevel } : {}),
      newBadges,
    };
  }

  acceptQuest(questNumber: number, scanResult: ScanResult): void {
    // Don't add duplicates
    if (this.data.activeQuests.some((aq) => aq.id === scanResult.id)) return;

    this.data.activeQuests.push({
      id: scanResult.id,
      questNumber,
      scanResult,
      acceptedAt: new Date().toISOString(),
    });
  }

  getActiveQuest(questNumber: number): ActiveQuest | null {
    return (
      this.data.activeQuests.find((aq) => aq.questNumber === questNumber) ||
      null
    );
  }

  completedByScanner(scannerName: string): number {
    return this.data.completedQuests.filter(
      (q) => q.scanner === scannerName,
    ).length;
  }

  isQuestCompleted(questId: string): boolean {
    return this.data.completedQuests.some((q) => q.id === questId);
  }
}
