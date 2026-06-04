// Order State Machine — theo implementation plan Section 5
//
// PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → RETURN_REQUESTED
//
// CANCELLED path:
//   PENDING   → CANCELLED  (buyer self-cancel hoặc payment timeout)
//   CONFIRMED → CANCELLED  (admin cancel hoặc buyer request trước PROCESSING)
//   PROCESSING+ không thể cancel thường — cần return flow

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "RETURN_REQUESTED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Allowed transitions: from → to[]
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: [],
  CANCELLED: [],
};

export function isValidTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAllowedTransitions(status: OrderStatus): OrderStatus[] {
  return TRANSITIONS[status] ?? [];
}

// Can a buyer cancel this order?
export function canBuyerCancel(status: OrderStatus): boolean {
  return status === "PENDING" || status === "CONFIRMED";
}

// Inventory action required per transition
export type InventoryAction =
  | "reserve"          // checkout: reserve stock
  | "commit"           // confirmed: deduct stock, release reserved
  | "release_reserved" // cancelled before confirmed: release reserved
  | "restore_stock"    // cancelled after confirmed: restore stock
  | "none";

export function getInventoryAction(
  from: OrderStatus | null,
  to: OrderStatus,
): InventoryAction {
  if (to === "PENDING") return "reserve";
  if (from === "PENDING" && to === "CONFIRMED") return "commit";
  if (from === "PENDING" && to === "CANCELLED") return "release_reserved";
  if (from === "CONFIRMED" && to === "CANCELLED") return "restore_stock";
  return "none";
}
