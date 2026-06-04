import {
  getVoucherByCode,
  getUserVoucherUsage,
} from "@/lib/db/queries";

interface VoucherValidationResult {
  valid: boolean;
  discount: number;
  error?: string;
}

export async function validateVoucher(
  code: string,
  userId: string,
  subtotal: number,
): Promise<VoucherValidationResult> {
  // Get voucher
  const voucher = await getVoucherByCode(code);
  if (!voucher) {
    return { valid: false, discount: 0, error: "Mã giảm giá không tồn tại" };
  }

  // Check if active
  if (!voucher.is_active) {
    return { valid: false, discount: 0, error: "Mã giảm giá đã hết hiệu lực" };
  }

  // Check time range
  const now = new Date();
  if (voucher.starts_at && new Date(voucher.starts_at) > now) {
    return { valid: false, discount: 0, error: "Mã giảm giá chưa có hiệu lực" };
  }
  if (voucher.expires_at && new Date(voucher.expires_at) < now) {
    return { valid: false, discount: 0, error: "Mã giảm giá đã hết hạn" };
  }

  // Check minimum order value
  if (subtotal < (voucher.min_order || 0)) {
    return {
      valid: false,
      discount: 0,
      error: `Đơn hàng tối thiểu ${voucher.min_order} VND`,
    };
  }

  // Check global usage limit
  if (
    voucher.usage_limit !== null &&
    voucher.used_count !== null &&
    voucher.used_count >= voucher.usage_limit
  ) {
    return { valid: false, discount: 0, error: "Mã giảm giá đã hết lượt sử dụng" };
  }

  // Check per-user usage limit
  const userUsage = await getUserVoucherUsage(userId, voucher.id);
  if (userUsage.length >= (voucher.per_user_limit || 1)) {
    return {
      valid: false,
      discount: 0,
      error: "Bạn đã sử dụng hết lượt cho mã này",
    };
  }

  // Calculate discount
  let discount = 0;
  if (voucher.discount_type === "fixed") {
    discount = voucher.value;
  } else if (voucher.discount_type === "percent") {
    discount = Math.floor((subtotal * voucher.value) / 100);
    if (voucher.max_discount) {
      discount = Math.min(discount, voucher.max_discount);
    }
  }

  return { valid: true, discount };
}
