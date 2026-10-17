#!/usr/bin/env node
// Status line: model · branch · active spec. Shown under the prompt so the room always knows where we are.
import { execSync } from "node:child_process";
import { readHookInput } from "./hooks/read-input.mjs";

const input = await readHookInput();
let branch = "";
try {
  branch = execSync("git branch --show-current", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
} catch {}
const model = input.model?.display_name ?? "Claude";
const cost = input.cost?.total_cost_usd != null ? ` · $${input.cost.total_cost_usd.toFixed(2)}` : "";
const color = branch === "main" ? "\x1b[31m" : "\x1b[32m";
console.log(`🍱 DabbaDesk · ${model} · ${color}⎇ ${branch || "-"}\x1b[0m${cost}`);
