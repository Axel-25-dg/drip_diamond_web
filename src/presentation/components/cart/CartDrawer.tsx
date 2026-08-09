import { useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Trash2, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCartStore } from "@/presentation/store/cartStore";
import { formatCurrency, resolveMediaUrl } from "@/presentation/utils/format";
import { Button } from "@/presentation/components/ui/Button";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { toast } from "sonner";

export function CartDrawer() {
  const { cart, isDrawerOpen, closeDrawer, removeItem, fetchCart, isLoading } = useCartStore();

  useEffect(() => {
    if (isDrawerOpen && !cart) fetchCart().catch(() => {});
  }, [isDrawerOpen]);

  const handleRemove = async (itemId: number) => {
    try {
      await removeItem(itemId);
    } catch (err: any) {
      toast.error(err?.message || "No se pudo quitar el producto del carrito.");
    }
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-50 bg-ink/50"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-paper shadow-2xl"
          >
            <div className="flex items-center justify-between border-b-2 border-ink/10 px-5 py-4">
              <h3 className="font-display text-xl">Tu carrito</h3>
              <button onClick={closeDrawer} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {isLoading && <Spinner full />}

              {!isLoading && (!cart || cart.items.length === 0) && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-ink/50">
                  <ShoppingBag className="h-10 w-10" />
                  <p className="text-sm">Tu carrito está vacío.</p>
                </div>
              )}

              <ul className="flex flex-col gap-4">
                {cart?.items.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-black/5">
                      {resolveMediaUrl(item.imagenUrl) ? (
                        <img
                          src={resolveMediaUrl(item.imagenUrl)!}
                          alt={item.nombre}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-display text-base font-black text-slate-400">
                          DD
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-xs font-semibold uppercase text-ink/50">{item.marca}</span>
                      <span className="text-sm font-semibold leading-snug">{item.nombre}</span>
                      <span className="mt-1 text-xs text-ink/60">
                        Talla {item.talla} · {item.color} · x{item.cantidad}
                      </span>
                      <div className="mt-auto flex items-center justify-between pt-1">
                        <span className="text-sm font-bold">{formatCurrency(item.precioUnitario * item.cantidad)}</span>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="text-ink/40 hover:text-danger"
                          aria-label="Quitar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {cart && cart.items.length > 0 && (
              <div className="border-t-2 border-ink/10 px-5 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink/60">Subtotal</span>
                  <span className="text-lg font-bold">{formatCurrency(cart.subtotal)}</span>
                </div>
                <Link to="/carrito" onClick={closeDrawer}>
                  <Button variant="outline" fullWidth size="lg" className="mb-2">
                    Ver carrito
                  </Button>
                </Link>
                <Link to="/checkout" onClick={closeDrawer}>
                  <Button variant="secondary" fullWidth size="lg">
                    Ir a pagar
                  </Button>
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
