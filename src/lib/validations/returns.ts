import { z } from "zod";

// ── Returns ────────────────────────────────────────────────
export const createReturnSchema = z.object({
  order_id: z.string().uuid(),
  reason: z.string().min(1).max(500),
  evidence_urls: z.array(z.string().url()).optional(),
  refund_method: z.enum(["original_payment", "bank_transfer", "store_credit"]).optional(),
  bank_account_name: z.string().optional(),
  bank_account_no: z.string().optional(),
  bank_name: z.string().optional(),
});

export const updateReturnStatusSchema = z.object({
  status: z.enum(["pending", "under_review", "approved", "rejected", "processing_refund", "refunded"]),
  admin_note: z.string().optional(),
  refund_amount: z.number().int().nonnegative().optional(),
  transfer_proof_url: z.string().url().optional(),
});

export const returnListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
});

export type CreateReturn = z.infer<typeof createReturnSchema>;
export type UpdateReturnStatus = z.infer<typeof updateReturnStatusSchema>;
export type ReturnListQuery = z.infer<typeof returnListQuerySchema>;
