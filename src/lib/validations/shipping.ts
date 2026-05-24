import { z } from "zod";

// ── Shipping ───────────────────────────────────────────────
export const estimateShippingSchema = z.object({
  to_district_id: z.number().int().positive(),
  to_ward_code: z.string(),
  weight: z.number().int().positive(),
  insurance_value: z.number().int().nonnegative().optional(),
});

export const nearestBranchSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type EstimateShipping = z.infer<typeof estimateShippingSchema>;
export type NearestBranch = z.infer<typeof nearestBranchSchema>;
