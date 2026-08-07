import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Brand, Category, ProductSummary, Size } from "@/domain/entities/Product";
import { ProductGrid } from "@/presentation/components/catalog/ProductGrid";
import { CatalogFilters } from "@/presentation/components/catalog/CatalogFilters";
import { useCatalogQuery } from "@/presentation/hooks/useCatalogQuery";
import { Button } from "@/presentation/components/ui/Button";
import { cn } from "@/presentation/utils/cn";

const SORT_OPTIONS = [
  { value: "-reciente", label: "Más recientes" },
  { value: "precio", label: "Precio: menor a mayor" },
  { value: "-precio", label: "Precio: mayor a menor" },
];

export default function CatalogPage() {
  const { filters, setFilters } = useCatalogQuery();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    useCases.getCatalogFilters
      .execute()
      .then(({ brands, categories, sizes }) => {
        setBrands(brands);
        setCategories(categories);
        setSizes(sizes);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    useCases.getProducts
      .execute(filters)
      .then((res) => {
        if (!active) return;
        setProducts(res.items);
        setTotalPages(res.totalPages);
        setTotal(res.total);
      })
      .catch(() => {
        if (active) {
          setProducts([]);
          setTotalPages(1);
          setTotal(0);
        }
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [JSON.stringify(filters)]);

  const activeFilterCount = [filters.marcaId, filters.categoriaId, filters.tallaId, filters.precioMin, filters.precioMax].filter(
    Boolean
  ).length;

  return (
    <div className="container-app py-8 lg:py-12">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl">Catálogo</h1>
          <p className="mt-1 text-sm text-ink/50">{isLoading ? "Cargando..." : `${total} resultados`}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 rounded-full border-2 border-ink/15 px-4 py-2 text-sm font-semibold lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <select
            value={filters.ordering ?? ""}
            onChange={(e) => setFilters({ ordering: e.target.value || undefined })}
            className="h-10 rounded-full border-2 border-ink/15 bg-white px-4 text-sm font-semibold outline-none"
          >
            <option value="">Ordenar por</option>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <CatalogFilters brands={brands} categories={categories} sizes={sizes} value={filters} onChange={setFilters} />
        </aside>

        <div>
          <ProductGrid products={products} isLoading={isLoading} />

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setFilters({ page })}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                      (filters.page ?? 1) === page ? "bg-ink text-white" : "hover:bg-black/5"
                    )}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Filtros mobile */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xs overflow-y-auto bg-paper p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-xl">Filtros</h3>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <CatalogFilters brands={brands} categories={categories} sizes={sizes} value={filters} onChange={setFilters} />
            <Button fullWidth size="lg" className="mt-6" onClick={() => setMobileFiltersOpen(false)}>
              Ver resultados
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
