import "server-only";
import { db } from "@/lib/supabase/server";
import { addDays, istDate } from "@/lib/time";
import type { Customer, DeliveryEvent, Order, Rider, Subscription } from "@/lib/types";

export type OrderWithTracking = Order & { rider: Rider | null; events: DeliveryEvent[] };

export type VerifiedCustomer = {
  customer: Customer;
  subscription: Subscription | null;
  referenced: Order; // the order ID the customer typed
  today: OrderWithTracking | null;
  tomorrow: Order | null;
};

/**
 * Loads everything DabbaDesk may talk about, but only when phone AND order ID belong together.
 * Returns null on any mismatch so callers can't accidentally leak data.
 */
export async function findVerifiedCustomer(
  phone: string,
  orderId: string,
): Promise<VerifiedCustomer | null> {
  const sb = db();
  const { data: customer } = await sb.from("customers").select("*").eq("phone", phone).maybeSingle();
  if (!customer) return null;

  const { data: referenced } = await sb
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("customer_id", customer.id)
    .maybeSingle();
  if (!referenced) return null;

  const todayDate = istDate();
  const [{ data: subscription }, { data: upcoming }] = await Promise.all([
    sb.from("subscriptions").select("*").eq("customer_id", customer.id).maybeSingle(),
    sb
      .from("orders")
      .select("*")
      .eq("customer_id", customer.id)
      .in("delivery_date", [todayDate, addDays(todayDate, 1)]),
  ]);

  const todayOrder = (upcoming ?? []).find((o) => o.delivery_date === todayDate) ?? null;
  const tomorrow = (upcoming ?? []).find((o) => o.delivery_date === addDays(todayDate, 1)) ?? null;

  return {
    customer,
    subscription,
    referenced,
    today: todayOrder ? await withTracking(todayOrder) : null,
    tomorrow,
  };
}

async function withTracking(order: Order): Promise<OrderWithTracking> {
  const sb = db();
  const [{ data: rider }, { data: events }] = await Promise.all([
    order.rider_id
      ? sb.from("riders").select("*").eq("id", order.rider_id).maybeSingle()
      : Promise.resolve({ data: null }),
    sb.from("delivery_events").select("*").eq("order_id", order.id).order("at", { ascending: false }).limit(5),
  ]);
  return { ...order, rider: rider ?? null, events: events ?? [] };
}

export async function markOrderSkipped(orderId: string): Promise<boolean> {
  const { data, error } = await db()
    .from("orders")
    .update({ status: "skipped", updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "scheduled")
    .select("id");
  return !error && (data?.length ?? 0) === 1;
}
