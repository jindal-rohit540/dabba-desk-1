#!/usr/bin/env node
// EXPERIMENT (not enabled by default): a Stop hook that won't let Claude finish while tests fail.
// Enable it by adding to .claude/settings.local.json:
//   "hooks": { "Stop": [{ "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/tests-must-pass.mjs" }] }] }
import { execSync } from "node:child_process";
import { readHookInput } from "./read-input.mjs";

const input = await readHookInput();
if (input.stop_hook_active) process.exit(0); // already continued once; avoid infinite loops

const changed = execSync("git status --porcelain", { encoding: "utf8" });
if (!/\.(ts|tsx)$/m.test(changed)) process.exit(0); // nothing TypeScript changed

try {
  execSync("npx vitest run --reporter=dot", { stdio: "pipe" });
} catch (err) {
  const out = String(err.stdout ?? "").split("\n").slice(-25).join("\n");
  console.log(JSON.stringify({ decision: "block", reason: `Unit tests are failing. Fix them before finishing:\n${out}` }));
}
