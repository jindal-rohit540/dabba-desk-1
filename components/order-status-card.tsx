import { Bike, CheckCircle2, ChefHat, Clock3, MapPin } from "lucide-react";
import type { OrderCard } from "@/app/help/actions";
import { Badge } from "@/components/ui";

const STEPS = [
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "out_for_delivery", label: "On the way", icon: Bike },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
] as const;

function stepIndex(status: OrderCard["status"]): number {
  if (status === "delivered") return 2;
  if (status === "out_for_delivery" || status === "delayed") return 1;
  if (status === "preparing") return 0;
  return -1;
}

export function OrderStatusCard({ card }: { card: OrderCard }) {
  const current = stepIndex(card.status);
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Today · {card.orderId}</p>
          <p className="font-display text-lg font-bold">
            {card.meal}
            {card.quantity > 1 && <span className="text-muted"> × {card.quantity}</span>}
          </p>
        </div>
        {card.status === "delayed" ? (
          <Badge tone="warn">Delayed</Badge>
        ) : card.status === "skipped" ? (
          <Badge>Skipped</Badge>
        ) : card.status === "delivered" ? (
          <Badge tone="leaf">Delivered {card.deliveredAt}</Badge>
        ) : card.eta ? (
          <Badge tone="brand">
            <Clock3 className="size-3" /> ETA {card.eta}
          </Badge>
        ) : null}
      </div>

      {current >= 0 && (
        <ol className="grid grid-cols-3 gap-2">
          {STEPS.map(({ key, label, icon: Icon }, i) => (
            <li key={key} className="space-y-1.5">
              <div className={`h-1.5 rounded-full ${i <= current ? "bg-brand" : "bg-line"}`} />
              <p
                className={`flex items-center gap-1 text-xs font-medium ${i <= current ? "text-ink" : "text-muted"}`}
              >
                <Icon className="size-3.5" /> {label}
              </p>
            </li>
          ))}
        </ol>
      )}

      {(card.riderName || card.lastSeenNear) && card.status !== "delivered" && (
        <p className="mt-4 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="size-4 text-brand" />
          {card.riderName && <span className="font-medium text-ink">{card.riderName}</span>}
          {card.lastSeenNear && <span>near {card.lastSeenNear}</span>}
          {card.lastUpdate && <span>· {card.lastUpdate}</span>}
        </p>
      )}
    </div>
  );
}
