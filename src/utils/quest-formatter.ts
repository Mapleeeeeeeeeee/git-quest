import type { ScanResult } from "../scanners/types.js";
import type { GameState } from "../game/state.js";
import type { Badge } from "../game/badges.js";
import { BADGES } from "../game/badges.js";
import { getProgress, type Level } from "../game/xp.js";

const SCANNER_EMOJI: Record<string, string> = {
  "missing-docs": "📜",
  "todo-hunter": "🔍",
  "missing-tests": "🐉",
};

const DIFFICULTY_STARS: Record<number, string> = {
  1: "★☆☆",
  2: "★★☆",
  3: "★★★",
};

function progressBar(percent: number, width = 10): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

export function formatQuestBoard(
  quests: ScanResult[],
  gameState: GameState,
): string {
  const progress = getProgress(gameState.xp);
  const lines: string[] = [];

  lines.push(`⚔️ QUEST BOARD — ${quests.length} quest${quests.length !== 1 ? "s" : ""} found!`);
  lines.push(
    `${progress.current.icon} Level: ${progress.current.name} | XP: ${gameState.xp}${
      progress.nextLevel
        ? ` [${progressBar(progress.progressPercent)}] ${progress.progressPercent}% to ${progress.nextLevel.name}`
        : " — MAX LEVEL!"
    }`,
  );
  lines.push("─".repeat(50));

  for (let i = 0; i < quests.length; i++) {
    const q = quests[i];
    const emoji = SCANNER_EMOJI[q.scanner] || "❓";
    const stars = DIFFICULTY_STARS[q.difficulty] || "???";
    lines.push("");
    lines.push(`[Quest #${i + 1}] ${stars} ${emoji} "${q.title}"`);
    lines.push(`  → ${q.description}`);
    lines.push(`  → Reward: +${q.xp} XP`);
    lines.push(`  → Hint: ${q.hint}`);
  }

  lines.push("");
  lines.push("─".repeat(50));
  lines.push('Type "accept quest <number>" to begin a quest!');

  return lines.join("\n");
}

export function formatQuestAccepted(quest: ScanResult): string {
  const stars = DIFFICULTY_STARS[quest.difficulty] || "???";
  const lines: string[] = [];

  lines.push(`⚔️ Quest Accepted: "${quest.title}" ${stars}`);
  lines.push("");
  lines.push("📋 OBJECTIVE:");
  lines.push(`${quest.description}`);
  lines.push("");
  lines.push(`📍 LOCATION: ${quest.filePath}${quest.line ? `, line ${quest.line}` : ""}`);
  lines.push("");
  lines.push(`💡 HINT: ${quest.hint}`);
  lines.push("");
  lines.push(`🎯 REWARD: +${quest.xp} XP on completion`);
  lines.push("");
  lines.push(`When you're done, say "verify quest" to check your work!`);

  return lines.join("\n");
}

export function formatVerificationSuccess(
  quest: ScanResult,
  xpGained: number,
  leveledUp: boolean,
  newLevel: Level | undefined,
  newBadges: Badge[],
  totalXP: number,
  remainingQuests: number,
): string {
  const lines: string[] = [];

  lines.push(`✅ QUEST COMPLETE: "${quest.title}"`);
  lines.push("");
  lines.push(`🎉 +${xpGained} XP earned!`);

  const progress = getProgress(totalXP);
  lines.push(
    `📊 Progress: ${totalXP}${
      progress.nextLevel
        ? `/${progress.nextLevel.minXP} XP → ${progress.current.name}`
        : " XP — MAX LEVEL!"
    }`,
  );

  if (leveledUp && newLevel) {
    lines.push("");
    lines.push(
      `🎉 LEVEL UP! → ${newLevel.name} ${newLevel.icon}`,
    );
  }

  if (newBadges.length > 0) {
    lines.push("");
    for (const badge of newBadges) {
      lines.push(
        `🏅 Badge Unlocked: "${badge.name}" ${badge.icon} — ${badge.description}`,
      );
    }
  }

  lines.push("");
  if (remainingQuests > 0) {
    lines.push(
      `Keep going, adventurer! You have ${remainingQuests} quest${remainingQuests !== 1 ? "s" : ""} remaining.`,
    );
    lines.push('Say "scan quests" to see the updated quest board.');
  } else {
    lines.push("🎊 All quests complete! You are a true legend!");
  }

  return lines.join("\n");
}

