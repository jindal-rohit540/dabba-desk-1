import { describe, expect, it } from "vitest";
import { findDataIssues } from "@/lib/data-checks";

const now = new Date("2026-10-21T18:00:00+05:30");
const order = (over = {}) => ({
  id: "DX-1",
  status: "delivered" as const,
  eta: "2026-10-21T13:00:00+05:30",
  delivered_at: "2026-10-21T13:05:00+05:30",
  amount_paise: 22000,
  ...over,
});

describe("findDataIssues", () => {
  it("finds nothing in clean data", () => {
    expect(findDataIssues({ orders: [order()], refunds: [], now })).toEqual([]);
  });

  it("flags refunds bigger than the order (the Diwali bug)", () => {
    const issues = findDataIssues({
      orders: [order()],
      refunds: [{ order_id: "DX-1", amount_paise: 44000, status: "requested" }],
      now,
    });
    expect(issues).toMatchObject([{ code: "REFUND_EXCEEDS_ORDER", severity: "high", orderId: "DX-1" }]);
  });

  it("ignores rejected oversized refunds and refunds equal to the order", () => {
    const issues = findDataIssues({
      orders: [order()],
      refunds: [
        { order_id: "DX-1", amount_paise: 44000, status: "rejected" },
        { order_id: "DX-1", amount_paise: 22000, status: "requested" },
      ],
      now,
    });
    expect(issues).toEqual([]);
  });

  it("flags dabbas stuck on the way 2+ hours after ETA, but not 1 hour", () => {
    const stuck = order({ status: "out_for_delivery", delivered_at: null, eta: "2026-10-21T15:30:00+05:30" });
    const late = order({ id: "DX-2", status: "delayed", delivered_at: null, eta: "2026-10-21T17:00:00+05:30" });
    const codes = findDataIssues({ orders: [stuck, late], refunds: [], now }).map((i) => i.orderId);
    expect(codes).toEqual(["DX-1"]);
  });

  it("flags delivered orders with no delivery time", () => {
    const issues = findDataIssues({ orders: [order({ delivered_at: null })], refunds: [], now });
    expect(issues[0].code).toBe("DELIVERED_WITHOUT_TIME");
  });

  it("flags negative amounts", () => {
    const issues = findDataIssues({ orders: [order({ amount_paise: -100 })], refunds: [], now });
    expect(issues[0]).toMatchObject({ code: "NEGATIVE_AMOUNT", severity: "high" });
  });
});
