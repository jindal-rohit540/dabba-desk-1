# Spec: WhatsApp Channel via Twilio (stretch)

## Overview
Customers live on WhatsApp. Using the Twilio WhatsApp Sandbox, incoming WhatsApp messages hit our webhook, go through the **same** `handleCustomerMessage` pipeline, and get the reply back on WhatsApp. The sender's number is the phone; the order ID must appear in the message (e.g. "DX-10541 where is my dabba").

## Depends on
- 02-message-triage

## Routes / entry points
- `POST /api/whatsapp` (Twilio): `application/x-www-form-urlencoded` with `From=whatsapp:+91…`, `Body=…`. Validates the `X-Twilio-Signature` header with `TWILIO_AUTH_TOKEN`. Responds with TwiML `<Response><Message>…</Message></Response>`.

## New dependencies
- `twilio` (only for `validateRequest`)

## Business rules
1. Invalid signature → 403 (skip validation only when `NODE_ENV=development` and `TWILIO_AUTH_TOKEN` is unset).
2. Extract the first `DX-?\d+` from the body (case-insensitive). If missing, reply asking for the order ID from the morning confirmation; don't call Claude.
3. Phone = `From` without the `whatsapp:` prefix, normalised.
4. `channel = 'whatsapp'`; refunds created with `source = 'whatsapp'`.
5. Reply text is XML-escaped.

## Setup (instructor)
1. Twilio Console → Messaging → Try it out → WhatsApp sandbox → join from your phone (`join <code>`).
2. Sandbox settings → "When a message comes in" → `https://<vercel-url>/api/whatsapp` (POST).
3. Vercel env: `TWILIO_AUTH_TOKEN`.
4. Local dev alternative: `ngrok http 3000` and use the ngrok URL.

## Tests to write
| Unit | Case | Expected |
|---|---|---|
| `extractOrderId` | "dx10541 where is it" | "DX-10541" |
| `extractOrderId` | "where is my dabba" | null |
| `twiml` | `Tom & Jerry <3` | escaped XML |

## Definition of done
- [ ] Message from your phone to the sandbox → instant reply with live order status
- [ ] Message appears in the dashboard inbox with channel "whatsapp"
