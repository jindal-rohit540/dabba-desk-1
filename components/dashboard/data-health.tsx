import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { DataCheckRun } from "@/lib/data/data-checks";
import { formatDayIST, formatTimeIST, istDate } from "@/lib/time";

const SEVERITY_TONE = { high: "danger", medium: "warn", low: "neutral" } as const;

export function DataHealth({ run }: { run: DataCheckRun | null }) {
  if (!run) {
    return (
      <Card className="p-5 text-sm text-muted">
        <p className="font-semibold text-ink">Data health</p>
        No nightly check has run yet.
      </Card>
    );
  }
  const healthy = run.issue_count === 0;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span
          className={`inline-flex size-9 items-center justify-center rounded-xl ${healthy ? "bg-leaf-soft text-leaf" : "bg-danger-soft text-danger"}`}
        >
          {healthy ? <ShieldCheck className="size-5" /> : <ShieldAlert className="size-5" />}
        </span>
        <div>
          <h2 className="font-bold">Data health</h2>
          <p className="text-xs text-muted">
            Checked {formatDayIST(istDate(new Date(run.ran_at)))}, {formatTimeIST(run.ran_at)}
          </p>
        </div>
        <span className="ml-auto">
          {healthy ? <Badge tone="leaf">All good</Badge> : <Badge tone="danger">{run.issue_count} issues</Badge>}
        </span>
      </div>
      {!healthy && (
        <ul className="max-h-56 divide-y divide-line overflow-y-auto">
          {run.issues.slice(0, 20).map((issue, i) => (
            <li key={i} className="flex items-start gap-2 px-5 py-2.5 text-sm">
              <Badge tone={SEVERITY_TONE[issue.severity]}>{issue.severity}</Badge>
              <span>
                <span className="font-medium">{issue.orderId}</span>{" "}
                <span className="text-muted">{issue.message}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
