import twilio from "twilio";
import { normalizePhone } from "@/lib/etl/clean";
import { handleCustomerMessage } from "@/lib/handle-message";
import { ASK_FOR_ORDER_ID, extractOrderId, twiml } from "@/lib/whatsapp";

// Twilio WhatsApp webhook: "When a message comes in" → POST https://<your-app>/api/whatsapp
export async function POST(request: Request) {
  const params = Object.fromEntries((await request.formData()).entries()) as Record<string, string>;

  const token = process.env.TWILIO_AUTH_TOKEN;
  if (token) {
    // Twilio signs the exact public URL it called
    const url = new URL(request.url);
    const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
    const publicUrl = `${proto}://${host}${url.pathname}${url.search}`;
    const signature = request.headers.get("x-twilio-signature") ?? "";
    if (!twilio.validateRequest(token, signature, publicUrl, params)) {
      return new Response("invalid signature", { status: 403 });
    }
  } else if (process.env.NODE_ENV !== "development") {
    return new Response("TWILIO_AUTH_TOKEN not configured", { status: 500 });
  }

  const body = (params.Body ?? "").trim();
  const phone = normalizePhone((params.From ?? "").replace(/^whatsapp:/, ""));
  const orderId = extractOrderId(body);

  let reply = ASK_FOR_ORDER_ID;
  if (phone && orderId && body) {
    const result = await handleCustomerMessage({ channel: "whatsapp", phone, orderId, body });
    reply = result.reply;
  }

  return new Response(twiml(reply), { headers: { "content-type": "text/xml" } });
}
