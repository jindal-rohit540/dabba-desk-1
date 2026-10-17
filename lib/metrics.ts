import type { Message } from "@/lib/types";

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Share of messages answered by DabbaDesk with no human needed. */
export function autoHandledRate(messages: Pick<Message, "handled_by" | "needs_human">[]): number {
  if (messages.length === 0) return 0;
  const auto = messages.filter((m) => m.handled_by === "ai" && !m.needs_human).length;
  return auto / messages.length;
}
