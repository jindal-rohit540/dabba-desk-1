// Pure cleaning functions for the business's messy CSV exports. Used by scripts/seed.ts.
import type { OrderStatus } from "@/lib/types";

export type Reject = { line: number; reason: string; raw: Record<string, string> };

/** "98450 12345", "+91-9845012345", "09845012345", "91 9845012345" → "+919845012345" */
export function normalizePhone(raw: string | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return `+91${digits}`;
}

/** "  harsha iyer " → "Harsha Iyer", "ANANYA  RAO" → "Ananya Rao" */
export function normalizeName(raw: string | undefined): string | null {
  const cleaned = (raw ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return null;
  return cleaned
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** "2026-10-21", "21/10/2026", "21-Oct-2026" → "2026-10-21". Invalid dates → null. */
export function parseDate(raw: string | undefined): string | null {
  const s = (raw ?? "").trim();
  let y: number, m: number, d: number;
  let match: RegExpMatchArray | null;
  if ((match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else if ((match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) {
    [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else if ((match = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/))) {
    const month = MONTHS[match[2].toLowerCase()];
    if (!month) return null;
    [d, m, y] = [Number(match[1]), month, Number(match[3])];
  } else {
    return null;
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null; // e.g. 32/10/2026
  }
  return date.toISOString().slice(0, 10);
}

/** "₹220", "Rs. 220.00", "Rs 90", "220" → 22000 paise. Negative or garbage → null. */
export function parseAmountToPaise(raw: string | undefined): number | null {
  const s = (raw ?? "").replace(/₹|rs\.?|inr|,/gi, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

const STATUS_ALIASES: Record<string, OrderStatus> = {
  scheduled: "scheduled",
  preparing: "preparing",
  out_for_delivery: "out_for_delivery",
  "out for delivery": "out_for_delivery",
  delayed: "delayed",
  delivered: "delivered",
  skipped: "skipped",
  cancelled: "cancelled",
  canceled: "cancelled",
};

export function normalizeStatus(raw: string | undefined): OrderStatus | null {
  return STATUS_ALIASES[(raw ?? "").trim().toLowerCase()] ?? null;
}

/** "dx10303", "DX 10303", "DX-10303" → "DX-10303" */
export function normalizeOrderId(raw: string | undefined): string | null {
  const match = (raw ?? "").trim().match(/^dx[\s-]?(\d+)$/i);
  return match ? `DX-${match[1]}` : null;
}

/** "2026-10-21 13:09" (IST wall clock) → ISO timestamp with +05:30 */
export function parseIstTimestamp(raw: string | undefined): string | null {
  const match = (raw ?? "").trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})$/);
  if (!match) return null;
  return `${match[1]}T${match[2]}:${match[3]}:00+05:30`;
}

export type CleanOrderRow = {
  id: string;
  customer_name: string;
  phone: string;
  area: string;
  office_address: string;
  plan: string;
  meal: string;
  quantity: number;
  amount_paise: number;
  delivery_date: string;
  status: OrderStatus;
  rider_id: string | null;
  eta: string | null;
};

export function cleanOrders(rows: Record<string, string>[]) {
  const orders: CleanOrderRow[] = [];
  const rejects: Reject[] = [];
  const seen = new Set<string>();
  let duplicates = 0;

  rows.forEach((raw, i) => {
    const line = i + 2; // +1 for header, +1 for 1-based lines
    const id = normalizeOrderId(raw.order_id);
    const phone = normalizePhone(raw.phone);
    const name = normalizeName(raw.customer_name);
    const date = parseDate(raw.delivery_date);
    const amount = parseAmountToPaise(raw.amount_inr);
    const status = normalizeStatus(raw.status);
    const quantity = Number(raw.quantity);

    const problems = [
      !id && "invalid order_id",
      !phone && `invalid phone "${raw.phone}"`,
      !name && "missing name",
      !date && `invalid date "${raw.delivery_date}"`,
      amount === null && `invalid amount "${raw.amount_inr}"`,
      !status && `unknown status "${raw.status}"`,
      !(Number.isInteger(quantity) && quantity > 0) && `invalid quantity "${raw.quantity}"`,
    ].filter(Boolean) as string[];

    if (problems.length) {
      rejects.push({ line, reason: problems.join("; "), raw });
      return;
    }
    if (seen.has(id!)) {
      duplicates++;
      return;
    }
    seen.add(id!);
    orders.push({
      id: id!,
      customer_name: name!,
      phone: phone!,
      area: raw.area.trim(),
      office_address: raw.office_address.trim(),
      plan: raw.plan.trim(),
      meal: raw.meal.trim(),
      quantity,
      amount_paise: amount!,
      delivery_date: date!,
      status: status!,
      rider_id: raw.rider_id?.trim() || null,
      eta: parseIstTimestamp(raw.eta),
    });
  });

  return { orders, rejects, duplicates };
}

export type CleanRefundRow = {
  order_id: string;
  reason: string;
  amount_paise: number;
  status: "requested" | "approved" | "paid";
  notes: string | null;
};

const REFUND_STATUS: Record<string, CleanRefundRow["status"]> = {
  done: "paid",
  paid: "paid",
  approved: "approved",
  pending: "requested",
  "": "requested",
};

export function cleanRefunds(rows: Record<string, string>[], knownOrderIds: Set<string>) {
  const refunds: CleanRefundRow[] = [];
  const rejects: Reject[] = [];

  rows.forEach((raw, i) => {
    const line = i + 2;
    const orderId = normalizeOrderId(raw["Order No"]);
    const amount = parseAmountToPaise(raw["Refund Amt"]);
    const status = REFUND_STATUS[(raw["Status"] ?? "").trim().toLowerCase()];
    const problems = [
      !orderId && `invalid order no "${raw["Order No"]}"`,
      orderId && !knownOrderIds.has(orderId) && `unknown order ${orderId}`,
      amount === null && `missing/invalid amount "${raw["Refund Amt"]}"`,
      !status && `unknown status "${raw["Status"]}"`,
    ].filter(Boolean) as string[];
    if (problems.length) {
      rejects.push({ line, reason: problems.join("; "), raw });
      return;
    }
    refunds.push({
      order_id: orderId!,
      reason: (raw["Reason"] ?? "").trim() || "not specified",
      amount_paise: amount!,
      status,
      notes: (raw["Notes"] ?? "").trim() || null,
    });
  });

  return { refunds, rejects };
}

/** Shift a YYYY-MM-DD date or ISO timestamp by whole days (used to move demo data to "today"). */
export function shiftDays<T extends string | null>(value: T, days: number): T {
  if (!value || days === 0) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10) as T;
  }
  // Keep the original UTC offset text (e.g. +05:30) so wall-clock times stay readable.
  const match = value.match(/^(\d{4}-\d{2}-\d{2})(T.*)$/);
  if (!match) return value;
  return (shiftDays(match[1], days) + match[2]) as T;
}
