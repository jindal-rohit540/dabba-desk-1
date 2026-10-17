import type { VerifiedCustomer } from "@/lib/data/orders";
import type { Order } from "@/lib/types";

export const order = (over: Partial<Order> = {}): Order => ({
  id: "DX-10541",
  customer_id: "c-1",
  delivery_date: "2026-10-21",
  meal: "Rajma Chawal",
  quantity: 1,
  amount_paise: 11000,
  status: "out_for_delivery",
  rider_id: "R-07",
  eta: "2026-10-21T13:22:00+05:30",
  delivered_at: null,
  ...over,
});

export const verifiedCustomer = (over: Partial<VerifiedCustomer> = {}): VerifiedCustomer => ({
  customer: {
    id: "c-1",
    name: "Vivaan Khan",
    phone: "+916838637940",
    area: "Bellandur",
    office_address: "RMZ Ecospace, Bldg 4",
  },
  subscription: {
    id: "s-1",
    customer_id: "c-1",
    plan: "Veg Basic",
    price_per_meal_paise: 11000,
    status: "active",
    paused_until: null,
  },
  referenced: order(),
  today: {
    ...order(),
    rider: { id: "R-07", name: "Prakash N", phone: "+919000000007", zone: "Bellandur" },
    events: [
      {
        id: 1,
        order_id: "DX-10541",
        status: "out_for_delivery",
        note: null,
        landmark: "Sony World Signal",
        eta: "2026-10-21T13:22:00+05:30",
        at: "2026-10-21T12:58:00+05:30",
      },
    ],
  },
  tomorrow: order({
    id: "DX-10601",
    delivery_date: "2026-10-22",
    status: "scheduled",
    meal: "Dal Tadka + 3 Roti",
    eta: null,
  }),
  ...over,
});
