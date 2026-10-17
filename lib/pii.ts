// Masking helpers so customer phone numbers and addresses don't leak onto screens or into logs.

/** "+919845012345" → "+91 98•••••345" */
export function maskPhone(phone: string | null | undefined): string {
  const match = (phone ?? "").match(/^\+91(\d{2})\d{5}(\d{3})$/);
  return match ? `+91 ${match[1]}•••••${match[2]}` : "•••";
}

/** "Prestige Tech Park, Tower B" → "Prestige •••" */
export function maskAddress(address: string | null | undefined): string {
  const first = (address ?? "").trim().split(/[\s,]+/)[0];
  return first ? `${first} •••` : "•••";
}

// Indian mobile numbers in any common format: +91-98450 12345, 091…, 98450-12345, 9845012345
const PHONE_IN_TEXT = /(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}\b/g;

/** Replaces phone numbers in free text (e.g. before logging a customer message). */
export function redactPII(text: string): string {
  return text.replace(PHONE_IN_TEXT, "[phone]");
}
