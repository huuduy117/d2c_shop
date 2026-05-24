import { z } from "zod";

// ── Cart ───────────────────────────────────────────────────
export const cartItemSchema = z.object({
  product_variant_id: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const addToCartSchema = cartItemSchema;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export const removeFromCartSchema = z.object({
  product_variant_id: z.string().uuid(),
});

export type CartItem = z.infer<typeof cartItemSchema>;
export type AddToCart = z.infer<typeof addToCartSchema>;
export type UpdateCartItem = z.infer<typeof updateCartItemSchema>;
export type RemoveFromCart = z.infer<typeof removeFromCartSchema>;
