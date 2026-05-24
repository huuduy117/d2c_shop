import { z } from "zod";

// ── Reviews ────────────────────────────────────────────────
export const createReviewSchema = z.object({
  product_id: z.string().uuid(),
  order_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  content: z.string().optional(),
  image_urls: z.array(z.string().url()).optional(),
});

export const reviewListQuerySchema = z.object({
  product_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["newest", "highest_rating", "lowest_rating"]).default("newest"),
});

export type CreateReview = z.infer<typeof createReviewSchema>;
export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>;
