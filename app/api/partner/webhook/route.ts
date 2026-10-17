import { NextResponse } from "next/server";
import { applyDeliveryUpdate } from "@/lib/data/deliveries";
import { parsePartnerPayload, PartnerPayloadError } from "@/lib/partner";
import { secretsMatch } from "@/lib/secrets";

export async function POST(request: Request) {
  if (!secretsMatch(request.headers.get("x-ziprun-secret"), process.env.PARTNER_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  try {
    const update = parsePartnerPayload(payload);
    const found = await applyDeliveryUpdate(update, payload);
    if (!found) return NextResponse.json({ error: `unknown order ${update.orderId}` }, { status: 404 });
    return NextResponse.json({ ok: true, orderId: update.orderId, status: update.status });
  } catch (err) {
    if (err instanceof PartnerPayloadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("partner webhook failed:", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
