import { describe, expect, it } from "vitest";
import { validatePause } from "@/lib/pause";

describe("validatePause", () => {
  it("starts tomorrow when asked before 9 pm", () => {
    const result = validatePause({ until: "2026-10-24", now: new Date("2026-10-21T10:00:00+05:30") });
    expect(result).toEqual({ ok: true, start: "2026-10-22", until: "2026-10-24", resumeOn: "2026-10-25" });
  });

  it("starts the day after tomorrow when asked after the 9 pm cut-off", () => {
    const result = validatePause({ until: "2026-10-24", now: new Date("2026-10-21T21:30:00+05:30") });
    expect(result).toMatchObject({ ok: true, start: "2026-10-23" });
  });

  it("rejects an end date before the start", () => {
    const result = validatePause({ until: "2026-10-21", now: new Date("2026-10-21T10:00:00+05:30") });
    expect(result.ok).toBe(false);
  });

  it("rejects pauses longer than 30 days", () => {
    const result = validatePause({ until: "2026-11-21", now: new Date("2026-10-21T10:00:00+05:30") });
    expect(result.ok).toBe(false);
  });

  it("rejects garbage dates", () => {
    expect(validatePause({ until: "next week" }).ok).toBe(false);
  });
});
