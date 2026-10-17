const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** Money is stored as integer paise. 22000 → "₹220". */
export function formatINR(paise: number): string {
  return inr.format(paise / 100);
}

/** 125_000 ms → "2m 5s", 3_400 → "3.4s", 7_380_000 → "2h 3m" */
export function formatDuration(ms: number): string {
  if (ms < 100) return "<0.1s";
  if (ms < 60_000) return `${Math.round(ms / 100) / 10}s`;
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 10) return `${totalMinutes}m ${Math.round((ms % 60_000) / 1000)}s`;
  if (totalMinutes < 60) return `${totalMinutes}m`;
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}
