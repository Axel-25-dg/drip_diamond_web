import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Trash2, ArrowRight, ShoppingBag, Sparkles, Truck } from "lucide-react";
import { useCartStore } from "@/presentation/store/cartStore";
import { usePromotions } from "@/presentation/hooks/usePromotions";
import { Button } from "@/presentation/components/ui/Button";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { EmptyState } from "@/presentation/components/ui/EmptyState";
import { formatCurrency, resolveMediaUrl } from "@/presentation/utils/format";

export default function CartPage() {
  const { cart, isLoading, fetchCart, removeItem } = useCartStore();
  const { isFreeShippingPromoActive, minParesForFreeShipping } = usePromotions();
  const navigate = useNavigate();

  useEffect(() => {
    // Always re-fetch when entering the cart page to get the latest state
    fetchCart().catch((err: any) =>
      toast.error(err?.message || "No se pudo cargar tu carrito.")
    );
  }, []);

  const handleRemove = async (itemId: number) => {
    try {
      await removeItem(itemId);
    } catch (err: any) {
      toast.error(err?.message || "No se pudo quitar el producto.");
    }
  };

  if (isLoading && !cart) return <Spinner full />;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon={<ShoppingBag className="h-12 w-12" />}
          title="Tu carrito está vacío"
          description="Explora el catálogo y encuentra tu próximo par."
          action={
            <Link to="/catalogo">
              <Button variant="secondary" size="lg">
                Ir al catálogo
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-app py-6 sm:py-8 lg:py-12 text-slate-900 dark:text-white">
      <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Tu carrito</h1>

      <div className="mt-6 sm:mt-8 grid gap-6 lg:gap-10 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
        <ul className="flex flex-col divide-y divide-slate-200 dark:divide-[#222732]">
          {cart.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-5">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 sm:h-28 sm:w-28">
                {resolveMediaUrl(item.imagenUrl) ? (
                  <img src={resolveMediaUrl(item.imagenUrl)!} alt={item.nombre} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-xl font-black text-slate-400 dark:text-slate-500">
                    DD
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase text-sky-600 dark:text-sky-400">{item.marca}</span>
                    <h3 className="font-semibold leading-snug text-slate-900 dark:text-white">{item.nombre}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Talla {item.talla} · {item.color}
                    </p>
                  </div>
                  <button onClick={() => handleRemove(item.id)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400" aria-label="Quitar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Cantidad: {item.cantidad}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.precioUnitario * item.cantidad)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl bg-white dark:bg-[#12151c] text-slate-900 dark:text-white p-6 border border-slate-100 dark:border-[#222732] shadow-sm">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Resumen</h3>
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>Subtotal ({cart.totalItems} artículos)</span>
            <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(cart.subtotal)}</span>
          </div>

          {isFreeShippingPromoActive && (
            cart.totalItems >= minParesForFreeShipping ? (
              <div className="mt-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-emerald-500" />
                <span><strong>¡Envío GRATIS activado!</strong> Calificas por llevar {minParesForFreeShipping} o más pares de zapatillas.</span>
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-blue-50 dark:bg-sky-950/30 border border-blue-200 dark:border-sky-900/50 p-3 text-xs text-blue-800 dark:text-sky-300 flex items-center gap-2">
                <Truck className="h-4 w-4 shrink-0 text-blue-500" />
                <span><strong>¡Agrega {minParesForFreeShipping - cart.totalItems} par{minParesForFreeShipping - cart.totalItems > 1 ? "es" : ""} más para ENVÍO GRATIS!</strong> Promo especial.</span>
              </div>
            )
          )}

          <Button size="lg" variant="secondary" fullWidth className="mt-6" onClick={() => navigate("/checkout")}>
            Continuar al pago <ArrowRight className="h-4 w-4" />
          </Button>
          <Link to="/catalogo">
            <Button size="lg" variant="ghost" fullWidth className="mt-2">
              Seguir comprando
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
