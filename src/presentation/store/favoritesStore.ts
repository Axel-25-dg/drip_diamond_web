import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductSummary } from "@/domain/entities/Product";

interface FavoritesState {
  favorites: ProductSummary[];
  toggleFavorite: (product: ProductSummary) => boolean;
  isFavorite: (productId: number) => boolean;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      toggleFavorite: (product) => {
        const current = get().favorites;
        const exists = current.some((p) => p.id === product.id);
        if (exists) {
          set({ favorites: current.filter((p) => p.id !== product.id) });
          return false;
        } else {
          set({ favorites: [...current, product] });
          return true;
        }
      },

      isFavorite: (productId) => {
        return get().favorites.some((p) => p.id === productId);
      },

      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: "drip-diamond-favorites",
    }
  )
);
