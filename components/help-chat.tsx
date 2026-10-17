"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, SendHorizontal, ShieldCheck, UserRound, Zap } from "lucide-react";
import { askDabbaDesk, type AskResult } from "@/app/help/actions";
import { OrderStatusCard } from "@/components/order-status-card";
import { Badge, buttonStyles, Card } from "@/components/ui";
import { formatDuration } from "@/lib/format";

const QUICK_QUESTIONS = [
  "Where's my dabba?",
  "Please skip tomorrow, WFH",
  "Got veg instead of chicken, want refund",
  "Is the rider lost?",
];

type Turn = Extract<AskResult, { ok: true }>;

export function HelpChat({ initialQuestion = "" }: { initialQuestion?: string }) {
  const [state, formAction, pending] = useActionState(askDabbaDesk, null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [message, setMessage] = useState(initialQuestion);
  // Controlled so React doesn't clear them after each submit
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const lastState = useRef<AskResult | null>(null);

  useEffect(() => {
    if (state && state !== lastState.current) {
      lastState.current = state;
      if (state.ok) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- append each server result once
        setTurns((t) => [...t, state]);
        setMessage("");
      }
    }
  }, [state]);

  const latestCard = [...turns].reverse().find((t) => t.card)?.card;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card className="flex min-h-[520px] flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-4 bg-chat p-5">
          {turns.length === 0 && (
            <div className="mx-auto max-w-sm rounded-2xl bg-card/90 p-4 text-center text-sm text-muted">
              Enter your phone number and the order ID from this morning&apos;s WhatsApp confirmation, then
              ask anything about your dabba.
            </div>
          )}
          {turns.map((t, i) => (
            <div key={i} className="space-y-2">
              <p className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-tr-sm bg-chat-mine px-3.5 py-2 text-sm shadow-sm">
                {t.question}
              </p>
              <div className="w-fit max-w-[85%] space-y-2 rounded-2xl rounded-tl-sm bg-card px-3.5 py-2.5 text-sm shadow-sm">
                <p>{t.reply}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="leaf">
                    <Zap className="size-3" /> {formatDuration(t.responseMs)}
                  </Badge>
                  {t.category && <Badge tone="sky">{t.category.replace("_", " ")}</Badge>}
                  {t.needsHuman && (
                    <Badge tone="warn">
                      <UserRound className="size-3" /> team notified
                    </Badge>
                  )}
                  {t.actions.map((a) => (
                    <Badge key={a} tone="brand">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {pending && (
            <p className="flex w-fit items-center gap-2 rounded-2xl bg-card px-3.5 py-2 text-sm text-muted shadow-sm">
              <Loader2 className="size-4 animate-spin" /> Checking your order…
            </p>
          )}
        </div>

        <form action={formAction} className="space-y-3 border-t border-line bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold text-muted">
              Phone number
              <input
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="98450 12345"
                required
                className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm font-normal text-ink outline-none focus:border-brand"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-muted">
              Order ID
              <input
                name="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="DX-10541"
                required
                className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm font-normal uppercase text-ink outline-none focus:border-brand"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setMessage(q)}
                className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:border-brand/40 hover:bg-brand-soft hover:text-ink"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your question…"
              required
              className="flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
            <button type="submit" disabled={pending} className={buttonStyles.primary} aria-label="Send">
              <SendHorizontal className="size-4" />
            </button>
          </div>
          {state && !state.ok && <p className="text-sm font-medium text-danger">{state.error}</p>}
        </form>
      </Card>

      <aside className="space-y-4">
        {latestCard ? (
          <OrderStatusCard card={latestCard} />
        ) : (
          <Card className="p-5 text-sm text-muted">
            Your live order status will appear here.
          </Card>
        )}
        <Card className="space-y-2 p-5 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-4 text-leaf" /> Your data is safe
          </p>
          <p className="text-muted">
            We only show order details when your phone number and order ID match. Refunds are always reviewed
            by a person.
          </p>
        </Card>
      </aside>
    </div>
  );
}
