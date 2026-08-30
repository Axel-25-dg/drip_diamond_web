import { useEffect, useState } from "react";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Promotion } from "@/domain/entities/Product";

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = () => {
    setIsLoading(true);
    useCases.getPromotions
      .execute()
      .then(setPromotions)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    window.addEventListener("promotions:updated", load);
    return () => window.removeEventListener("promotions:updated", load);
  }, []);

  const activeFreeShippingPromo = promotions.find(
    (p) => p.activo && (p.tipo === "ENVIO_GRATIS_DOS_PARES" || !p.tipo)
  );

  return {
    promotions,
    isLoading,
    activeFreeShippingPromo,
    isFreeShippingPromoActive: Boolean(activeFreeShippingPromo),
    minParesForFreeShipping: activeFreeShippingPromo?.minPares ?? 2,
    reload: load,
  };
}
