import { findVerifiedCustomer, markOrderSkipped, type VerifiedCustomer } from "@/lib/data/orders";
import { insertMessage, type NewMessage } from "@/lib/data/messages";
import { insertRefundRequest } from "@/lib/data/refunds";
import { redactPII } from "@/lib/pii";
import { calculateRefund } from "@/lib/refunds";
import { canSkip } from "@/lib/skip";
import { buildTriageContext, triageMessage, type Triage } from "@/lib/triage";
import type { Message, MessageCategory } from "@/lib/types";

export type IncomingMessage = {
  channel: Message["channel"];
  phone: string; // normalised +91…
  orderId: string; // normalised DX-…
  body: string;
};

export type HandledMessage = {
  verified: boolean;
  reply: string;
  category: MessageCategory | null;
  needsHuman: boolean;
  actions: string[];
  customer: VerifiedCustomer | null;
  responseMs: number;
};

export const NOT_VERIFIED_REPLY =
  "We couldn't match that phone number with that order ID. Please check the order ID on this morning's WhatsApp confirmation (it looks like DX-10541).";
export const FALLBACK_REPLY =
  "Thanks for your message! Our team has it and will reply shortly. 🙏";

// Injected so tests can run without Supabase or the OpenAI API.
export type Deps = {
  findVerifiedCustomer: typeof findVerifiedCustomer;
  triageMessage: typeof triageMessage;
  markOrderSkipped: typeof markOrderSkipped;
  insertRefundRequest: typeof insertRefundRequest;
  insertMessage: (m: NewMessage) => Promise<void>;
  now: () => Date;
};

const defaultDeps: Deps = {
  findVerifiedCustomer,
  triageMessage,
  markOrderSkipped,
  insertRefundRequest,
  insertMessage,
  now: () => new Date(),
};

export async function handleCustomerMessage(
  input: IncomingMessage,
  deps: Deps = defaultDeps,
): Promise<HandledMessage> {
  const started = deps.now().getTime();
  const verified = await deps.findVerifiedCustomer(input.phone, input.orderId);

  if (!verified) {
    const responseMs = deps.now().getTime() - started;
    await deps.insertMessage({
      channel: input.channel,
      phone: input.phone,
      customer_id: null,
      order_id: null,
      body: input.body,
      category: null,
      reply: NOT_VERIFIED_REPLY,
      handled_by: "ai",
      needs_human: false,
      status: "auto_resolved",
      response_ms: responseMs,
    });
    return {
      verified: false,
      reply: NOT_VERIFIED_REPLY,
      category: null,
      needsHuman: false,
      actions: [],
      customer: null,
      responseMs,
    };
  }

  let triage: Triage;
  try {
    triage = await deps.triageMessage(input.body, buildTriageContext(verified, deps.now()));
  } catch (err) {
    console.error("triage error:", err instanceof Error ? redactPII(err.message) : "unknown");
    triage = {
      category: "other",
      needs_human: true,
      refund_reason: null,
      wants_skip_tomorrow: false,
      reply: FALLBACK_REPLY,
    };
  }

  // Deterministic actions. The model only *suggests*; code decides.
  const actions: string[] = [];
  let reply = triage.reply;
  let needsHuman = triage.needs_human || triage.category === "refund" || triage.category === "complaint";

  if (triage.category === "skip_day" && triage.wants_skip_tomorrow && verified.tomorrow) {
    if (canSkip(verified.tomorrow, deps.now()).allowed) {
      const ok = await deps.markOrderSkipped(verified.tomorrow.id);
      if (ok) actions.push(`Skipped ${verified.tomorrow.id}`);
      else {
        needsHuman = true;
        reply = FALLBACK_REPLY;
      }
    }
  }

  if (triage.category === "refund") {
    const order = verified.today ?? verified.referenced;
    const amount = calculateRefund(order, triage.refund_reason ?? "other");
    const ok = await deps.insertRefundRequest({
      order_id: order.id,
      customer_id: verified.customer.id,
      reason: triage.refund_reason ?? "other",
      amount_paise: amount,
      source: input.channel === "whatsapp" ? "whatsapp" : "dabbadesk",
    });
    if (ok) actions.push(`Refund request logged for ${order.id}`);
  }

  const responseMs = deps.now().getTime() - started;
  await deps.insertMessage({
    channel: input.channel,
    phone: input.phone,
    customer_id: verified.customer.id,
    order_id: (verified.today ?? verified.referenced).id,
    body: input.body,
    category: triage.category,
    reply,
    handled_by: "ai",
    needs_human: needsHuman,
    status: needsHuman ? "open" : "auto_resolved",
    response_ms: responseMs,
    replied_at: deps.now().toISOString(),
  });

  return {
    verified: true,
    reply,
    category: triage.category,
    needsHuman,
    actions,
    customer: verified,
    responseMs,
  };
}
