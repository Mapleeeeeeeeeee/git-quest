#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

import { MissingDocsScanner } from "./scanners/missing-docs.js";
import { TodoHunterScanner } from "./scanners/todo-hunter.js";
import { MissingTestsScanner } from "./scanners/missing-tests.js";
import { generateBossQuests } from "./scanners/boss-quest.js";
import { GameState } from "./game/state.js";
import type { ScanResult, Scanner } from "./scanners/types.js";
import {
  formatQuestBoard,
  formatQuestAccepted,
  formatVerificationSuccess,
  formatVerificationFail,
  formatPlayerStats,
  formatQuestLog,
} from "./utils/quest-formatter.js";

// Handle "setup" subcommand before starting the MCP server
if (process.argv.includes("setup")) {
  const CONFIG_DIR = join(homedir(), ".copilot");
  const CONFIG_FILE = join(CONFIG_DIR, "mcp-config.json");

  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }

  let config: Record<string, unknown> = {};
  if (existsSync(CONFIG_FILE)) {
    try {
      config = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    } catch {
      // If config is corrupted, start fresh
    }
  }

  if (!config.mcpServers || typeof config.mcpServers !== "object") {
    config.mcpServers = {};
  }

  (config.mcpServers as Record<string, unknown>)["git-quest"] = {
    command: "npx",
    args: ["-y", "-p", "@maplekuo/git-quest", "git-quest"],
  };

  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");

  console.log(`
🎮 git-quest setup complete!

✅ Registered as MCP server for GitHub Copilot CLI.

Next steps:
  1. Open a terminal in any project directory
  2. Run: copilot
  3. Say: "scan this repo for quests"
  4. Complete quests to earn XP and level up! ⚔️

Happy adventuring! 🐉
`);
  process.exit(0);
}

const scanners: Record<string, Scanner> = {
  "missing-docs": new MissingDocsScanner(),
  "todo-hunter": new TodoHunterScanner(),
  "missing-tests": new MissingTestsScanner(),
};

// --- Verification Logic ---

