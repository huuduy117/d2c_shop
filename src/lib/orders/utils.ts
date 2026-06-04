// Generate unique order code: ORD-YYYYMMDD-NNNN
export function generateOrderCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");

  return `ORD-${year}${month}${day}-${random}`;
}

// Calculate order totals
export function calculateOrderTotals(
  items: Array<{ unit_price: number; quantity: number }>,
  shippingFee: number,
  discountTotal: number,
): {
  subtotal: number;
  shipping_fee: number;
  discount_total: number;
  grand_total: number;
} {
  const subtotal = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );

  const grand_total = subtotal + shippingFee - discountTotal;

  return {
    subtotal,
    shipping_fee: shippingFee,
    discount_total: discountTotal,
    grand_total,
  };
}
