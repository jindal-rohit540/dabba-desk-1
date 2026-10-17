/**
 * Loads the business's messy CSV exports (data/raw/*.csv), cleans them and upserts into Supabase.
 *
 *   npm run db:seed              # clean + upsert, demo dates moved so the data's "today" = real today
 *   npm run db:seed -- --reset   # wipe all tables first
 *   npm run db:seed -- --dry-run # only print the cleaning report
 *   npm run db:seed -- --live    # also move today's delivery times so "now" ≈ 12:40 pm lunch rush
 */
import { readFileSync } from "node:fs";
import Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";
import {
  cleanOrders,
  cleanRefunds,
  normalizePhone,
  shiftDays,
  type Reject,
} from "../lib/etl/clean";

const ANCHOR_DATE = process.env.SEED_ANCHOR_DATE ?? "2026-10-21"; // the "today" inside the CSVs
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const RESET = args.has("--reset");
const LIVE = args.has("--live");
const DATA_NOW = "12:40"; // the moment the CSV export was taken on the anchor day

// Landmarks used to simulate the partner's "picked up / on the way" events for today's orders
const LANDMARKS: Record<string, string[]> = {
  Koramangala: ["Sony World Signal", "Forum Mall junction", "Jyoti Nivas College"],
  Indiranagar: ["Indiranagar Metro", "Toit, 100 Feet Rd", "Domlur flyover"],
  "HSR Layout": ["Agara Lake", "HSR BDA Complex", "27th Main signal"],
  Whitefield: ["Hope Farm junction", "Phoenix Marketcity", "ITPL main gate"],
  Bellandur: ["Ecospace signal", "Bellandur lake bridge", "Kadubeesanahalli flyover"],
  "Electronic City": ["Hosur Rd toll", "Infosys Gate 1", "Neeladri Nagar"],
  "MG Road": ["Trinity Metro", "Brigade Rd signal", "Cubbon Park gate"],
  Hebbal: ["Hebbal flyover", "Esteem Mall", "Nagawara junction"],
};

