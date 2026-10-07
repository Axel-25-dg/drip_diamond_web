import { useState } from "react";
import { Star, MessageSquarePlus, ShieldCheck, Quote } from "lucide-react";
import { useReviewStore } from "@/presentation/store/reviewStore";
import { CreateReviewModal } from "./CreateReviewModal";

export function ReviewsSection() {
  const reviews = useReviewStore((s) => s.reviews);
  const getAverageRating = useReviewStore((s) => s.getAverageRating);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const avg = getAverageRating();
  const totalCount = reviews.length;

  return (
    <section className="py-20 relative overflow-hidden bg-slate-50/70 dark:bg-[#0c0e14] border-y border-blue-100/60 dark:border-[#1e2330]">
      {/* Decorative background glow */}
      <div
        className="pointer-events-none absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl"
        aria-hidden
      />

      <div className="container-app relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/40 px-3 py-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-sky-400">
                Experiencias Reales · Drip Diamond
              </span>
            </div>
            <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Lo que opinan nuestros clientes
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-500 dark:text-slate-400">
              Calificaciones auténticas de clientes que compran y coleccionan sneakers con nosotros en todo Ecuador.
            </p>
          </div>

          {/* Rating Summary + CTA */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12151c] px-4 py-2.5 shadow-xs">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {avg.toFixed(1)}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${
                        s <= Math.round(avg)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 dark:text-slate-600"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {totalCount} {totalCount === 1 ? "opinión" : "opiniones verificadas"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <MessageSquarePlus className="h-4 w-4" />
              Dar mi calificación y reseña
            </button>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {reviews.map((rev) => {
            const initials = rev.usuarioNombre
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0].toUpperCase())
              .join("");

            return (
              <div
                key={rev.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#12151c] p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  {/* Top: Avatar, Name, Verified */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {rev.usuarioAvatar ? (
                        <img
                          src={rev.usuarioAvatar}
                          alt={rev.usuarioNombre}
                          className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-xs font-black text-white shadow-xs">
                          {initials || "U"}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                          {rev.usuarioNombre}
                        </h4>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {rev.fecha}
                        </span>
                      </div>
                    </div>

                    {rev.verificado && (
                      <span
                        title="Compra verificada en Drip Diamond"
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        Verificado
                      </span>
                    )}
                  </div>

                  {/* Stars */}
                  <div className="mt-4 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((st) => (
                      <Star
                        key={st}
                        className={`h-4 w-4 ${
                          st <= rev.calificacion
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200 dark:text-slate-700"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Title & Comment */}
                  <h3 className="mt-3 font-display text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    "{rev.titulo}"
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {rev.comentario}
                  </p>
                </div>

                {/* Footer: Purchased Product Tag */}
                {rev.productoRecomendado && (
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Par adquirido:</span>
                    <span className="font-semibold text-blue-600 dark:text-sky-400 truncate max-w-[150px]">
                      {rev.productoRecomendado}
                    </span>
                  </div>
                )}

                {/* Decorative subtle quote mark */}
                <Quote
                  className="pointer-events-none absolute right-4 bottom-4 h-12 w-12 text-slate-100 dark:text-slate-800/30 -z-0 opacity-40 group-hover:opacity-80 transition-opacity"
                  aria-hidden
                />
              </div>
            );
          })}
        </div>
      </div>

      <CreateReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
