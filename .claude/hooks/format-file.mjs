#!/usr/bin/env node
// PostToolUse(Write|Edit): run Prettier on the file Claude just changed. Never blocks.
import { execFileSync } from "node:child_process";
import { readHookInput } from "./read-input.mjs";

const { tool_input } = await readHookInput();
const file = tool_input?.file_path ?? "";
if (/\.(ts|tsx|js|mjs|json|css|md)$/.test(file) && !file.includes("node_modules")) {
  try {
    execFileSync("npx", ["prettier", "--write", "--log-level", "silent", file], { stdio: "ignore" });
  } catch {
    // formatting is best-effort
  }
}
