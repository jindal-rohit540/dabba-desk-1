import type { Order, Refund } from "@/lib/types";

export type Issue = {
  code: "REFUND_EXCEEDS_ORDER" | "STUCK_ON_THE_WAY" | "DELIVERED_WITHOUT_TIME" | "NEGATIVE_AMOUNT";
  severity: "high" | "medium" | "low";
  orderId: string;
  message: string;
};

type CheckInput = {
  orders: Pick<Order, "id" | "status" | "eta" | "delivered_at" | "amount_paise">[];
  refunds: Pick<Refund, "order_id" | "amount_paise" | "status">[];
  now: Date;
};

const STUCK_AFTER_MS = 2 * 60 * 60 * 1000;

/** Pure rules for the nightly data-quality job. */
export function findDataIssues({ orders, refunds, now }: CheckInput): Issue[] {
  const issues: Issue[] = [];
  const orderAmount = new Map(orders.map((o) => [o.id, o.amount_paise]));

  for (const r of refunds) {
    const paid = orderAmount.get(r.order_id);
    if (paid != null && r.amount_paise > paid && r.status !== "rejected") {
      issues.push({
        code: "REFUND_EXCEEDS_ORDER",
        severity: "high",
        orderId: r.order_id,
        message: `Refund ₹${r.amount_paise / 100} is more than the order total ₹${paid / 100}`,
      });
    }
  }

  for (const o of orders) {
    if (o.amount_paise < 0) {
      issues.push({ code: "NEGATIVE_AMOUNT", severity: "high", orderId: o.id, message: "Order amount is negative" });
    }
    if (
      (o.status === "out_for_delivery" || o.status === "delayed") &&
      o.eta &&
      now.getTime() - Date.parse(o.eta) > STUCK_AFTER_MS
    ) {
      issues.push({
        code: "STUCK_ON_THE_WAY",
        severity: "medium",
        orderId: o.id,
        message: "Still on the way more than 2 hours after its ETA",
      });
    }
    if (o.status === "delivered" && !o.delivered_at) {
      issues.push({
        code: "DELIVERED_WITHOUT_TIME",
        severity: "low",
        orderId: o.id,
        message: "Marked delivered but has no delivery time",
      });
    }
  }
  return issues;
}
