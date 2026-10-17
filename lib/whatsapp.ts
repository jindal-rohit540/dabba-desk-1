import { normalizeOrderId } from "@/lib/etl/clean";

export const ASK_FOR_ORDER_ID =
  "Hi! 👋 Please include your order ID from this morning's confirmation, e.g. \"DX-10541 where is my dabba?\"";

/** First order ID mentioned in a WhatsApp message: "dx10541 where is it" → "DX-10541" */
export function extractOrderId(text: string): string | null {
  const match = text.match(/\bdx[\s-]?\d{3,}\b/i);
  return match ? normalizeOrderId(match[0]) : null;
}

const XML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

/** Twilio replies with TwiML. */
export function twiml(message: string): string {
  const escaped = message.replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
}
