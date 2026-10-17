import { decideRefundAction } from "@/app/dashboard/actions";
import { Badge, Card } from "@/components/ui";
import type { RefundRow } from "@/lib/data/dashboard";
import { formatINR } from "@/lib/format";

const STATUS_TONE = { requested: "warn", approved: "sky", paid: "leaf", rejected: "neutral" } as const;

export function RefundsQueue({ refunds }: { refunds: RefundRow[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-lg font-bold">Refunds</h2>
        <p className="text-sm text-muted">Only a person can approve money.</p>
      </div>
      <ul className="divide-y divide-line">
        {refunds.map((r) => {
          const overpaid = r.order && r.amount_paise > r.order.amount_paise;
          return (
            <li key={r.id} className="space-y-2 px-5 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.customer?.name ?? "Unknown"}</p>
                  <p className="truncate text-xs text-muted">
                    {r.order_id} · {r.order?.meal}
                    {r.order && r.order.quantity > 1 ? ` × ${r.order.quantity}` : ""} · {r.reason.replace("_", " ")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`font-display font-bold tabular-nums ${overpaid ? "text-danger" : ""}`}>
                    {formatINR(r.amount_paise)}
                  </p>
                  {r.order && <p className="text-xs text-muted">of {formatINR(r.order.amount_paise)}</p>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                {overpaid && <Badge tone="danger">More than order!</Badge>}
                {r.source !== "dabbadesk" && <Badge>{r.source}</Badge>}
                {r.status === "requested" && (
                  <form action={decideRefundAction} className="ml-auto flex gap-1.5">
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      name="decision"
                      value="approved"
                      className="rounded-full bg-leaf px-3 py-1 text-xs font-semibold text-white hover:opacity-90"
                    >
                      Approve
                    </button>
                    <button
                      name="decision"
                      value="rejected"
                      className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted hover:bg-paper"
                    >
                      Reject
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
