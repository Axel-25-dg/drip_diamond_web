import { create } from "zustand";
import { httpClient } from "@/infrastructure/http/httpClient";

export interface Review {
  id: string | number;
  usuarioNombre: string;
  usuarioAvatar?: string | null;
  calificacion: number; // 1 to 5
  titulo: string;
  comentario: string;
  fecha: string;
  productoRecomendado?: string;
  verificado: boolean;
}

interface ReviewState {
  reviews: Review[];
  isLoading: boolean;
  fetchReviews: () => Promise<void>;
  addReview: (data: any) => Promise<void>;
  getAverageRating: () => number;
  getTotalCount: () => number;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  isLoading: false,

  fetchReviews: async () => {
    set({ isLoading: true });
    try {
      const { data } = await httpClient.get<any>("/calificaciones/");
      const raw = data?.data ?? data;
      const items = Array.isArray(raw) ? raw : raw?.results || [];
      const formatted = items.map((r: any) => ({
        id: r.id,
        usuarioNombre: r.usuario_nombre || r.usuario?.nombre || "Cliente Drip",
        usuarioAvatar: r.usuario_avatar || null,
        calificacion: Number(r.calificacion),
        titulo: r.titulo || "",
        comentario: r.comentario || "",
        fecha: new Date(r.fecha || r.creado_en).toLocaleDateString(),
        productoRecomendado: r.producto_recomendado || null,
        verificado: Boolean(r.verificado ?? true),
      }));
      set({ reviews: formatted });
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  addReview: async (data) => {
    try {
      const body = {
        producto: data.productoId || null,
        calificacion: data.calificacion,
        titulo: data.titulo,
        comentario: data.comentario
      };
      await httpClient.post("/calificaciones/", body);
      await get().fetchReviews();
    } catch (err) {
      console.error("Error posting review:", err);
      throw err;
    }
  },

  getAverageRating: () => {
    const { reviews } = get();
    if (reviews.length === 0) return 5;
    const sum = reviews.reduce((acc, r) => acc + r.calificacion, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  },

  getTotalCount: () => {
    return get().reviews.length;
  },
}));
