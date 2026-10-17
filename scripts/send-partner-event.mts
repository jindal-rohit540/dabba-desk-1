/**
 * Pretend to be ZipRun: send a sample payload to the webhook, with dates moved to today.
 *
 *   npm run partner:send -- v1-delayed                       # to localhost:3000
 *   npm run partner:send -- v1-delayed DX-10563              # for a specific order
 *   npm run partner:send -- v2-in-transit DX-10563 --url https://dabbadesk.vercel.app
 */
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const urlFlag = args.indexOf("--url");
const baseUrl = urlFlag >= 0 ? args.splice(urlFlag, 2)[1] : "http://localhost:3000";
const [name, orderId] = args;
if (!name) {
  console.error("Usage: npm run partner:send -- <fixture-name> [DX-order-id] [--url https://…]");
  process.exit(1);
}

const ANCHOR = Date.parse(`${process.env.SEED_ANCHOR_DATE ?? "2026-10-21"}T00:00:00+05:30`);
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const shiftMs = Date.parse(`${today}T00:00:00+05:30`) - ANCHOR;

// Move every ISO timestamp and epoch-seconds value by the same number of days
function shift(value: unknown, key = ""): unknown {
  if (Array.isArray(value)) return value.map((v) => shift(v));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        // targeting a real order: keep its own rider instead of the sample's
        .filter(([k]) => !(orderId && (k === "rider" || k === "courier_id")))
        .map(([k, v]) => [k, shift(v, k)]),
    );
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const offset = value.match(/([+-]\d{2}:\d{2}|Z)$/)?.[1] ?? "Z";
    const d = new Date(Date.parse(value) + shiftMs);
    return offset === "+05:30"
      ? new Date(d.getTime() + 5.5 * 3600_000).toISOString().replace("Z", "+05:30").replace(".000", "")
      : d.toISOString();
  }
  if (typeof value === "number" && /(_at|expected_at)$/.test(key)) return value + shiftMs / 1000;
  if ((key === "order_ref" || key === "reference") && orderId) return orderId;
  return value;
}

const payload = shift(JSON.parse(readFileSync(`tests/fixtures/partner/${name}.json`, "utf8")));
const res = await fetch(`${baseUrl}/api/partner/webhook`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-ziprun-secret": process.env.PARTNER_WEBHOOK_SECRET ?? "" },
  body: JSON.stringify(payload),
});
console.log(JSON.stringify(payload, null, 2));
console.log(`\n→ ${res.status} ${await res.text()}`);
