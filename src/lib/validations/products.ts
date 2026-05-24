import { z } from "zod";

// ── Products ───────────────────────────────────────────────
export const productListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().nullish().default(null),
  category_id: z.string().uuid().nullish().default(null),
  sort: z.enum(["newest", "price_asc", "price_desc", "popular"]).default("newest"),
});

export const productDetailSchema = z.object({
  slug: z.string().min(1),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  base_price: z.number().int().positive(),
  category_id: z.string().uuid().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type ProductDetail = z.infer<typeof productDetailSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
