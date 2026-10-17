import "server-only";
import { median, autoHandledRate } from "@/lib/metrics";
import { db } from "@/lib/supabase/server";
import { istDate } from "@/lib/time";
import type { Customer, Message, Order, Refund, Rider } from "@/lib/types";

/** IST day boundaries as ISO strings, for timestamptz filters. */
function istDayRange(date: string) {
  return { from: `${date}T00:00:00+05:30`, to: `${date}T23:59:59.999+05:30` };
}

export async function getKpis(date = istDate()) {
  const sb = db();
  const { from, to } = istDayRange(date);
  const [{ data: today }, { data: history }, { count: pendingRefunds }] = await Promise.all([
    sb
      .from("messages")
      .select("handled_by, needs_human, status, response_ms, category")
      .gte("created_at", from)
      .lte("created_at", to),
    sb.from("messages").select("response_ms").eq("handled_by", "human").not("response_ms", "is", null),
    sb.from("refunds").select("id", { count: "exact", head: true }).eq("status", "requested"),
  ]);

  const msgs = today ?? [];
  const aiTimes = msgs.filter((m) => m.handled_by === "ai" && m.response_ms != null).map((m) => m.response_ms!);
  return {
    messagesToday: msgs.length,
    autoHandledRate: autoHandledRate(msgs),
    needsHuman: msgs.filter((m) => m.needs_human && m.status === "open").length,
    medianReplyMsNow: median(aiTimes),
    medianReplyMsBefore: median((history ?? []).map((m) => m.response_ms!)),
    pendingRefunds: pendingRefunds ?? 0,
    byCategory: msgs.reduce<Record<string, number>>((acc, m) => {
      const key = m.category ?? "unverified";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

export type InboxMessage = Message & { customer: Pick<Customer, "name"> | null };

export async function listMessages({ needsHumanOnly = false, limit = 30 } = {}): Promise<InboxMessage[]> {
  let query = db()
    .from("messages")
    .select("*, customer:customers(name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (needsHumanOnly) query = query.eq("needs_human", true).eq("status", "open");
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as InboxMessage[];
}

export type RefundRow = Refund & {
  customer: Pick<Customer, "name"> | null;
  order: Pick<Order, "meal" | "amount_paise" | "quantity" | "delivery_date"> | null;
};

export async function listRefunds({ limit = 20 } = {}): Promise<RefundRow[]> {
  const { data, error } = await db()
    .from("refunds")
    .select("*, customer:customers(name), order:orders(meal, amount_paise, quantity, delivery_date)")
    .order("status", { ascending: false }) // 'requested' sorts before 'rejected'/'paid'/'approved' descending
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data as RefundRow[];
}

export type DeliveryRow = Order & {
  customer: Pick<Customer, "name" | "area" | "phone"> | null;
  rider: Pick<Rider, "name"> | null;
};

export async function listTodaysDeliveries(date = istDate()): Promise<DeliveryRow[]> {
  const { data, error } = await db()
    .from("orders")
    .select("*, customer:customers(name, area, phone), rider:riders(name)")
    .eq("delivery_date", date)
    .order("eta", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return data as DeliveryRow[];
}

export async function resolveMessage(id: string): Promise<void> {
  const { error } = await db()
    .from("messages")
    .update({ status: "resolved", replied_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function decideRefund(id: string, decision: "approved" | "rejected"): Promise<void> {
  const { error } = await db().from("refunds").update({ status: decision }).eq("id", id).eq("status", "requested");
  if (error) throw new Error(error.message);
}
