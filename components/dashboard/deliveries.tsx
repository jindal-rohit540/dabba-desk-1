import { OrderStatusBadge } from "@/components/status";
import { Card } from "@/components/ui";
import type { DeliveryRow } from "@/lib/data/dashboard";
import { formatTimeIST } from "@/lib/time";
import type { OrderStatus } from "@/lib/types";

const SUMMARY: { status: OrderStatus[]; label: string; className: string }[] = [
  { status: ["preparing"], label: "Preparing", className: "bg-sky-soft text-sky" },
  { status: ["out_for_delivery"], label: "On the way", className: "bg-brand-soft text-brand-dark" },
  { status: ["delayed"], label: "Delayed", className: "bg-warn-soft text-warn" },
  { status: ["delivered"], label: "Delivered", className: "bg-leaf-soft text-leaf" },
];

export function Deliveries({ orders }: { orders: DeliveryRow[] }) {
  const onTheRoad = orders.filter((o) => o.status === "out_for_delivery" || o.status === "delayed");
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-lg font-bold">Today&apos;s dabbas</h2>
        <p className="text-sm text-muted">{orders.length} orders</p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-4">
        {SUMMARY.map((s) => (
          <div key={s.label} className={`rounded-xl px-3 py-2 ${s.className}`}>
            <p className="font-display text-xl font-bold tabular-nums">
              {orders.filter((o) => s.status.includes(o.status)).length}
            </p>
            <p className="text-xs font-semibold">{s.label}</p>
          </div>
        ))}
      </div>
      <ul className="max-h-80 divide-y divide-line overflow-y-auto border-t border-line">
        {onTheRoad.map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{o.customer?.name}</p>
              <p className="truncate text-xs text-muted">
                {o.id} · {o.customer?.area} · {o.rider?.name}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <OrderStatusBadge status={o.status} />
              {o.eta && <span className="text-xs text-muted">ETA {formatTimeIST(o.eta)}</span>}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
