import { describe, expect, it } from "vitest";
import { calculateRefund } from "@/lib/refunds";

describe("calculateRefund", () => {
  it("refunds the full amount when the dabba never arrived", () => {
    expect(calculateRefund({ amount_paise: 11000, quantity: 1 }, "not_delivered")).toBe(11000);
  });

  it("uses the line total for multi-dabba orders (amount already includes quantity)", () => {
    expect(calculateRefund({ amount_paise: 22000, quantity: 2 }, "wrong_order")).toBe(22000);
  });

  it("gives partial refunds for late, quality and missing items", () => {
    expect(calculateRefund({ amount_paise: 18000, quantity: 1 }, "late")).toBe(9000);
    expect(calculateRefund({ amount_paise: 18000, quantity: 1 }, "quality")).toBe(9000);
    expect(calculateRefund({ amount_paise: 18000, quantity: 1 }, "missing_item")).toBe(4500);
  });

  it("suggests nothing for 'other' so a human decides", () => {
    expect(calculateRefund({ amount_paise: 18000, quantity: 1 }, "other")).toBe(0);
  });

  it("never exceeds what the customer paid", () => {
    for (const quantity of [1, 2, 3, 5]) {
      const amount = 15000 * quantity;
      expect(calculateRefund({ amount_paise: amount, quantity }, "not_delivered")).toBeLessThanOrEqual(amount);
    }
  });
});
