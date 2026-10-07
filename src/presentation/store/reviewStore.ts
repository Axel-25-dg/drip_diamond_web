import { create } from "zustand";

export interface Review {
  id: string;
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
  addReview: (review: Omit<Review, "id" | "fecha" | "verificado"> & { verificado?: boolean }) => void;
  getAverageRating: () => number;
  getTotalCount: () => number;
}

const STORAGE_KEY = "drip_customer_reviews";

const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev-1",
    usuarioNombre: "Mateo Carrión",
    usuarioAvatar: null,
    calificacion: 5,
    titulo: "100% Originales y entrega puntual en Quito",
    comentario: "Excelente servicio. Pedí unas Jordan 1 High y llegaron el sábado por Servientrega impecables con caja doble y todo verificado. Totalmente recomendados.",
    fecha: "Hace 2 días",
    productoRecomendado: "Air Jordan 1 High OG",
    verificado: true,
  },
  {
    id: "rev-2",
    usuarioNombre: "Camila Viteri",
    usuarioAvatar: null,
    calificacion: 5,
    titulo: "La mejor tienda de sneakers de Ecuador",
    comentario: "Tenía dudas por la talla pero la atención al cliente me asesoró de maravilla. El calce es perfecto y el drip es insuperable. Volveré a comprar.",
    fecha: "Hace 5 días",
    productoRecomendado: "Nike Dunk Low Retro",
    verificado: true,
  },
  {
    id: "rev-3",
    usuarioNombre: "David Romero",
    usuarioAvatar: null,
    calificacion: 5,
    titulo: "Calidad premium garantizada",
    comentario: "Compré dos pares para aprovechar el envío gratis. La calidad de los acabados es brutal. El mapa en el checkout para entrega exacta en Quito facilita todo.",
    fecha: "Hace 1 semana",
    productoRecomendado: "Jordan 4 Retro Military Black",
    verificado: true,
  },
  {
    id: "rev-4",
    usuarioNombre: "Valeria Gómez",
    usuarioAvatar: null,
    calificacion: 5,
    titulo: "Envío súper rápido y seguro",
    comentario: "Súper confiable. El seguimiento del pedido y la notificación cuando salió con el repartidor estuvo genial. Muy buena experiencia de compra.",
    fecha: "Hace 2 semanas",
    productoRecomendado: "Puma Suede Classic",
    verificado: true,
  },
];

function loadStoredReviews(): Review[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_REVIEWS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fallback
  }
  return INITIAL_REVIEWS;
}

function saveReviews(reviews: Review[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    // ignore
  }
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: loadStoredReviews(),

  addReview: (data) => {
    const newReview: Review = {
      ...data,
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fecha: "Reciente",
      verificado: data.verificado ?? true,
    };
    const updated = [newReview, ...get().reviews];
    saveReviews(updated);
    set({ reviews: updated });
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
