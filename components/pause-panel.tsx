"use client";

import { useActionState } from "react";
import { PauseCircle } from "lucide-react";
import { pauseMySubscription } from "@/app/help/actions";
import { buttonStyles, Card } from "@/components/ui";

export function PausePanel({ phone, orderId }: { phone: string; orderId: string }) {
  const [state, formAction, pending] = useActionState(pauseMySubscription, null);
  return (
    <Card className="space-y-3 p-5">
      <p className="flex items-center gap-2 font-semibold">
        <PauseCircle className="size-4 text-brand" /> Travelling? Pause your dabbas
      </p>
      {state?.ok ? (
        <p className="rounded-xl bg-leaf-soft px-3 py-2 text-sm text-leaf">{state.message}</p>
      ) : (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="orderId" value={orderId} />
          <label className="block space-y-1 text-xs font-semibold text-muted">
            Pause until (inclusive)
            <input
              type="date"
              name="until"
              required
              className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm font-normal text-ink outline-none focus:border-brand"
            />
          </label>
          <button disabled={pending} className={`${buttonStyles.secondary} w-full`}>
            {pending ? "Pausing…" : "Pause subscription"}
          </button>
          {state && !state.ok && <p className="text-sm text-danger">{state.message}</p>}
        </form>
      )}
    </Card>
  );
}