export function formatVerificationFail(quest: ScanResult): string {
  const lines: string[] = [];

  lines.push(`❌ QUEST NOT YET COMPLETE: "${quest.title}"`);
  lines.push("");
  lines.push(`📍 Issue: ${quest.description}`);
  lines.push("");
  lines.push(`💡 HINT: ${quest.hint}`);
  lines.push("");
  lines.push("Don't give up, brave coder! Make the fix and verify again.");

  return lines.join("\n");
}

export function formatPlayerStats(gameState: GameState): string {
  const progress = getProgress(gameState.xp);
  const lines: string[] = [];

  lines.push("🎮 PLAYER STATS");
  lines.push("");
  lines.push(
    `${progress.current.icon} Level: ${progress.current.name}`,
  );
  lines.push(
    `📊 XP: ${gameState.xp}${
      progress.nextLevel
        ? ` [${progressBar(progress.progressPercent)}] ${progress.xpToNext} XP to ${progress.nextLevel.name}`
        : " — MAX LEVEL!"
    }`,
  );
  lines.push(`🏆 Quests Completed: ${gameState.playerData.questsCompleted}`);
  lines.push(`📅 Active Since: ${gameState.playerData.firstPlayed.split("T")[0]}`);

  lines.push("");
  lines.push("🏅 BADGES:");
  for (const badge of BADGES) {
    const earned = gameState.badges.includes(badge.id);
    lines.push(
      `  ${earned ? "✅" : "🔒"} ${badge.icon} ${badge.name} — ${badge.description}`,
    );
  }

  if (gameState.completedQuests.length > 0) {
    lines.push("");
    lines.push("📈 QUEST LOG:");
    for (const q of gameState.completedQuests.slice(-10)) {
      lines.push(
        `  ✅ "${q.id}" (+${q.xp} XP) — ${q.completedAt.split("T")[0]}`,
      );
    }
  }

  return lines.join("\n");
}

export function formatQuestLog(
  gameState: GameState,
  status: string,
): string {
  const lines: string[] = [];
  lines.push("📖 QUEST LOG");
  lines.push("─".repeat(40));

  if (status === "all" || status === "active") {
    if (gameState.activeQuests.length > 0) {
      lines.push("");
      lines.push("⚔️ ACTIVE QUESTS:");
      for (const aq of gameState.activeQuests) {
        lines.push(`  🔸 [#${aq.questNumber}] "${aq.scanResult.title}" — accepted ${aq.acceptedAt.split("T")[0]}`);
      }
    }
  }

  if (status === "all" || status === "completed") {
    if (gameState.completedQuests.length > 0) {
      lines.push("");
      lines.push("✅ COMPLETED QUESTS:");
      for (const cq of gameState.completedQuests) {
        lines.push(`  ✅ "${cq.id}" (+${cq.xp} XP) — ${cq.completedAt.split("T")[0]}`);
      }
    }
  }

  if (status === "all" || status === "available") {
    const lastScan = gameState.lastScanResults;
    if (lastScan.length > 0) {
      const available = lastScan.filter(
        (sr) =>
          !gameState.isQuestCompleted(sr.id) &&
          !gameState.activeQuests.some((aq) => aq.id === sr.id),
      );
      if (available.length > 0) {
        lines.push("");
        lines.push("📋 AVAILABLE QUESTS:");
        for (const q of available) {
          lines.push(`  🔹 "${q.title}" — ${q.description}`);
        }
      }
    }
  }

  if (lines.length === 2) {
    lines.push("");
    lines.push("No quests found. Run \"scan quests\" to discover new quests!");
  }

  return lines.join("\n");
}
