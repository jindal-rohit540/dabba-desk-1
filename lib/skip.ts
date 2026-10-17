import type { Order } from "@/lib/types";
import { IST } from "@/lib/time";

export const SKIP_CUTOFF_HOUR = 21; // 9 pm IST the night before delivery

/** Latest instant a dabba for `deliveryDate` (YYYY-MM-DD) can be skipped: 21:00 IST the day before. */
export function skipDeadline(deliveryDate: string): Date {
  const d = new Date(`${deliveryDate}T${String(SKIP_CUTOFF_HOUR).padStart(2, "0")}:00:00+05:30`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

export type SkipCheck = { allowed: true } | { allowed: false; reason: string };

export function canSkip(order: Pick<Order, "delivery_date" | "status">, now = new Date()): SkipCheck {
  if (order.status === "skipped") return { allowed: false, reason: "already skipped" };
  if (order.status !== "scheduled") return { allowed: false, reason: `order is ${order.status}` };
  if (now >= skipDeadline(order.delivery_date)) {
    const deadline = new Intl.DateTimeFormat("en-IN", {
      timeZone: IST,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(skipDeadline(order.delivery_date));
    return { allowed: false, reason: `skip cut-off was ${deadline}` };
  }
  return { allowed: true };
}
