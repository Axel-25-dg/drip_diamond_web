import type { Brand, Category, Size } from "@/domain/entities/Product";
import { cn } from "@/presentation/utils/cn";

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

  return (
    <div className={cn("flex flex-col gap-6", className)}>
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
              onClick={() => update({ categoriaId: c.id })}
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
              onClick={() => update({ marcaId: b.id })}
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
                "flex h-9 min-w-9 items-center justify-center rounded-lg border-2 px-2 text-xs font-semibold transition-colors",
                value.tallaId === s.id ? "border-ink bg-ink text-white" : "border-ink/15 hover:border-ink"
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
            className="h-10 w-full rounded-lg border-2 border-ink/15 px-3 text-sm outline-none focus:border-ink"
          />
          <span className="text-ink/40">—</span>
          <input
            type="number"
            placeholder="Max"
            value={value.precioMax ?? ""}
            onChange={(e) => update({ precioMax: e.target.value ? Number(e.target.value) : undefined })}
            className="h-10 w-full rounded-lg border-2 border-ink/15 px-3 text-sm outline-none focus:border-ink"
          />
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink/50">{title}</h4>
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
        active ? "bg-ink font-semibold text-white" : "text-ink/70 hover:bg-black/5"
      )}
    >
      {label}
    </button>
  );
}
