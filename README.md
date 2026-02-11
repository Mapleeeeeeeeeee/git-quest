# git-quest ⚔️

> Turn your codebase into an RPG. An MCP server for GitHub Copilot CLI.

**git-quest** scans your repository for maintenance tasks — missing documentation, TODO comments, untested files — and presents them as RPG-style quests. Complete quests to earn XP, level up, and unlock badges!

## Quick Start

```bash
# 1. Install & register as MCP server
npx git-quest setup

# 2. Open Copilot CLI in any project
copilot

# 3. Start questing!
> scan this repo for quests
```

## Example Output

```
⚔️ QUEST BOARD — 5 quests found!
🌱 Level: Novice | XP: 0 [░░░░░░░░░░] 0% to Apprentice
──────────────────────────────────────────────────

[Quest #1] ★☆☆ 📜 "Scrolls of validateToken"
  → Add JSDoc documentation to `validateToken` in src/auth.ts
  → Reward: +10 XP
  → Hint: Add JSDoc documentation with @param and @returns tags

[Quest #2] ★★☆ 🔍 "The Forgotten Task: refactor to use proper error types"
  → TODO: refactor to use proper error types (src/utils.ts:1)
  → Reward: +15 XP
  → Hint: Implement the change described in the comment

[Quest #3] ★★★ 🐉 "The Untested Dragon: parser"
  → src/parser.ts has no corresponding test file
  → Reward: +25 XP
  → Hint: Create a test file with at least one test case
```

## Features

### 🔍 Three Scanners
- **Missing Docs** (📜 ★☆☆) — Finds exported functions/classes without JSDoc
- **TODO Hunter** (🔍 ★★☆) — Finds TODO, FIXME, HACK, XXX comments
- **Missing Tests** (🐉 ★★★) — Finds source files without test files

### 📊 XP & Levels
| Level | XP Required | Icon |
|-------|------------|------|
| Novice | 0 | 🌱 |
| Apprentice | 25 | ⚔️ |
| Journeyman | 75 | 🛡️ |
| Expert | 150 | 🔮 |
| Master | 300 | 👑 |
| Legend | 500 | 🐉 |

### 🏅 Badges
| Badge | Requirement |
|-------|------------|
| 🩸 First Blood | Complete your first quest |
| 📜 Scribe | Document 3 functions |
| 🪲 Exterminator | Resolve 5 TODOs |
| 🛡️ Guardian | Create 3 test files |
| 🐉 Dragon Slayer | Complete a ★★★ quest |
| ✨ Perfectionist | Complete all quests in a single scan |

## How It Works

1. **Scan** — git-quest walks your project files and runs scanners to find maintenance tasks
2. **Accept** — Choose a quest to work on; get detailed instructions and hints
3. **Fix** — Make the code improvement (add docs, resolve TODO, write tests)
4. **Verify** — git-quest re-scans to confirm the fix, awards XP and badges

Progress is saved in `.git-quest.json` in your project root. Commit it to share progress with your team!

## Available Tools

| Tool | Description |
|------|-------------|
| `scan_quests` | Scan repo for maintenance quests |
| `accept_quest` | Accept a quest by number |
| `verify_quest` | Verify quest completion |
| `player_stats` | Show level, XP, badges |
| `quest_log` | Show quest history |

## Demo

A `demo-repo/` directory is included with intentionally flawed code that generates ~15 quests. Perfect for testing!

```bash
cd demo-repo
copilot
> scan this repo for quests
```

## Contributing

Contributions welcome! Ideas for new scanners:
- Complexity analyzer (long functions)
- Dead code detector
- Dependency vulnerability scanner
- Code style enforcer

## License

MIT
