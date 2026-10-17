import { describe, expect, it } from "vitest";
import { buildTriageContext } from "@/lib/triage";
import { verifiedCustomer } from "./fixtures/customer";

describe("buildTriageContext", () => {
  const now = new Date("2026-10-21T13:10:00+05:30");
  const context = buildTriageContext(verifiedCustomer(), now);

  it("never includes phone numbers or addresses", () => {
    const json = JSON.stringify(context);
    expect(json).not.toContain("6838637940");
    expect(json).not.toContain("RMZ Ecospace");
    expect(json).not.toContain("+919000000007");
  });

  it("includes what the model needs to answer 'where is my dabba'", () => {
    expect(context.customer_first_name).toBe("Vivaan");
    expect(context.today).toMatchObject({
      order_id: "DX-10541",
      status: "out_for_delivery",
      eta: "1:22 pm",
      rider_first_name: "Prakash",
      last_seen_near: "Sony World Signal",
    });
  });

  it("tells the model whether tomorrow can still be skipped", () => {
    expect(context.tomorrow).toMatchObject({ can_skip: true });
    const late = buildTriageContext(verifiedCustomer(), new Date("2026-10-21T21:30:00+05:30"));
    expect(late.tomorrow).toMatchObject({ can_skip: false });
  });
});
