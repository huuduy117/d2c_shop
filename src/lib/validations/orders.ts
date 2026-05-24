import { z } from "zod";

// ── Orders ────────────────────────────────────────────────
export const createOrderSchema = z.object({
  branch_id: z.string().uuid(),
  address_id: z.string().uuid(),
  payment_method: z.enum(["vnpay", "momo", "cod"]),
  voucher_code: z.string().optional(),
  note: z.string().optional(),
  vat_invoice_requested: z.boolean().default(false),
  vat_invoice_info: z.object({
    buyer_tax_code: z.string().optional(),
    buyer_company: z.string().optional(),
  }).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.string().min(1),
  note: z.string().optional(),
});

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(1),
});

export type CreateOrder = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatus = z.infer<typeof updateOrderStatusSchema>;
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
export type CancelOrder = z.infer<typeof cancelOrderSchema>;
