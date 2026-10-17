#!/usr/bin/env node
// SessionStart: whatever we print to stdout is added to Claude's context at the start of every session.
import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";

const run = (c) => {
  try {
    return execSync(c, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
};
const branch = run("git branch --show-current") || "(no git)";
const dirty = run("git status --porcelain").split("\n").filter(Boolean).length;
let specs = [];
try {
  specs = readdirSync(".claude/specs").filter((f) => f.endsWith(".md")).sort();
} catch {}
const slug = branch.replace(/^feature\//, "");
const active = specs.find((s) => s.replace(/^\d+-/, "").replace(/\.md$/, "") === slug);

console.log(
  [
    `DabbaDesk session context (from .claude/hooks/session-context.mjs):`,
    `- Branch: ${branch}${dirty ? ` (${dirty} uncommitted file(s))` : ""}`,
    `- Active spec: ${active ? `.claude/specs/${active}` : "none for this branch"}`,
    `- Specs so far: ${specs.join(", ") || "none"}`,
    `- Today in IST: ${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date())}`,
  ].join("\n"),
);
