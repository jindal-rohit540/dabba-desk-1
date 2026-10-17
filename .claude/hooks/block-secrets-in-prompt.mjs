#!/usr/bin/env node
// UserPromptSubmit: stop the human from pasting an API key into the chat by accident.
// Exit code 2 = the prompt is NOT sent to Claude; stderr is shown to the human.
import { readHookInput } from "./read-input.mjs";

const { prompt = "" } = await readHookInput();
const patterns = [
  [/sk-ant-[A-Za-z0-9_-]{10,}/, "an Anthropic API key"],
  [/sb_secret_[A-Za-z0-9_-]{10,}/, "a Supabase secret key"],
  [/sk_(live|test)_[A-Za-z0-9]{10,}/, "a Clerk secret key"],
  [/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, "a JWT / service-role key"],
  [/ghp_[A-Za-z0-9]{20,}/, "a GitHub token"],
];
for (const [re, what] of patterns) {
  if (re.test(prompt)) {
    console.error(`🔐 Prompt blocked: it looks like it contains ${what}. Put secrets in .env.local, never in chat. Rotate the key if it was shared anywhere.`);
    process.exit(2);
  }
}
