import { describe, expect, it } from "vitest";
import { secretsMatch } from "@/lib/secrets";

describe("secretsMatch", () => {
  it("matches identical secrets only", () => {
    expect(secretsMatch("abc123", "abc123")).toBe(true);
    expect(secretsMatch("abc124", "abc123")).toBe(false);
    expect(secretsMatch("abc", "abc123")).toBe(false);
  });

  it("fails closed when either side is missing", () => {
    expect(secretsMatch(null, "abc")).toBe(false);
    expect(secretsMatch("abc", undefined)).toBe(false);
    expect(secretsMatch("", "")).toBe(false);
  });
});
