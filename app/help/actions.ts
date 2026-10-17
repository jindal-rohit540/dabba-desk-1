"use server";

import { z } from "zod";
import { normalizeOrderId, normalizePhone } from "@/lib/etl/clean";
import { handleCustomerMessage } from "@/lib/handle-message";
import { formatTimeIST } from "@/lib/time";
import type { MessageCategory, OrderStatus } from "@/lib/types";

export type OrderCard = {
  orderId: string;
  meal: string;
  quantity: number;
  status: OrderStatus;
  eta: string | null;
  deliveredAt: string | null;
  riderName: string | null;
  lastSeenNear: string | null;
  lastUpdate: string | null;
};

export type AskResult =
  | { ok: false; error: string }
  | {
      ok: true;
      question: string;
      reply: string;
      category: MessageCategory | null;
      needsHuman: boolean;
      actions: string[];
      responseMs: number;
      card: OrderCard | null;
    };

const Input = z.object({
  phone: z.string().trim().min(1, "Enter your phone number"),
  orderId: z.string().trim().min(1, "Enter your order ID"),
  message: z.string().trim().min(2, "Type your question").max(500, "Keep it under 500 characters"),
});

export async function askDabbaDesk(_prev: AskResult | null, formData: FormData): Promise<AskResult> {
  const parsed = Input.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { ok: false, error: "That doesn't look like an Indian mobile number." };
  const orderId = normalizeOrderId(parsed.data.orderId);
  if (!orderId) return { ok: false, error: "Order IDs look like DX-10541." };

  const result = await handleCustomerMessage({
    channel: "web",
    phone,
    orderId,
    body: parsed.data.message,
  });

  const today = result.customer?.today;
  return {
    ok: true,
    question: parsed.data.message,
    reply: result.reply,
    category: result.category,
    needsHuman: result.needsHuman,
    actions: result.actions,
    responseMs: result.responseMs,
    card: today
      ? {
          orderId: today.id,
          meal: today.meal,
          quantity: today.quantity,
          status: today.status,
          eta: today.eta ? formatTimeIST(today.eta) : null,
          deliveredAt: today.delivered_at ? formatTimeIST(today.delivered_at) : null,
          riderName: today.rider?.name ?? null,
          lastSeenNear: today.events[0]?.landmark ?? null,
          lastUpdate: today.events[0] ? formatTimeIST(today.events[0].at) : null,
        }
      : null,
  };
}
