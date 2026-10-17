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

// v2 arrived without notice: nested under `data`, renamed fields, epoch-second timestamps.
const V2 = z.object({
  type: z.literal("shipment_update"),
  data: z.object({
    reference: z.string().regex(/^DX-\d+$/),
    courier_id: z.string().optional(),
    state: z.string(),
    delay_reason: z.string().optional(),
    expected_at: z.number().nullable().optional(),
    updated_at: z.number(),
  }),
});

const V2_STATUS: Record<string, DeliveryUpdate["status"]> = {
  in_transit: "out_for_delivery",
  delayed: "delayed",
  delivered: "delivered",
};

const iso = (s: string) => new Date(s).toISOString();
const fromEpoch = (seconds: number) => new Date(seconds * 1000).toISOString();

export function parsePartnerPayload(payload: unknown): DeliveryUpdate {
  const v2 = V2.safeParse(payload);
  if (v2.success) return fromV2(v2.data);

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

function fromV2({ data }: z.infer<typeof V2>): DeliveryUpdate {
  const status = V2_STATUS[data.state];
  if (!status) throw new PartnerPayloadError(`Unknown ZipRun v2 state "${data.state}"`);
  return {
    orderId: data.reference,
    status,
    eta: data.expected_at ? fromEpoch(data.expected_at) : null,
    landmark: null, // v2 only sends coordinates
    note: data.delay_reason ?? null,
    at: fromEpoch(data.updated_at),
    riderId: data.courier_id ?? null,
  };
}
