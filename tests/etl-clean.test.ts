import { describe, expect, it } from "vitest";
import {
  cleanOrders,
  cleanRefunds,
  normalizeName,
  normalizeOrderId,
  normalizePhone,
  parseAmountToPaise,
  parseDate,
  shiftDays,
} from "@/lib/etl/clean";

describe("normalizePhone", () => {
  it.each([
    ["9845012345", "+919845012345"],
    ["+919845012345", "+919845012345"],
    ["+91-9845012345", "+919845012345"],
    ["98450 12345", "+919845012345"],
    ["09845012345", "+919845012345"],
    ["91 9845012345", "+919845012345"],
  ])("normalises %s", (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
  });

  it.each(["", "12345", "5845012345", "abc"])("rejects %s", (raw) => {
    expect(normalizePhone(raw)).toBeNull();
  });
});

describe("normalizeName", () => {
  it("trims, collapses spaces and title-cases", () => {
    expect(normalizeName("  harsha iyer ")).toBe("Harsha Iyer");
    expect(normalizeName("ANANYA  RAO")).toBe("Ananya Rao");
    expect(normalizeName("   ")).toBeNull();
  });
});

describe("parseDate", () => {
  it("accepts the three formats found in the export", () => {
    expect(parseDate("2026-10-21")).toBe("2026-10-21");
    expect(parseDate("21/10/2026")).toBe("2026-10-21");
    expect(parseDate("21-Oct-2026")).toBe("2026-10-21");
  });

  it("rejects impossible dates", () => {
    expect(parseDate("32/10/2026")).toBeNull();
    expect(parseDate("2026-02-30")).toBeNull();
    expect(parseDate("yesterday")).toBeNull();
  });
});

describe("parseAmountToPaise", () => {
  it("handles rupee symbols and decimals", () => {
    expect(parseAmountToPaise("220")).toBe(22000);
    expect(parseAmountToPaise("₹220")).toBe(22000);
    expect(parseAmountToPaise("Rs. 220.00")).toBe(22000);
    expect(parseAmountToPaise("Rs 90")).toBe(9000);
  });

  it("rejects negatives and blanks", () => {
    expect(parseAmountToPaise("-110")).toBeNull();
    expect(parseAmountToPaise("")).toBeNull();
  });
});

describe("normalizeOrderId", () => {
  it("fixes hand-typed order numbers", () => {
    expect(normalizeOrderId("dx10303")).toBe("DX-10303");
    expect(normalizeOrderId("DX 10303")).toBe("DX-10303");
    expect(normalizeOrderId("10303")).toBeNull();
  });
});

const row = (over: Record<string, string> = {}) => ({
  order_id: "DX-1",
  customer_name: "Vivaan Khan",
  phone: "6838637940",
  area: "Bellandur",
  office_address: "RMZ Ecospace",
  plan: "Veg Basic",
  meal: "Rajma Chawal",
  quantity: "1",
  amount_inr: "110",
  delivery_date: "2026-10-21",
  status: "Out for delivery",
  rider_id: "R-07",
  eta: "2026-10-21 13:05",
  ...over,
});

describe("cleanOrders", () => {
  it("cleans a valid row", () => {
    const { orders, rejects } = cleanOrders([row()]);
    expect(rejects).toHaveLength(0);
    expect(orders[0]).toMatchObject({
      id: "DX-1",
      phone: "+916838637940",
      status: "out_for_delivery",
      amount_paise: 11000,
      eta: "2026-10-21T13:05:00+05:30",
    });
  });

  it("drops exact duplicates and reports bad rows with line numbers", () => {
    const { orders, rejects, duplicates } = cleanOrders([
      row(),
      row(),
      row({ order_id: "DX-2", phone: "" }),
      row({ order_id: "DX-3", status: "lost??" }),
    ]);
    expect(orders).toHaveLength(1);
    expect(duplicates).toBe(1);
    expect(rejects.map((r) => r.line)).toEqual([4, 5]);
    expect(rejects[1].reason).toContain("unknown status");
  });
});

describe("cleanRefunds", () => {
  it("maps spreadsheet statuses and rejects unknown orders and blank amounts", () => {
    const known = new Set(["DX-10303"]);
    const { refunds, rejects } = cleanRefunds(
      [
        { "Order No": "dx10303", "Refund Amt": "₹180", Status: "Done", Reason: "Food spilled", Notes: "" },
        { "Order No": "DX-99999", "Refund Amt": "110", Status: "pending", Reason: "late", Notes: "" },
        { "Order No": "DX-10303", "Refund Amt": "", Status: "pending", Reason: "late", Notes: "" },
      ],
      known,
    );
    expect(refunds).toEqual([
      { order_id: "DX-10303", reason: "Food spilled", amount_paise: 18000, status: "paid", notes: null },
    ]);
    expect(rejects).toHaveLength(2);
  });
});

describe("shiftDays", () => {
  it("moves dates and timestamps but keeps the IST offset", () => {
    expect(shiftDays("2026-10-21", 3)).toBe("2026-10-24");
    expect(shiftDays("2026-10-21T13:05:00+05:30", -1)).toBe("2026-10-20T13:05:00+05:30");
    expect(shiftDays(null, 3)).toBeNull();
  });
});
