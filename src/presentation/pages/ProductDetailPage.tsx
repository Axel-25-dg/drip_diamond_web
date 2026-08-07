import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Product } from "@/domain/entities/Product";
import { PriceTag } from "@/presentation/components/ui/PriceTag";
import { Button } from "@/presentation/components/ui/Button";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useCartStore } from "@/presentation/store/cartStore";
import { useAuthStore } from "@/presentation/store/authStore";
import { resolveMediaUrl } from "@/presentation/utils/format";
import { cn } from "@/presentation/utils/cn";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    useCases.getProductDetail
      .execute(Number(id))
      .then((p) => {
        setProduct(p);
        const main = resolveMediaUrl(p.imagenPrincipal) ?? resolveMediaUrl(p.galeria[0]?.url);
        setActiveImage(main);
      })
      .catch(() => toast.error("No pudimos cargar este producto."))
      .finally(() => setIsLoading(false));
  }, [id]);

  const availableSizes = useMemo(() => {
    if (!product) return [];
    return Array.from(new Set(product.variantes.map((v) => v.talla)));
  }, [product]);

  const availableColors = useMemo(() => {
    if (!product || !selectedSize) return [];
    return Array.from(new Set(product.variantes.filter((v) => v.talla === selectedSize).map((v) => v.color)));
  }, [product, selectedSize]);

  const selectedVariant = useMemo(() => {
    if (!product || !selectedSize || !selectedColor) return null;
    return product.variantes.find((v) => v.talla === selectedSize && v.color === selectedColor) ?? null;
  }, [product, selectedSize, selectedColor]);

  if (isLoading) return <Spinner full />;
  if (!product) return null;

  const images = [product.imagenPrincipal, ...product.galeria.map((g) => g.url)].filter(Boolean) as string[];
  const maxStock = selectedVariant?.stock ?? 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.info("Inicia sesión para agregar productos al carrito.");
      navigate("/login", { state: { from: `/producto/${product.id}` } });
      return;
    }
    if (!selectedVariant) {
      toast.error("Selecciona talla y color.");
      return;
    }
    if (quantity > maxStock) {
      toast.error("No hay suficiente stock para esa cantidad.");
      return;
    }
    setIsAdding(true);
    try {
      await addItem(selectedVariant.id, quantity);
      toast.success("Agregado al carrito.");
    } catch {
      toast.error("No se pudo agregar el producto.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="container-app py-8 lg:py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Galería */}
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-black/5">
            {activeImage ? (
              <img src={activeImage} alt={product.nombre} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-4xl text-ink/20">EC</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar">
              {images.map((img, i) => {
                const url = resolveMediaUrl(img)!;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveImage(url)}
                    className={cn(
                      "h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2",
                      activeImage === url ? "border-ink" : "border-transparent"
                    )}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ink/50">{product.marca}</span>
          <h1 className="mt-1 font-display text-3xl leading-tight sm:text-4xl">{product.nombre}</h1>
          <p className="mt-1 text-sm text-ink/50">{product.modelo}</p>

          <div className="mt-5">
            <PriceTag base={product.precioBase} offer={product.precioOferta} size="lg" />
          </div>

          <p className="mt-5 max-w-lg text-sm leading-relaxed text-ink/70">{product.descripcion}</p>

          {product.etiquetas.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.etiquetas.map((tag) => (
                <span key={tag} className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-ink/60">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Talla */}
          <div className="mt-7">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink/50">Talla</h4>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setSelectedSize(size);
                    setSelectedColor(null);
                  }}
                  className={cn(
                    "flex h-11 min-w-11 items-center justify-center rounded-lg border-2 px-3 text-sm font-semibold transition-colors",
                    selectedSize === size ? "border-ink bg-ink text-white" : "border-ink/15 hover:border-ink"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          {selectedSize && (
            <div className="mt-6">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink/50">Color</h4>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-colors",
                      selectedColor === color ? "border-ink bg-ink text-white" : "border-ink/15 hover:border-ink"
                    )}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cantidad */}
          {selectedVariant && (
            <div className="mt-6">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink/50">
                Cantidad {maxStock > 0 && <span className="normal-case text-ink/40">· {maxStock} disponibles</span>}
              </h4>
              <div className="flex w-32 items-center justify-between rounded-lg border-2 border-ink/15 px-3 py-2">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Restar">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-semibold">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))} aria-label="Sumar">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="flex-1"
              disabled={!selectedVariant || maxStock === 0}
              isLoading={isAdding}
              onClick={handleAddToCart}
            >
              {maxStock === 0 && selectedVariant ? "Sin stock" : "Agregar al carrito"}
            </Button>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-ink/10 pt-6 text-sm text-ink/60">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4" /> Envíos a todo Ecuador, costo según tu zona
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Producto verificado 100% original
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
