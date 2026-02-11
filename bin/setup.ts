#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CONFIG_DIR = join(homedir(), ".copilot");
const CONFIG_FILE = join(CONFIG_DIR, "mcp-config.json");

function setup() {
  // Ensure config directory exists
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }

  // Read existing config or create new one
  let config: Record<string, unknown> = {};
  if (existsSync(CONFIG_FILE)) {
    try {
      config = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    } catch {
      // If config is corrupted, start fresh
    }
  }

  // Ensure mcpServers key exists
  if (!config.mcpServers || typeof config.mcpServers !== "object") {
    config.mcpServers = {};
  }

  // Add git-quest entry
  (config.mcpServers as Record<string, unknown>)["git-quest"] = {
    command: "npx",
    args: ["-y", "git-quest"],
  };

  // Write config
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
}

setup();
