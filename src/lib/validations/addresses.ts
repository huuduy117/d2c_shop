import { z } from "zod";

// ── Addresses ──────────────────────────────────────────────
export const createAddressSchema = z.object({
  label: z.string().optional(),
  full_name: z.string().min(1).max(255),
  phone: z.string().min(9).max(15),
  street: z.string().min(1).max(255),
  ward: z.string().optional(),
  district: z.string().min(1).max(255),
  city: z.string().min(1).max(255),
  is_default: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export const addressListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateAddress = z.infer<typeof createAddressSchema>;
export type UpdateAddress = z.infer<typeof updateAddressSchema>;
export type AddressList = z.infer<typeof addressListSchema>;
