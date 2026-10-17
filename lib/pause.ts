import { SKIP_CUTOFF_HOUR } from "@/lib/skip";
import { addDays, istDate, istHour } from "@/lib/time";

export const MAX_PAUSE_DAYS = 30;

export type PauseCheck =
  | { ok: true; start: string; until: string; resumeOn: string }
  | { ok: false; error: string };

/** Pause starts tomorrow, or the day after if it's past the 9 pm skip cut-off. */
export function validatePause({ until, now = new Date() }: { until: string; now?: Date }): PauseCheck {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) return { ok: false, error: "Pick a date to pause until." };
  const today = istDate(now);
  const start = addDays(today, istHour(now) >= SKIP_CUTOFF_HOUR ? 2 : 1);
  if (until < start) return { ok: false, error: `The earliest pause can end is ${start}.` };
  if (until > addDays(today, MAX_PAUSE_DAYS)) {
    return { ok: false, error: `You can pause for up to ${MAX_PAUSE_DAYS} days at a time.` };
  }
  return { ok: true, start, until, resumeOn: addDays(until, 1) };
}
