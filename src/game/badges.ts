import type { GameStateData } from "./state.js";

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: (state: GameStateData) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: "first-blood",
    name: "First Blood",
    icon: "🩸",
    description: "Complete your first quest",
    condition: (state) => state.completedQuests.length >= 1,
  },
  {
    id: "scribe",
    name: "Scribe",
    icon: "📜",
    description: "Document 3 functions",
    condition: (state) =>
      state.completedQuests.filter((q) => q.scanner === "missing-docs").length >= 3,
  },
  {
    id: "exterminator",
    name: "Exterminator",
    icon: "🪲",
    description: "Resolve 5 TODOs",
    condition: (state) =>
      state.completedQuests.filter((q) => q.scanner === "todo-hunter").length >= 5,
  },
  {
    id: "guardian",
    name: "Guardian",
    icon: "🛡️",
    description: "Create 3 test files",
    condition: (state) =>
      state.completedQuests.filter((q) => q.scanner === "missing-tests").length >= 3,
  },
  {
    id: "dragon-slayer",
    name: "Dragon Slayer",
    icon: "🐉",
    description: "Complete a ★★★ quest",
    condition: (state) =>
      state.completedQuests.some((q) => q.difficulty === 3),
  },
  {
    id: "boss-slayer",
    name: "Boss Slayer",
    icon: "👑",
    description: "Complete a Boss Quest",
    condition: (state) =>
      state.completedQuests.some((q) => q.scanner === "boss"),
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    icon: "✨",
    description: "Complete all quests in a single scan",
    condition: (state) => state.lastScanAllCompleted === true,
  },
];

export function checkNewBadges(state: GameStateData): Badge[] {
  return BADGES.filter(
    (badge) => !state.badges.includes(badge.id) && badge.condition(state),
  );
}
