export const IST = "Asia/Kolkata";

/** Calendar date in IST as YYYY-MM-DD. */
export function istDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(at);
}

/** Adds days to a YYYY-MM-DD date string. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "1:05 pm" in IST */
export function formatTimeIST(at: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(at));
}

/** "Wed, 21 Oct" in IST */
export function formatDayIST(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00+05:30`));
}

/** Hour (0–23) of the given instant in IST. */
export function istHour(at: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: IST, hour: "2-digit", hourCycle: "h23" }).format(at),
  );
}
