import { Badge } from "@/components/ui";
import type { MessageCategory, OrderStatus } from "@/lib/types";

const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Parameters<typeof Badge>[0]["tone"] }> = {
  scheduled: { label: "Scheduled", tone: "neutral" },
  preparing: { label: "Preparing", tone: "sky" },
  out_for_delivery: { label: "On the way", tone: "brand" },
  delayed: { label: "Delayed", tone: "warn" },
  delivered: { label: "Delivered", tone: "leaf" },
  skipped: { label: "Skipped", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, tone } = ORDER_STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const CATEGORY_LABEL: Record<MessageCategory, string> = {
  order_status: "Order status",
  skip_day: "Skip day",
  refund: "Refund",
  complaint: "Complaint",
  other: "Other",
};

export function CategoryBadge({ category }: { category: MessageCategory | null }) {
  if (!category) return <Badge>Unverified</Badge>;
  const tone = category === "refund" || category === "complaint" ? "warn" : "sky";
  return <Badge tone={tone}>{CATEGORY_LABEL[category]}</Badge>;
}
