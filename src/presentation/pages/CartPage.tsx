import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/presentation/store/cartStore";
import { Button } from "@/presentation/components/ui/Button";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { EmptyState } from "@/presentation/components/ui/EmptyState";
import { formatCurrency, resolveMediaUrl } from "@/presentation/utils/format";

export default function CartPage() {
  const { cart, isLoading, fetchCart, removeItem } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart().catch(() => toast.error("No se pudo cargar tu carrito."));
  }, []);

  const handleRemove = async (itemId: number) => {
    try {
      await removeItem(itemId);
    } catch {
      toast.error("No se pudo quitar el producto.");
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
    <div className="container-app py-8 lg:py-12">
      <h1 className="font-display text-4xl">Tu carrito</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="flex flex-col divide-y-2 divide-ink/5">
          {cart.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-5">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-black/5 sm:h-28 sm:w-28">
                {resolveMediaUrl(item.imagenUrl) && (
                  <img src={resolveMediaUrl(item.imagenUrl)!} alt={item.nombre} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase text-ink/50">{item.marca}</span>
                    <h3 className="font-semibold leading-snug">{item.nombre}</h3>
                    <p className="mt-1 text-sm text-ink/60">
                      Talla {item.talla} · {item.color}
                    </p>
                  </div>
                  <button onClick={() => handleRemove(item.id)} className="text-ink/40 hover:text-danger" aria-label="Quitar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="text-sm text-ink/60">Cantidad: {item.cantidad}</span>
                  <span className="font-bold">{formatCurrency(item.precioUnitario * item.cantidad)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl bg-white p-6">
          <h3 className="font-display text-xl">Resumen</h3>
          <div className="mt-4 flex items-center justify-between text-sm text-ink/60">
            <span>Subtotal ({cart.totalItems} artículos)</span>
            <span className="font-semibold text-ink">{formatCurrency(cart.subtotal)}</span>
          </div>
          <p className="mt-2 text-xs text-ink/40">El costo de envío se calcula en el checkout según tu zona.</p>
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
