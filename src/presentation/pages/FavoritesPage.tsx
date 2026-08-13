import { Link } from "react-router-dom";
import { Heart, ShoppingBag, ArrowLeft } from "lucide-react";
import { useFavoritesStore } from "@/presentation/store/favoritesStore";
import { ProductGrid } from "@/presentation/components/catalog/ProductGrid";
import { Button } from "@/presentation/components/ui/Button";

export default function FavoritesPage() {
  const { favorites } = useFavoritesStore();

  return (
    <div className="container-app py-6 sm:py-8 lg:py-12 text-slate-900 dark:text-white">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Link
          to="/catalogo"
          className="chip chip-outline hover:border-sky-400 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Catálogo
        </Link>
      </div>

      <div className="mb-6 sm:mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Heart className="h-7 w-7 sm:h-8 sm:w-8 text-rose-500 fill-rose-500" /> Mis Favoritos
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {favorites.length === 1
              ? "1 zapatilla guardada"
              : `${favorites.length} zapatillas guardadas en tus favoritos`}
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center p-12 rounded-3xl border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4">
            <Heart className="h-8 w-8" />
          </div>
          <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">No tienes favoritos aún</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Haz clic en el corazón de cualquier zapatilla para guardarla aquí y revisarla cuando quieras.
          </p>
          <div className="mt-6">
            <Link to="/catalogo">
              <Button variant="secondary" size="lg">
                <ShoppingBag className="h-4 w-4 mr-2" /> Explora el Catálogo
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <ProductGrid products={favorites} />
      )}
    </div>
  );
}
