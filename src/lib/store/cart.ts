import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  product_variant_id: string;
  quantity: number;
  product_name: string;
  sku: string;
  price: number;
  image_url?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (product_variant_id: string) => void;
  updateQuantity: (product_variant_id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: CartItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.product_variant_id === item.product_variant_id,
          );

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_variant_id === item.product_variant_id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }

          return { items: [...state.items, item] };
        });
      },

      removeItem: (product_variant_id: string) => {
        set((state) => ({
          items: state.items.filter(
            (i) => i.product_variant_id !== product_variant_id,
          ),
        }));
      },

      updateQuantity: (product_variant_id: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(product_variant_id);
          return;
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.product_variant_id === product_variant_id
              ? { ...i, quantity }
              : i,
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: "cart-storage",
    },
  ),
);
