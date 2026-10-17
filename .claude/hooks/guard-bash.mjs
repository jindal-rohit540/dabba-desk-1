#!/usr/bin/env node
// PreToolUse(Bash): block dangerous shell commands BEFORE they run.
// Exit code 2 = block; whatever we print to stderr is shown to Claude so it can change course.
import { execSync } from "node:child_process";
import { readHookInput } from "./read-input.mjs";

const { tool_input } = await readHookInput();
const cmd = tool_input?.command ?? "";

function block(reason) {
  console.error(`BLOCKED by .claude/hooks/guard-bash.mjs: ${reason}`);
  process.exit(2);
}

// 1. Secrets: never read .env files through the shell (permissions already block the Read tool)
if (/\.env(?!\.example)(\.|\b)/.test(cmd) && /\b(cat|less|more|head|tail|grep|sed|awk|cp|mv|source|echo)\b/.test(cmd)) {
  block("commands that read or copy .env files are not allowed. Ask the human to check env vars.");
}
if (/\$\{?(SUPABASE_SECRET_KEY|OPENAI_API_KEY|CLERK_SECRET_KEY|TWILIO_AUTH_TOKEN)/.test(cmd)) {
  block("printing secret environment variables is not allowed.");
}

// 2. Destructive commands on things we can't get back
const protectedPaths = ["supabase/migrations", "data/raw", ".git"];
if (/\brm\s+-[a-z]*[rf]/.test(cmd) && protectedPaths.some((p) => cmd.includes(p))) {
  block(`recursive delete touching a protected path (${protectedPaths.join(", ")}).`);
}
if (/supabase\s+db\s+reset\b.*--linked|git\s+push\s+.*(--force|-f)\b|git\s+reset\s+--hard\s+origin/.test(cmd)) {
  block("this command can destroy shared data or history. Ask the human to run it themselves.");
}

// 3. Workflow: no commits or pushes straight to main
if (/\bgit\s+(commit|push)\b/.test(cmd)) {
  let branch = "";
  try {
    branch = execSync("git branch --show-current", { encoding: "utf8" }).trim();
  } catch {}
  const pushesMain = /\bgit\s+push\b.*\bmain\b/.test(cmd);
  if (branch === "main" || pushesMain) {
    block("never commit or push directly to main. Create a branch: git checkout -b feature/<slug> (or run /create-spec).");
  }
}

process.exit(0);
