// Row types mirroring supabase/migrations. Keep in sync when adding a migration.

export type OrderStatus =
  | "scheduled"
  | "preparing"
  | "out_for_delivery"
  | "delayed"
  | "delivered"
  | "skipped"
  | "cancelled";

export const MESSAGE_CATEGORIES = [
  "order_status",
  "skip_day",
  "refund",
  "complaint",
  "other",
] as const;
export type MessageCategory = (typeof MESSAGE_CATEGORIES)[number];

export type Customer = {
  id: string;
  name: string;
  phone: string;
  area: string;
  office_address: string;
};

export type Subscription = {
  id: string;
  customer_id: string;
  plan: string;
  price_per_meal_paise: number;
  status: "active" | "paused" | "cancelled";
  paused_until: string | null;
};

export type Rider = { id: string; name: string; phone: string; zone: string };

export type Order = {
  id: string;
  customer_id: string;
  delivery_date: string;
  meal: string;
  quantity: number;
  amount_paise: number;
  status: OrderStatus;
  rider_id: string | null;
  eta: string | null;
  delivered_at: string | null;
};

export type DeliveryEvent = {
  id: number;
  order_id: string;
  status: string;
  note: string | null;
  landmark: string | null;
  eta: string | null;
  at: string;
};

export type Refund = {
  id: string;
  order_id: string;
  customer_id: string;
  reason: string;
  amount_paise: number;
  status: "requested" | "approved" | "paid" | "rejected";
  source: "dabbadesk" | "spreadsheet" | "whatsapp";
  notes: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  channel: "web" | "whatsapp" | "email";
  customer_id: string | null;
  order_id: string | null;
  phone: string | null;
  body: string;
  category: MessageCategory | null;
  reply: string | null;
  handled_by: "ai" | "human";
  needs_human: boolean;
  status: "open" | "auto_resolved" | "resolved";
  response_ms: number | null;
  created_at: string;
  replied_at: string | null;
};
