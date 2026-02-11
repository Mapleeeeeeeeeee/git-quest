export interface Level {
  name: string;
  minXP: number;
  icon: string;
}

export const LEVELS: Level[] = [
  { name: "Novice", minXP: 0, icon: "🌱" },
  { name: "Apprentice", minXP: 25, icon: "⚔️" },
  { name: "Journeyman", minXP: 75, icon: "🛡️" },
  { name: "Expert", minXP: 150, icon: "🔮" },
  { name: "Master", minXP: 300, icon: "👑" },
  { name: "Legend", minXP: 500, icon: "🐉" },
];

export function getLevel(xp: number): Level {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.minXP) {
      current = level;
    } else {
      break;
    }
  }
  return current;
}

export interface Progress {
  current: Level;
  nextLevel: Level | null;
  xpToNext: number;
  progressPercent: number;
}

export function getProgress(xp: number): Progress {
  const current = getLevel(xp);
  const currentIndex = LEVELS.indexOf(current);
  const nextLevel =
    currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;

  if (!nextLevel) {
    return { current, nextLevel: null, xpToNext: 0, progressPercent: 100 };
  }

  const xpInLevel = xp - current.minXP;
  const xpNeeded = nextLevel.minXP - current.minXP;
  const progressPercent = Math.floor((xpInLevel / xpNeeded) * 100);

  return {
    current,
    nextLevel,
    xpToNext: nextLevel.minXP - xp,
    progressPercent,
  };
}
