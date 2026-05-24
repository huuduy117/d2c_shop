import { z } from "zod";

// ── Vouchers ───────────────────────────────────────────────
export const validateVoucherSchema = z.object({
  code: z.string().min(1).max(50),
  subtotal: z.number().int().nonnegative(),
});

export const createVoucherSchema = z.object({
  code: z.string().min(1).max(50),
  discount_type: z.enum(["percent", "fixed"]),
  value: z.number().int().positive(),
  max_discount: z.number().int().nonnegative().optional(),
  min_order: z.number().int().nonnegative().default(0),
  usage_limit: z.number().int().positive().optional(),
  per_user_limit: z.number().int().positive().default(1),
  starts_at: z.string().datetime().optional(),
  expires_at: z.string().datetime().optional(),
});

export type ValidateVoucher = z.infer<typeof validateVoucherSchema>;
export type CreateVoucher = z.infer<typeof createVoucherSchema>;
