import { create } from "zustand";
import type { Cart } from "@/domain/entities/Order";
import { useCases } from "@/infrastructure/factories/useCases.factory";

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  isDrawerOpen: boolean;
  fetchCart: () => Promise<void>;
  addItem: (varianteId: number, cantidad: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  openDrawer: () => void;
  closeDrawer: () => void;
  reset: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  isDrawerOpen: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const cart = await useCases.getCart.execute();
      set({ cart });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (varianteId, cantidad) => {
    const cart = await useCases.addCartItem.execute(varianteId, cantidad);
    set({ cart, isDrawerOpen: true });
  },

  removeItem: async (itemId) => {
    const cart = await useCases.removeCartItem.execute(itemId);
    set({ cart });
  },

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  reset: () => set({ cart: null }),
}));
