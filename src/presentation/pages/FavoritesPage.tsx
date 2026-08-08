import { Link } from "react-router-dom";
import { Heart, ShoppingBag, ArrowLeft } from "lucide-react";
import { useFavoritesStore } from "@/presentation/store/favoritesStore";
import { ProductGrid } from "@/presentation/components/catalog/ProductGrid";
import { Button } from "@/presentation/components/ui/Button";

export default function FavoritesPage() {
  const { favorites } = useFavoritesStore();

  return (
    <div className="container-app py-8 lg:py-12">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Link
          to="/catalogo"
          className="chip hover:border-[color:var(--card-border-hover)] transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Catálogo
        </Link>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl flex items-center gap-3">
            <Heart className="h-8 w-8 text-rose-500 fill-rose-500" /> Mis Favoritos
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {favorites.length === 1
              ? "1 zapatilla guardada"
              : `${favorites.length} zapatillas guardadas en tus favoritos`}
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center p-12 rounded-3xl border border-theme bg-surf">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4">
            <Heart className="h-8 w-8" />
          </div>
          <h3 className="font-display text-2xl text-primary">No tienes favoritos aún</h3>
          <p className="mt-2 text-sm text-secondary max-w-md">
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
