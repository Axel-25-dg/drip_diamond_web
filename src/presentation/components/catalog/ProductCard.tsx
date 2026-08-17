import { Link } from "react-router-dom";
import { Eye, Heart, Zap } from "lucide-react";
import type { ProductSummary } from "@/domain/entities/Product";
import { PriceTag } from "@/presentation/components/ui/PriceTag";
import { useProductImage } from "@/presentation/hooks/useProductImage";
import { useFavoritesStore } from "@/presentation/store/favoritesStore";
import { toast } from "sonner";

export function ProductCard({ product }: { product: ProductSummary }) {
  const isOffer = product.precioOferta != null && product.precioOferta < product.precioBase;
  const isSoldOut =
    product.estado === "agotado" &&
    (!product.tallasDisponibles || product.tallasDisponibles.length === 0);

  // Resolves image from summary first; falls back to fetching the detail endpoint
  const img = useProductImage(product.id, product.imagenPrincipal);

  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const favorited = isFavorite(product.id);

    const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleFavorite(product);
    if (added) {
      toast.success(`"${product.nombre}" agregada a favoritos`);
    } else {
      toast.info(`"${product.nombre}" eliminada de favoritos`);
    }
  };

  return (
    <Link
      to={`/producto/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-[24px] border border-blue-100/80 bg-white shadow-sm dark:border-[#222732] dark:bg-[#12151c] transition-all duration-300 hover:-translate-y-1 hover:border-sky-300/70 dark:hover:border-sky-500/50"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_100%)] dark:bg-[#171a22]">
        {img ? (
          <img
            src={img}
            alt={product.nombre}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.08]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center dot-pattern">
            <span className="font-display text-4xl font-black tracking-tighter text-blue-100 dark:text-slate-800">
              DD
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {isOffer && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-sky-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              <Zap className="h-3 w-3" />
              Oferta
            </span>
          )}
          {isSoldOut && (
            <span className="inline-flex rounded-lg bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
              Agotado
            </span>
          )}
        </div>

        {/* Hover overlay actions */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/95 dark:bg-[#12151c]/95 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white shadow-md">
            <Eye className="h-3.5 w-3.5" />
            Ver producto
          </div>
          <button
            onClick={handleFavoriteClick}
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/95 dark:bg-[#12151c]/95 shadow-md transition-colors ${
              favorited ? "text-sky-600 dark:text-sky-400" : "text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400"
            }`}
            aria-label="Favorito"
          >
            <Heart
              className={`h-3.5 w-3.5 ${favorited ? "fill-sky-600 text-sky-600 dark:fill-sky-400 dark:text-sky-400" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-sky-400">
          {product.marca}
        </span>
        <h3 className="line-clamp-2 font-display text-sm font-bold leading-snug text-slate-900 dark:text-white">
          {product.nombre}
        </h3>

        {product.tallasDisponibles && product.tallasDisponibles.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {product.tallasDisponibles.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-md border border-blue-100 dark:border-[#222732] bg-sky-50 dark:bg-[#171a22] px-1.5 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300"
              >
                {t}
              </span>
            ))}
            {product.tallasDisponibles.length > 4 && (
              <span className="rounded-md border border-slate-200 dark:border-[#222732] bg-slate-50 dark:bg-[#171a22] px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                +{product.tallasDisponibles.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <PriceTag base={product.precioBase} offer={product.precioOferta} />
        </div>
      </div>
    </Link>
  );
}
