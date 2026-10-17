#!/usr/bin/env node
// Notification: pop a macOS notification when Claude is waiting for you (permission prompt or idle).
import { execFile } from "node:child_process";
import { readHookInput } from "./read-input.mjs";

const { message = "Claude needs your attention" } = await readHookInput();
if (process.platform === "darwin") {
  const safe = message.replace(/["\\]/g, "");
  execFile("osascript", ["-e", `display notification "${safe}" with title "DabbaDesk · Claude Code" sound name "Glass"`]);
}
