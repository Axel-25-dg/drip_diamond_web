import type { Brand, Category, Size } from "@/domain/entities/Product";
import { cn } from "@/presentation/utils/cn";
import { X } from "lucide-react";

export interface CatalogFiltersState {
  marcaId?: number;
  categoriaId?: number;
  tallaId?: number;
  precioMin?: number;
  precioMax?: number;
  ordering?: string;
}

export function CatalogFilters({
  brands,
  categories,
  sizes,
  value,
  onChange,
  className,
}: {
  brands: Brand[];
  categories: Category[];
  sizes: Size[];
  value: CatalogFiltersState;
  onChange: (next: CatalogFiltersState) => void;
  className?: string;
}) {
  const update = (patch: Partial<CatalogFiltersState>) => onChange({ ...value, ...patch });

  const hasFilters = !!(value.marcaId || value.categoriaId || value.tallaId || value.precioMin || value.precioMax);

  const clearAll = () =>
    onChange({
      marcaId: undefined,
      categoriaId: undefined,
      tallaId: undefined,
      precioMin: undefined,
      precioMax: undefined,
      ordering: value.ordering,
    });

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Limpiar filtros */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200 w-full justify-center dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <X className="h-3.5 w-3.5" />
          Limpiar filtros
        </button>
      )}

      <FilterGroup title="Categoría">
        <div className="flex flex-col gap-1">
          <FilterOption
            label="Todas"
            active={!value.categoriaId}
            onClick={() => update({ categoriaId: undefined })}
          />
          {categories.map((c) => (
            <FilterOption
              key={c.id}
              label={c.nombre}
              active={value.categoriaId === c.id}
              onClick={() => update({ categoriaId: value.categoriaId === c.id ? undefined : c.id })}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Marca">
        <div className="flex flex-col gap-1">
          <FilterOption label="Todas" active={!value.marcaId} onClick={() => update({ marcaId: undefined })} />
          {brands.map((b) => (
            <FilterOption
              key={b.id}
              label={b.nombre}
              active={value.marcaId === b.id}
              onClick={() => update({ marcaId: value.marcaId === b.id ? undefined : b.id })}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Talla">
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s.id}
              onClick={() => update({ tallaId: value.tallaId === s.id ? undefined : s.id })}
              className={cn(
                "flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-xs font-semibold transition-colors",
                value.tallaId === s.id
                  ? "border-sky-500 bg-sky-500 text-white"
                  : "border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c] text-slate-600 dark:text-slate-300 hover:border-sky-400 dark:hover:border-sky-400"
              )}
            >
              {s.valor}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Precio">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={value.precioMin ?? ""}
            onChange={(e) => update({ precioMin: e.target.value ? Number(e.target.value) : undefined })}
            className="h-10 w-full rounded-lg border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c] px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-400"
          />
          <span className="text-slate-400 dark:text-slate-500">—</span>
          <input
            type="number"
            placeholder="Max"
            value={value.precioMax ?? ""}
            onChange={(e) => update({ precioMax: e.target.value ? Number(e.target.value) : undefined })}
            className="h-10 w-full rounded-lg border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c] px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-400"
          />
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{title}</h4>
      {children}
    </div>
  );
}

function FilterOption({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
        active ? "bg-sky-500 font-semibold text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
      )}
    >
      {label}
    </button>
  );
}
