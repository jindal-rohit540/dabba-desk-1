import type { Order } from "@/lib/types";

export const REFUND_REASONS = [
  "not_delivered",
  "wrong_order",
  "missing_item",
  "quality",
  "late",
  "other",
] as const;
export type RefundReason = (typeof REFUND_REASONS)[number];

/** Share of the order amount we suggest refunding. A human still approves every refund. */
const REFUND_SHARE: Record<RefundReason, number> = {
  not_delivered: 1,
  wrong_order: 1,
  missing_item: 0.25,
  quality: 0.5,
  late: 0.5,
  other: 0, // a human decides
};

/**
 * Suggested refund in paise for an order. Never more than the customer paid.
 * `amount_paise` is already the line total (price × quantity).
 */
export function calculateRefund(
  order: Pick<Order, "amount_paise" | "quantity">,
  reason: RefundReason,
): number {
  const suggested = Math.round(order.amount_paise * REFUND_SHARE[reason]);
  return Math.min(suggested, order.amount_paise);
}
