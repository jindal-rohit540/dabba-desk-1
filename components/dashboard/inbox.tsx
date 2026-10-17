import Link from "next/link";
import { Check, Inbox as InboxIcon, Mail, MessageCircle, Monitor } from "lucide-react";
import { resolveMessageAction } from "@/app/dashboard/actions";
import { CategoryBadge } from "@/components/status";
import { Badge, Card } from "@/components/ui";
import type { InboxMessage } from "@/lib/data/dashboard";
import { formatDuration } from "@/lib/format";
import { formatDayIST, formatTimeIST, istDate } from "@/lib/time";

const CHANNEL_ICON = { web: Monitor, whatsapp: MessageCircle, email: Mail };

export function Inbox({ messages, view }: { messages: InboxMessage[]; view: "all" | "human" }) {
  const today = istDate();
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="text-lg font-bold">Inbox</h2>
        <div className="flex rounded-full bg-paper p-1 text-sm font-medium">
          {(["all", "human"] as const).map((v) => (
            <Link
              key={v}
              href={v === "all" ? "/dashboard" : "/dashboard?view=human"}
              className={`rounded-full px-3 py-1 ${view === v ? "bg-card text-ink shadow-sm" : "text-muted"}`}
            >
              {v === "all" ? "All" : "Needs human"}
            </Link>
          ))}
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-14 text-center text-muted">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-leaf-soft text-leaf">
            <InboxIcon className="size-5" />
          </span>
          <p>Nothing waiting for a human. 🎉</p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {messages.map((m) => {
            const Icon = CHANNEL_ICON[m.channel];
            const day = istDate(new Date(m.created_at));
            return (
              <li key={m.id} className="space-y-2 px-5 py-4 hover:bg-paper/60">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Icon className="size-4 text-muted" aria-label={m.channel} />
                  <span className="font-semibold">{m.customer?.name ?? "Unknown sender"}</span>
                  <span className="text-muted">
                    {day === today ? "" : `${formatDayIST(day)}, `}
                    {formatTimeIST(m.created_at)}
                  </span>
                  <CategoryBadge category={m.category} />
                  {m.handled_by === "ai" && m.response_ms != null && (
                    <Badge tone="leaf">AI · {formatDuration(m.response_ms)}</Badge>
                  )}
                  {m.handled_by === "human" && m.response_ms != null && (
                    <Badge>Human · {formatDuration(m.response_ms)}</Badge>
                  )}
                  {m.needs_human && m.status === "open" && <Badge tone="warn">Needs human</Badge>}
                </div>
                <p className="text-ink">“{m.body}”</p>
                {m.reply && (
                  <p className="rounded-xl bg-paper px-3 py-2 text-sm text-muted">
                    <span className="font-semibold text-ink">DabbaDesk:</span> {m.reply}
                  </p>
                )}
                {m.status === "open" && (
                  <form action={resolveMessageAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-semibold hover:border-leaf/40 hover:bg-leaf-soft hover:text-leaf">
                      <Check className="size-3.5" /> Mark resolved
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
