import { useProductImage } from "@/presentation/hooks/useProductImage";

/**
 * Small thumbnail that shows the real product image.
 * Uses useProductImage which falls back to fetching the detail endpoint
 * when the summary has no image.
 */
export function ProductThumbnail({
  productId,
  imagenPrincipal,
  nombre,
  className = "h-full w-full object-cover",
}: {
  productId: number;
  imagenPrincipal: string | null | undefined;
  nombre: string;
  className?: string;
}) {
  const img = useProductImage(productId, imagenPrincipal);

  if (img) {
    return <img src={img} alt={nombre} className={className} />;
  }

  return (
    <div className="flex h-full w-full items-center justify-center font-display text-xs font-black text-slate-400">
      DD
    </div>
  );
}