async function verifyMissingDocs(
  quest: ScanResult,
  rootDir: string,
  _gameState: GameState,
): Promise<boolean> {
  try {
    const content = await readFile(join(rootDir, quest.filePath), "utf-8");
    const lines = content.split("\n");
    const targetLine = quest.line ? quest.line - 1 : -1;
    if (targetLine < 0) return false;

    // Search around original line (±5) for the export
    const searchStart = Math.max(0, targetLine - 10);
    const searchEnd = Math.min(lines.length, targetLine + 15);

    for (let i = searchStart; i < searchEnd; i++) {
      if (/^export\s+/.test(lines[i])) {
        // Check if JSDoc exists above
        let j = i - 1;
        while (j >= 0 && lines[j].trim() === "") j--;
        if (j >= 0 && lines[j].trim().endsWith("*/")) {
          // Walk up to find /**
          while (j >= 0) {
            if (lines[j].includes("/**")) {
              // Check it has content (not just /** */)
              const block = lines.slice(j, i).join("\n");
              if (
                block.includes("@param") ||
                block.includes("@returns") ||
                block.split("\n").length > 2
              ) {
                return true;
              }
              // Even a simple description is fine
              if (block.replace(/\/\*\*|\*\/|\*/g, "").trim().length > 0) {
                return true;
              }
            }
            j--;
          }
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

async function verifyTodoHunter(
  quest: ScanResult,
  rootDir: string,
  _gameState: GameState,
): Promise<boolean> {
  try {
    const content = await readFile(join(rootDir, quest.filePath), "utf-8");
    const lines = content.split("\n");
    const targetLine = quest.line ? quest.line - 1 : -1;

    // Search around original line (±5) for the TODO/FIXME/HACK/XXX
    const searchStart = Math.max(0, targetLine - 10);
    const searchEnd = Math.min(lines.length, targetLine + 15);

    for (let i = searchStart; i < searchEnd; i++) {
      if (/\/\/\s*(TODO|FIXME|HACK|XXX)\s*:?\s*/i.test(lines[i])) {
        // Extract the comment from the quest description to match
        const descMatch = quest.description.match(
          /(?:TODO|FIXME|HACK|XXX):\s*(.+?)\s*\(/,
        );
        if (descMatch) {
          const originalComment = descMatch[1].trim();
          if (lines[i].includes(originalComment.slice(0, 20))) {
            return false; // Still there
          }
        } else {
          return false; // Found a TODO-like comment near the original line
        }
      }
    }
    return true; // Comment is gone
  } catch {
    return false;
  }
}

async function verifyMissingTests(
  quest: ScanResult,
  rootDir: string,
  _gameState: GameState,
): Promise<boolean> {
  const { access } = await import("node:fs/promises");
  const { basename, dirname } = await import("node:path");

  const fileName = basename(quest.filePath);
  const ext = fileName.includes(".ts") ? ".ts" : ".js";
  const nameWithoutExt = fileName.replace(/\.(ts|js)$/, "");
  const dir = dirname(quest.filePath);
  const fullDir = join(rootDir, dir);

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

  for (const candidate of candidates) {
    try {
      await access(candidate);
      // File exists — check it has at least one test
      const content = await readFile(candidate, "utf-8");
      if (/\b(test|it|describe)\s*\(/.test(content)) {
        return true;
      }
    } catch {
      // File doesn't exist
    }
  }
  return false;
}

async function verifyBoss(
  quest: ScanResult,
  rootDir: string,
  gameState: GameState,
): Promise<boolean> {
  // All quests for this file must be completed
  const lastScan = gameState.lastScanResults;
  const fileQuests = lastScan.filter(
    (q) => q.filePath === quest.filePath && q.scanner !== "boss",
  );
  return fileQuests.every((q) => gameState.isQuestCompleted(q.id));
}

const verifiers: Record<
  string,
  (quest: ScanResult, rootDir: string, gameState: GameState) => Promise<boolean>
> = {
  "missing-docs": verifyMissingDocs,
  "todo-hunter": verifyTodoHunter,
  "missing-tests": verifyMissingTests,
  "boss": verifyBoss,
};

// --- MCP Server ---

const server = new McpServer({
  name: "git-quest",
  version: "0.1.0",
});

// Tool: scan_quests
server.tool(
  "scan_quests",
  "Scan the current repository for maintenance quests. Returns a list of quests with difficulty ratings, XP rewards, and descriptions. Each quest represents a real code improvement task.",
  {
    path: z
      .string()
      .optional()
      .describe("Root directory to scan. Defaults to current working directory."),
    scanner: z
      .enum(["all", "missing-docs", "todo-hunter", "missing-tests"])
      .optional()
      .describe("Which scanner to run. Defaults to 'all'."),
  },
  async ({ path, scanner }) => {
    const rootDir = resolve(path || process.cwd());
    const scannerFilter = scanner || "all";

    const scannersToRun: Scanner[] =
      scannerFilter === "all"
        ? Object.values(scanners)
        : [scanners[scannerFilter]].filter(Boolean);

    let allResults: ScanResult[] = [];
    for (const s of scannersToRun) {
      const results = await s.scan(rootDir);
      allResults.push(...results);
    }

    // Sort by difficulty (low to high)
    allResults.sort((a, b) => a.difficulty - b.difficulty);

    // Generate boss quests from combined results
    const bossQuests = generateBossQuests(allResults);
    allResults.push(...bossQuests);

    // Save state
    const gameState = new GameState(rootDir);
    gameState.setLastScanResults(allResults);
    gameState.save();

    const output = formatQuestBoard(allResults, gameState);
    return { content: [{ type: "text" as const, text: output }] };
  },
);

// Tool: accept_quest
server.tool(
  "accept_quest",
  "Accept a quest by its number. This marks the quest as in-progress and provides detailed instructions for completing it. After accepting, use your coding skills (or ask me for help!) to complete the task, then verify it.",
  {
    quest_number: z
      .number()
      .describe("The quest number to accept (from scan_quests output)"),
  },
  async ({ quest_number }) => {
    const rootDir = resolve(process.cwd());
    const gameState = new GameState(rootDir);
    const lastScan = gameState.lastScanResults;

    if (lastScan.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: '❌ No quests available. Run "scan quests" first!',
          },
        ],
      };
    }

    if (quest_number < 1 || quest_number > lastScan.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: `❌ Invalid quest number. Choose between 1 and ${lastScan.length}.`,
          },
        ],
      };
    }

    const quest = lastScan[quest_number - 1];

    if (gameState.isQuestCompleted(quest.id)) {
      return {
        content: [
          { type: "text" as const, text: `✅ Quest "${quest.title}" is already completed!` },
        ],
      };
    }

    gameState.acceptQuest(quest_number, quest);
    gameState.save();

    const output = formatQuestAccepted(quest);
    return { content: [{ type: "text" as const, text: output }] };
  },
);

// Tool: verify_quest
server.tool(
  "verify_quest",
  "Verify if an accepted quest has been completed. Re-scans the relevant code to check if the issue has been resolved. Awards XP and badges on successful completion.",
  {
    quest_number: z
      .number()
      .describe("The quest number to verify"),
  },
  async ({ quest_number }) => {
    const rootDir = resolve(process.cwd());
    const gameState = new GameState(rootDir);
    const activeQuest = gameState.getActiveQuest(quest_number);

    if (!activeQuest) {
      return {
        content: [
          {
            type: "text" as const,
            text: `❌ No active quest #${quest_number}. Accept it first with "accept quest ${quest_number}".`,
          },
        ],
      };
    }

    const quest = activeQuest.scanResult;
    const verifier = verifiers[quest.scanner];

    if (!verifier) {
      return {
        content: [
          { type: "text" as const, text: `❌ No verifier found for scanner: ${quest.scanner}` },
        ],
      };
    }

    const passed = await verifier(quest, rootDir, gameState);

    if (passed) {
      const result = gameState.completeQuest(quest);
      gameState.save();

      const remaining = gameState.lastScanResults.filter(
        (sr) => !gameState.isQuestCompleted(sr.id),
      ).length;

      const output = formatVerificationSuccess(
        quest,
        result.xpGained,
        result.leveledUp,
        result.newLevel,
        result.newBadges,
        gameState.xp,
        remaining,
      );
      return { content: [{ type: "text" as const, text: output }] };
    } else {
      const output = formatVerificationFail(quest);
      return { content: [{ type: "text" as const, text: output }] };
    }
  },
);

// Tool: player_stats
server.tool(
  "player_stats",
  "Show your current player statistics including level, XP, badges earned, and quest completion history.",
  {},
  async () => {
    const rootDir = resolve(process.cwd());
    const gameState = new GameState(rootDir);
    const output = formatPlayerStats(gameState);
    return { content: [{ type: "text" as const, text: output }] };
  },
);

// Tool: quest_log
server.tool(
  "quest_log",
  "Show detailed history of all completed and in-progress quests.",
  {
    status: z
      .enum(["all", "completed", "active", "available"])
      .optional()
      .describe("Filter quests by status. Defaults to 'all'."),
  },
  async ({ status }) => {
    const rootDir = resolve(process.cwd());
    const gameState = new GameState(rootDir);
    const output = formatQuestLog(gameState, status || "all");
    return { content: [{ type: "text" as const, text: output }] };
  },
);

// Start MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
