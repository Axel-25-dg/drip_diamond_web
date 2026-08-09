import { useEffect, useRef, useState } from "react";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import { resolveMediaUrl } from "@/presentation/utils/format";

// Simple in-memory cache: productId → resolved URL (or "" if no image)
const imageCache = new Map<number, string | null>();

/**
 * Returns the resolved image URL for a product.
 * If imagenPrincipal from the summary is available it uses it directly.
 * Otherwise fetches the product detail (once, cached) to get the real image.
 */
export function useProductImage(productId: number, imagenPrincipal: string | null | undefined): string | null {
  const fromSummary = resolveMediaUrl(imagenPrincipal);

  // If summary already has a valid image, use it immediately without fetching
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(fromSummary);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // If we already have an image from the summary, nothing to do
    if (fromSummary) {
      setResolvedUrl(fromSummary);
      return;
    }

    // Already fetched and cached
    if (imageCache.has(productId)) {
      setResolvedUrl(imageCache.get(productId) ?? null);
      return;
    }

    // Prevent double-fetch
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    useCases.getProductDetail
      .execute(productId)
      .then((detail) => {
        const url =
          resolveMediaUrl(detail.imagenPrincipal) ??
          (detail.galeria.length > 0 ? resolveMediaUrl(detail.galeria[0].url) : null);
        imageCache.set(productId, url);
        setResolvedUrl(url);
      })
      .catch(() => {
        imageCache.set(productId, null);
      });
  }, [productId, fromSummary]);

  return resolvedUrl;
}
