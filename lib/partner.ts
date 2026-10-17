import { z } from "zod";

// ZipRun (delivery partner) payloads → our own DeliveryUpdate. The ONLY place that knows ZipRun's format.

export type DeliveryUpdate = {
  orderId: string;
  status: "out_for_delivery" | "delayed" | "delivered";
  eta: string | null;
  landmark: string | null;
  note: string | null;
  at: string;
  riderId: string | null;
};

export class PartnerPayloadError extends Error {}

const V1 = z.object({
  event: z.literal("delivery.status"),
  order_ref: z.string().regex(/^DX-\d+$/),
  rider: z.object({ id: z.string() }).optional(),
  status: z.string(),
  eta: z.string().nullable().optional(),
  delay_reason: z.string().optional(),
  location: z.object({ landmark: z.string().optional() }).optional(),
  ts: z.string(),
});

const V1_STATUS: Record<string, DeliveryUpdate["status"]> = {
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELAYED: "delayed",
  DELIVERED: "delivered",
};

const iso = (s: string) => new Date(s).toISOString();

export function parsePartnerPayload(payload: unknown): DeliveryUpdate {
  const v1 = V1.safeParse(payload);
  if (!v1.success) throw new PartnerPayloadError("Unrecognised ZipRun payload");
  const status = V1_STATUS[v1.data.status];
  if (!status) throw new PartnerPayloadError(`Unknown ZipRun status "${v1.data.status}"`);
  return {
    orderId: v1.data.order_ref,
    status,
    eta: v1.data.eta ? iso(v1.data.eta) : null,
    landmark: v1.data.location?.landmark ?? null,
    note: v1.data.delay_reason ?? null,
    at: iso(v1.data.ts),
    riderId: v1.data.rider?.id ?? null,
  };
}
