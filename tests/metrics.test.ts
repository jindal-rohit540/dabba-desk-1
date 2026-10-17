import { describe, expect, it } from "vitest";
import { autoHandledRate, median } from "@/lib/metrics";

describe("median", () => {
  it.each([
    [[], null],
    [[5], 5],
    [[1, 3, 2], 2],
    [[1, 2, 3, 4], 2.5],
  ])("median(%j) = %j", (input, expected) => {
    expect(median(input)).toBe(expected);
  });
});

describe("autoHandledRate", () => {
  const ai = (needs_human: boolean) => ({ handled_by: "ai" as const, needs_human });
  const human = { handled_by: "human" as const, needs_human: true };

  it("counts only AI replies that didn't need a human", () => {
    expect(autoHandledRate([ai(false), ai(false), ai(false), ai(true), human, human])).toBe(0.5);
  });

  it("is 0 with no messages", () => {
    expect(autoHandledRate([])).toBe(0);
  });
});
