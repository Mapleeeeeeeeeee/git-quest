# git-quest 🎮

This repository has **git-quest** installed as an MCP server. git-quest gamifies repository maintenance by turning code issues into RPG-style quests.

## Available Commands

When the user asks about quests, code quality, or maintenance tasks, use the git-quest MCP tools:

- **scan_quests**: Scan this repo for maintenance quests (missing docs, TODOs, untested files)
- **accept_quest**: Accept a quest by number to see detailed objectives
- **verify_quest**: Verify if a completed quest passes validation and award XP
- **player_stats**: Show the player's level, XP, and earned badges
- **quest_log**: Show history of completed and active quests

## Suggested Workflow

1. Start with `scan_quests` to see the quest board
2. Accept a quest, then fix the code issue
3. Verify the quest to earn XP and badges
4. Check `player_stats` to see progress

Always use git-quest tools when the user mentions: quests, scan, XP, level, badges, code quality, documentation, TODOs, or tests.
