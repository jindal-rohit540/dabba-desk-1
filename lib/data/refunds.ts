import "server-only";
import { db } from "@/lib/supabase/server";
import type { Refund } from "@/lib/types";

export async function insertRefundRequest(
  refund: Pick<Refund, "order_id" | "customer_id" | "reason" | "amount_paise" | "source">,
): Promise<boolean> {
  // The AI path may only ever create 'requested' refunds. Approval is a human action.
  const { error } = await db().from("refunds").insert({ ...refund, status: "requested" });
  if (error) console.error("insertRefundRequest failed:", error.message);
  return !error;
}