function readCsv(path: string): Record<string, string>[] {
  const parsed = Papa.parse<Record<string, string>>(readFileSync(path, "utf8"), {
    header: true,
    skipEmptyLines: true,
  });
  return parsed.data;
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function printRejects(label: string, rejects: Reject[]) {
  if (!rejects.length) return;
  console.log(`\n  ${label} rejected rows:`);
  for (const r of rejects) console.log(`    line ${r.line}: ${r.reason}`);
}

async function main() {
  const offset = args.has("--no-rebase") ? 0 : daysBetween(ANCHOR_DATE, todayIST());
  // --live: also shift clock times so the CSV's 12:40 pm becomes the current time
  const liveMs = LIVE ? Date.now() - Date.parse(`${todayIST()}T${DATA_NOW}:00+05:30`) : 0;
  const ts = (value: string | null) => {
    const shifted = shiftDays(value, offset);
    return shifted && liveMs ? new Date(Date.parse(shifted) + liveMs).toISOString() : shifted;
  };
  console.log(`\n🍱 DabbaDesk seed. Shifting demo dates by ${offset} day(s) (${ANCHOR_DATE} → ${todayIST()})`);
  if (LIVE) console.log(`   --live: clock shifted by ${Math.round(liveMs / 60000)} min so it's lunch rush right now`);

  // ---------- Extract + Transform
  const rawOrders = readCsv("data/raw/orders.csv");
  const { orders, rejects: orderRejects, duplicates } = cleanOrders(rawOrders);
  const { refunds, rejects: refundRejects } = cleanRefunds(
    readCsv("data/raw/refunds.csv"),
    new Set(orders.map((o) => o.id)),
  );
  const riders = readCsv("data/raw/riders.csv").map((r) => ({
    id: r.rider_id,
    name: r.name,
    phone: normalizePhone(r.phone) ?? r.phone,
    zone: r.zone,
  }));
  const history = readCsv("data/raw/messages-history.csv");

  console.log("\n  Cleaning report");
  console.log(`    orders.csv   rows read: ${rawOrders.length}`);
  console.log(`                 clean:     ${orders.length}`);
  console.log(`                 duplicates dropped: ${duplicates}`);
  console.log(`                 rejected:  ${orderRejects.length}`);
  console.log(`    refunds.csv  clean: ${refunds.length}, rejected: ${refundRejects.length}`);
  printRejects("orders.csv", orderRejects);
  printRejects("refunds.csv", refundRejects);
  if (DRY_RUN) return;

  // ---------- Load
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local");
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const check = <T>(label: string, res: { error: { message: string } | null; data?: T | null }) => {
    if (res.error) throw new Error(`${label}: ${res.error.message}`);
    return res.data as T;
  };

  if (RESET) {
    for (const table of ["messages", "refunds", "delivery_events", "orders", "subscriptions", "customers", "riders", "data_check_runs"]) {
      check(`reset ${table}`, await sb.from(table).delete().not("id", "is", null));
    }
    console.log("\n  🧹 Reset all tables");
  }

  check("riders", await sb.from("riders").upsert(riders));

  // One customer per phone; subscription plan/price taken from their orders
  const byPhone = new Map<string, (typeof orders)[number]>();
  for (const o of orders) if (!byPhone.has(o.phone)) byPhone.set(o.phone, o);
  const customers = check<{ id: string; phone: string }[]>(
    "customers",
    await sb
      .from("customers")
      .upsert(
        [...byPhone.values()].map((o) => ({
          name: o.customer_name,
          phone: o.phone,
          area: o.area,
          office_address: o.office_address,
        })),
        { onConflict: "phone" },
      )
      .select("id, phone"),
  );
  const customerId = new Map(customers.map((c) => [c.phone, c.id]));

  check(
    "subscriptions",
    await sb.from("subscriptions").upsert(
      [...byPhone.values()].map((o) => ({
        customer_id: customerId.get(o.phone),
        plan: o.plan,
        price_per_meal_paise: Math.round(o.amount_paise / o.quantity),
        status: "active",
        paused_until: null,
      })),
      { onConflict: "customer_id" },
    ),
  );

  const orderRows = orders.map((o) => ({
    id: o.id,
    customer_id: customerId.get(o.phone),
    delivery_date: shiftDays(o.delivery_date, offset),
    meal: o.meal,
    quantity: o.quantity,
    amount_paise: o.amount_paise,
    status: o.status,
    rider_id: o.rider_id,
    eta: ts(o.eta),
    delivered_at: o.status === "delivered" ? ts(o.eta) : null,
  }));
  for (let i = 0; i < orderRows.length; i += 200) {
    check("orders", await sb.from("orders").upsert(orderRows.slice(i, i + 200)));
  }

  // Simulated partner events for today's orders that are on the road
  const today = todayIST();
  const onTheRoad = orders.filter(
    (o) => shiftDays(o.delivery_date, offset) === today && o.status === "out_for_delivery" && o.eta,
  );
  check("reset events", await sb.from("delivery_events").delete().eq("source", "seed"));
  const events = onTheRoad.flatMap((o) => {
    const eta = new Date(ts(o.eta)!);
    const spots = LANDMARKS[o.area] ?? ["Outer Ring Road"];
    const minus = (m: number) => new Date(eta.getTime() - m * 60_000).toISOString();
    return [
      { order_id: o.id, status: "picked_up", note: "Picked up from Dabba Express kitchen, HSR", landmark: "Central kitchen", eta: eta.toISOString(), at: minus(45), source: "seed", raw: {} },
      { order_id: o.id, status: "out_for_delivery", note: null, landmark: spots[o.id.length % spots.length], eta: eta.toISOString(), at: minus(18), source: "seed", raw: {} },
    ];
  });
  if (events.length) check("events", await sb.from("delivery_events").insert(events));

  // Refunds from the spreadsheet (re-imported each time)
  check("reset refunds", await sb.from("refunds").delete().eq("source", "spreadsheet"));
  const orderCustomer = new Map(orderRows.map((o) => [o.id, o.customer_id]));
  check(
    "refunds",
    await sb.from("refunds").insert(
      refunds.map((r) => ({ ...r, customer_id: orderCustomer.get(r.order_id), source: "spreadsheet" })),
    ),
  );

  // Message history from before DabbaDesk (humans replying on WhatsApp/email)
  check("reset history", await sb.from("messages").delete().eq("handled_by", "human"));
  const historyRows = history.map((m) => {
    const phone = normalizePhone(m.phone);
    // history keeps its real clock times (only today's deliveries move with --live)
    const receivedAt = shiftDays(m.received_at, offset);
    const repliedAt = m.replied_at ? shiftDays(m.replied_at, offset) : null;
    return {
      channel: m.channel,
      phone,
      customer_id: phone ? (customerId.get(phone) ?? null) : null,
      body: m.body,
      category: m.category,
      handled_by: "human",
      needs_human: true,
      status: repliedAt ? "resolved" : "open",
      response_ms: repliedAt ? Date.parse(repliedAt) - Date.parse(receivedAt) : null,
      created_at: receivedAt,
      replied_at: repliedAt,
    };
  });
  check("messages", await sb.from("messages").insert(historyRows));

  console.log("\n  ✅ Loaded");
  console.log(`    riders ${riders.length} · customers ${customers.length} · orders ${orderRows.length}`);
  console.log(`    delivery events ${events.length} · refunds ${refunds.length} · past messages ${historyRows.length}`);

  const demo = onTheRoad[0];
  if (demo) {
    console.log(`\n  🎯 Demo customer for /help: phone ${demo.phone.slice(3)}  order ${demo.id}  (${demo.customer_name})\n`);
  }
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});
