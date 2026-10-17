import { timingSafeEqual } from "node:crypto";

/** Constant-time string comparison for shared secrets. */
export function secretsMatch(given: string | null | undefined, expected: string | undefined): boolean {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
