import React, { useState } from "react";
import { Star, X, CheckCircle2, Sparkles } from "lucide-react";
import { useAuthStore } from "@/presentation/store/authStore";
import { useReviewStore } from "@/presentation/store/reviewStore";
import { toast } from "sonner";
import { resolveMediaUrl } from "@/presentation/utils/format";

interface CreateReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "Malo 😞",
  2: "Regular 😐",
  3: "Bueno 🙂",
  4: "Muy bueno 😊",
  5: "¡Excelente! 🔥",
};

export function CreateReviewModal({ isOpen, onClose }: CreateReviewModalProps) {
  const user = useAuthStore((s) => s.user);
  const addReview = useReviewStore((s) => s.addReview);

  const initialName = user ? `${user.nombre} ${user.apellido || ""}`.trim() : "";
  const [nombre, setNombre] = useState(initialName);
  const [calificacion, setCalificacion] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [comentario, setComentario] = useState("");
  const [producto, setProducto] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("Por favor ingresa tu nombre");
      return;
    }
    if (!titulo.trim()) {
      toast.error("Por favor ingresa un título para tu reseña");
      return;
    }
    if (!comentario.trim()) {
      toast.error("Por favor escribe tu opinión o reseña");
      return;
    }

    setIsSubmitting(true);
    try {
      addReview({
        usuarioNombre: nombre.trim(),
        usuarioAvatar: user?.fotoPerfilUrl ? resolveMediaUrl(user.fotoPerfilUrl) : null,
        calificacion,
        titulo: titulo.trim(),
        comentario: comentario.trim(),
        productoRecomendado: producto.trim() || undefined,
        verificado: true,
      });

      toast.success("¡Tu reseña ha sido publicada con éxito en la portada!");
      onClose();
      // Reset form
      setTitulo("");
      setComentario("");
      setProducto("");
    } catch {
      toast.error("Ocurrió un error al guardar tu reseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRating = hoverRating ?? calificacion;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12151c] p-6 sm:p-8 shadow-2xl shadow-blue-900/20 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Cerrar modal"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Dejar calificación y reseña
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tu experiencia será pública en la portada de Drip Diamond
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Star selector */}
          <div className="rounded-2xl border border-blue-100 dark:border-slate-800/80 bg-blue-50/50 dark:bg-[#171b24] p-4 text-center">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Tu puntuación
            </label>
            <div className="mt-2.5 flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setCalificacion(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  aria-label={`${star} estrellas`}
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= activeRating
                        ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                        : "text-slate-300 dark:text-slate-600"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs font-semibold text-blue-600 dark:text-sky-400">
              {RATING_LABELS[activeRating] || "Selecciona tus estrellas"}
            </p>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tu nombre completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Carlos Mendoza"
              className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171a22] px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 dark:focus:border-sky-400"
            />
          </div>

          {/* Title input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Título de tu reseña <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. ¡Llegó rapidísimo y la calidad es insuperable!"
              className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171a22] px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 dark:focus:border-sky-400"
            />
          </div>

          {/* Comment input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tu reseña / opinión detallada <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Cuéntale a la comunidad sobre la comodidad, el calce, la entrega por Servientrega o la atención recibida..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171a22] px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 dark:focus:border-sky-400 resize-none"
            />
          </div>

          {/* Sneaker model purchased (optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Modelo que compraste <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={producto}
              onChange={(e) => setProducto(e.target.value)}
              placeholder="Ej. Air Jordan 4 Retro / Dunk Low"
              className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171a22] px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 dark:focus:border-sky-400"
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? "Publicando..." : "Publicar mi reseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
