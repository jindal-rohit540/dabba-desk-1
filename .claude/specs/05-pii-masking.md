# Spec: Mask Customer PII

## Overview
The dashboard is used by four people on their phones, often in public. Phone numbers and office addresses must be masked by default, and they must never appear in server logs or LLM prompts.

## Depends on
- 03-owner-dashboard

## Files to create
- `lib/pii.ts`: `maskPhone(phone)`, `maskAddress(address)`, `redactPII(text)`

## Files to change
- Dashboard components: show masked phone/address
- `lib/handle-message.ts`, `app/api/*`: any `console.*` of customer input goes through `redactPII`

## Business rules
1. `maskPhone("+919845012345")` → `"+91 98•••••345"`. Invalid input → `"•••"`.
2. `maskAddress("Prestige Tech Park, Tower B")` → `"Prestige •••"` (first word only).
3. `redactPII` replaces any Indian mobile number in free text (any common format) with `[phone]`.
4. `buildTriageContext` output never contains phone or address (already tested; keep it green).

## Tests to write
| Input | Expected |
|---|---|
| `maskPhone("+919845012345")` | `"+91 98•••••345"` |
| `maskPhone("")` | `"•••"` |
| `maskAddress("RMZ Ecospace, Bldg 4")` | `"RMZ •••"` |
| `redactPII("call me on 98450 12345 or +91-9845012345")` | `"call me on [phone] or [phone]"` |
| `redactPII("order DX-10541 is late")` | unchanged |

## Definition of done
- [ ] No full phone number visible anywhere on `/dashboard`
- [ ] `/security-review` reports no PII issues in the diff
