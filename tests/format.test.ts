import { describe, expect, it } from "vitest";
import { formatDuration, formatINR } from "@/lib/format";
import { addDays, istDate, istHour } from "@/lib/time";

describe("formatINR", () => {
  it("formats paise as rupees with Indian grouping", () => {
    expect(formatINR(22000)).toBe("₹220");
    expect(formatINR(12345600)).toBe("₹1,23,456");
    expect(formatINR(5050)).toBe("₹50.5");
  });
});

describe("formatDuration", () => {
  it("uses seconds, minutes or hours depending on size", () => {
    expect(formatDuration(3400)).toBe("3.4s");
    expect(formatDuration(125_000)).toBe("2m 5s");
    expect(formatDuration(7_380_000)).toBe("2h 3m");
  });
});

describe("IST helpers", () => {
  it("uses the IST calendar day, not UTC", () => {
    // 20:00 UTC on 20 Oct is 01:30 IST on 21 Oct
    expect(istDate(new Date("2026-10-20T20:00:00Z"))).toBe("2026-10-21");
    expect(istHour(new Date("2026-10-20T20:00:00Z"))).toBe(1);
  });

  it("adds days across month boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-11-01", -1)).toBe("2026-10-31");
  });
});
