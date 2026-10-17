import "server-only";
import { db } from "@/lib/supabase/server";

/** Pauses the subscription and skips every scheduled dabba in [start, until]. Returns how many were skipped. */
export async function pauseSubscription(customerId: string, start: string, until: string): Promise<number> {
  const sb = db();
  const { error } = await sb
    .from("subscriptions")
    .update({ status: "paused", paused_until: until })
    .eq("customer_id", customerId);
  if (error) throw new Error(error.message);

  const { data, error: skipError } = await sb
    .from("orders")
    .update({ status: "skipped", updated_at: new Date().toISOString() })
    .eq("customer_id", customerId)
    .eq("status", "scheduled")
    .gte("delivery_date", start)
    .lte("delivery_date", until)
    .select("id");
  if (skipError) throw new Error(skipError.message);
  return data?.length ?? 0;
}
