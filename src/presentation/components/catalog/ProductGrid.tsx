import type { ProductSummary } from "@/domain/entities/Product";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "@/presentation/components/ui/EmptyState";
import { PackageSearch } from "lucide-react";

export function ProductGrid({ products, isLoading }: { products: ProductSummary[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="skeleton aspect-square w-full" />
            <div className="skeleton h-3 w-2/3" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<PackageSearch className="h-12 w-12" />}
        title="No encontramos productos Drip"
        description="Prueba ajustando los filtros o buscando con otros términos."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
