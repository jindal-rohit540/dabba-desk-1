// Shared helper: every hook receives one JSON object on stdin.
export async function readHookInput() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}
