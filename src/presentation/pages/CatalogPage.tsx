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
    <div className="container-app py-6 sm:py-8 lg:py-12 text-slate-900 dark:text-white">
      <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl xl:text-5xl font-extrabold text-slate-900 dark:text-white">Catálogo</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{isLoading ? "Cargando..." : `${total} resultados`}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c] px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <select
            value={filters.ordering ?? ""}
            onChange={(e) => setFilters({ ordering: e.target.value || undefined })}
            className="h-10 rounded-full border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c] px-4 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-sky-500"
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

      <div className="grid gap-6 lg:gap-10 lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr] 2xl:grid-cols-[300px_1fr]">
        <aside className="hidden lg:block">
          <CatalogFilters brands={brands} categories={categories} sizes={sizes} value={filters} onChange={setFilters} />
        </aside>

        <div>
          <ProductGrid products={products} isLoading={isLoading} />

          {totalPages > 1 && (
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setFilters({ page })}
                    className={cn(
                      "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                      (filters.page ?? 1) === page
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full sm:max-w-xs overflow-y-auto bg-white dark:bg-[#12151c] text-slate-900 dark:text-white p-4 sm:p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold">Filtros</h3>
              <button onClick={() => setMobileFiltersOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
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
