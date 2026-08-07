import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { ProductFilters } from "@/domain/entities/Product";

export function useCatalogQuery() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: ProductFilters = useMemo(() => {
    const get = (key: string) => searchParams.get(key) || undefined;
    const getNum = (key: string) => {
      const v = get(key);
      return v ? Number(v) : undefined;
    };
    return {
      search: get("search"),
      marcaId: getNum("marca"),
      categoriaId: getNum("categoria"),
      tallaId: getNum("talla"),
      precioMin: getNum("precioMin"),
      precioMax: getNum("precioMax"),
      ordering: get("ordering"),
      page: getNum("page") || 1,
      pageSize: 12,
    };
  }, [searchParams]);

  const setFilters = (patch: Partial<ProductFilters>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      const paramKey = key === "marcaId" ? "marca" : key === "categoriaId" ? "categoria" : key === "tallaId" ? "talla" : key;
      if (value === undefined || value === null || value === "") {
        next.delete(paramKey);
      } else {
        next.set(paramKey, String(value));
      }
    });
    if (!("page" in patch)) next.delete("page");
    setSearchParams(next);
  };

  return { filters, setFilters };
}
