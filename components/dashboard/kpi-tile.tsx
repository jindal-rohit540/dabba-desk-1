import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";

export function KpiTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "muted",
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  icon: LucideIcon;
  tone?: "muted" | "leaf" | "warn";
}) {
  const hintColor = { muted: "text-muted", leaf: "text-leaf", warn: "text-warn" }[tone];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Icon className="size-4.5" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold tabular-nums">{value}</p>
      {hint && <p className={`mt-1 text-sm ${hintColor}`}>{hint}</p>}
    </Card>
  );
}
