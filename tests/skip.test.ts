import { describe, expect, it } from "vitest";
import { canSkip, skipDeadline } from "@/lib/skip";

describe("skip cut-off", () => {
  it("is 21:00 IST the night before", () => {
    expect(skipDeadline("2026-10-22").toISOString()).toBe("2026-10-21T15:30:00.000Z");
  });

  it("allows skipping a scheduled dabba before the cut-off", () => {
    const now = new Date("2026-10-21T20:59:00+05:30");
    expect(canSkip({ delivery_date: "2026-10-22", status: "scheduled" }, now)).toEqual({ allowed: true });
  });

  it("refuses after the cut-off", () => {
    const now = new Date("2026-10-21T21:00:00+05:30");
    const result = canSkip({ delivery_date: "2026-10-22", status: "scheduled" }, now);
    expect(result.allowed).toBe(false);
  });

  it("refuses orders that aren't scheduled", () => {
    const now = new Date("2026-10-21T10:00:00+05:30");
    expect(canSkip({ delivery_date: "2026-10-22", status: "skipped" }, now)).toEqual({
      allowed: false,
      reason: "already skipped",
    });
  });
});
