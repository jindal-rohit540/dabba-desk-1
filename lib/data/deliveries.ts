import "server-only";
import type { DeliveryUpdate } from "@/lib/partner";
import { db } from "@/lib/supabase/server";

/** Stores the partner event and updates the order. Returns false if the order doesn't exist. */
export async function applyDeliveryUpdate(update: DeliveryUpdate, raw: unknown): Promise<boolean> {
  const sb = db();
  const { data: order } = await sb.from("orders").select("id").eq("id", update.orderId).maybeSingle();
  if (!order) return false;

  const { error: eventError } = await sb.from("delivery_events").insert({
    order_id: update.orderId,
    status: update.status,
    note: update.note,
    landmark: update.landmark,
    eta: update.eta,
    at: update.at,
    source: "ziprun",
    raw,
  });
  if (eventError) throw new Error(eventError.message);

  const changes: Record<string, unknown> = { status: update.status, updated_at: new Date().toISOString() };
  if (update.eta) changes.eta = update.eta;
  if (update.status === "delivered") changes.delivered_at = update.at;
  if (update.riderId) changes.rider_id = update.riderId;
  const { error } = await sb.from("orders").update(changes).eq("id", update.orderId);
  if (error) throw new Error(error.message);
  return true;
}
