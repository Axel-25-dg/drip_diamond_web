import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { ProductSummary } from "@/domain/entities/Product";
import { Button } from "@/presentation/components/ui/Button";
import { Badge } from "@/presentation/components/ui/Badge";
import { ProductThumbnail } from "@/presentation/components/ui/ProductThumbnail";
import { formatCurrency } from "@/presentation/utils/format";
import { toast } from "sonner";
import { Plus, Package, Search, ArrowLeft, Trash2 } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await useCases.getProducts.execute({ page: 1, pageSize: 50 });
      setProducts(res.items);
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (p: ProductSummary) => {
    if (!confirm(`¿Eliminar la zapatilla "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await useCases.deleteProduct.execute(p.id);
      toast.success("Zapatilla eliminada correctamente");
      fetchProducts();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo eliminar la zapatilla");
    }
  };

  const filtered = products.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.marca.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container-app py-10">
      {/* BREADCRUMBS */}
      <div className="flex flex-wrap items-center gap-2 animate-fade-in">
        <Link
          to="/admin"
          className="chip chip-outline flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-all hover:scale-[1.02]"
        >
          <ArrowLeft className="h-3 w-3" /> Dashboard
        </Link>
        <span className="text-muted-t text-xs">/</span>
        <span className="chip chip-accent text-[11px] font-bold uppercase tracking-wider">
          <Package className="h-3 w-3" /> Catálogo
        </span>
        <span className="chip chip-success text-[11px] font-bold uppercase tracking-wider ml-2">
          {products.length} productos
        </span>
        <span className="chip chip-gold text-[11px] font-bold uppercase tracking-wider">
          {products.filter((p) => p.estado === "disponible").length} disponibles
        </span>
      </div>

      {/* HERO HEADER */}
      <div
        className="relative mt-6 overflow-hidden rounded-[28px] p-[1px] animate-fade-in"
        style={{
          background:
            "linear-gradient(135deg, rgba(14,165,233,0.55), rgba(99,102,241,0.55) 50%, rgba(212,175,55,0.45))",
        }}
      >
        <div className="relative overflow-hidden rounded-[27px] bg-surf px-8 py-10 sm:px-12 sm:py-12">
          <div
            className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(14,165,233,0.22), transparent)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(212,175,55,0.20), transparent)" }}
          />
          <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl animate-slide-up">
              <Badge tone="accent" className="mb-4">
                <Package className="h-3 w-3" />
                Gestión de Catálogo · DRIP DIAMOND
              </Badge>
              <h1 className="font-display text-4xl sm:text-6xl leading-[1.02] tracking-tight">
                <span className="text-gradient-ink">Catálogo de</span>{" "}
                <span className="text-gradient-brand">Zapatillas</span>
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-secondary">
                Administra productos, fotos, precios de lista/oferta y stock disponible.
                Control total sobre tu inventario premium en un solo lugar.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-t">
                <span className="chip chip-accent">
                  <Search className="h-3 w-3" /> Búsqueda inteligente
                </span>
                <span className="chip chip-success">
                  <Plus className="h-3 w-3" /> Alta rápida
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 animate-slide-up delay-200">
              <Link to="/admin/productos/nuevo">
                <Button variant="secondary" size="lg">
                  <Plus className="h-4 w-4" /> Agregar Nueva Zapatilla
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="mt-10 animate-slide-up delay-150">
        <div className="relative max-w-2xl">
          <div
            className="absolute -inset-px rounded-2xl opacity-0 blur transition-opacity duration-500"
            style={{
              background: "radial-gradient(80% 60% at 50% 0%, rgba(14,165,233,0.35), transparent 70%)",
            }}
          />
          <div className="relative flex items-center gap-3 rounded-2xl border bg-surf p-2 pl-4 shadow-card transition-all duration-300 hover:shadow-card-hover focus-within:shadow-card-hover"
            style={{ borderColor: "var(--card-border)" }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
              style={{
                background: "linear-gradient(135deg, rgba(14,165,233,0.14), rgba(99,102,241,0.10))",
                borderColor: "rgba(14,165,233,0.25)",
                color: "#0284c7",
              }}
            >
              <Search className="h-4 w-4" />
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por nombre o marca..."
              className="h-11 flex-1 bg-transparent pr-4 text-sm text-primary placeholder:text-muted-t outline-none"
            />
            {search && (
              <span className="chip chip-accent mr-2 text-[10px]">
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div
        className="mt-8 overflow-hidden rounded-[22px] border bg-surf shadow-card animate-fade-in animate-slide-up delay-200"
        style={{ borderColor: "var(--card-border)" }}
      >
        {isLoading ? (
          <div className="p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border"
              style={{
                background: "linear-gradient(135deg, rgba(14,165,233,0.14), rgba(99,102,241,0.10))",
                borderColor: "rgba(14,165,233,0.25)",
              }}
            >
              <Package className="h-8 w-8 animate-pulse" style={{ color: "#0284c7" }} />
            </div>
            <p className="font-display text-xl text-primary">Cargando productos...</p>
            <p className="mt-1 text-sm text-muted-t">Preparando tu catálogo premium</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border"
              style={{
                background:
                  "linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.12))",
                borderColor: "rgba(212,175,55,0.30)",
              }}
            >
              <Package className="h-10 w-10" style={{ color: "#9d7b1b" }} />
            </div>
            <Badge tone="gold" className="mb-3">
              Catálogo vacío
            </Badge>
            <p className="font-display text-2xl sm:text-3xl text-gradient-ink">
              No hay zapatillas registradas
            </p>
            <p className="mt-2 text-sm text-secondary">
              Crea tu primer producto para comenzar a vender.
            </p>
            <div className="mt-6">
              <Link to="/admin/productos/nuevo">
                <Button variant="secondary" size="lg">
                  <Plus className="h-4 w-4" /> Crear Primera Zapatilla
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead
                className="border-b text-xs font-bold uppercase tracking-wider"
                style={{ borderColor: "var(--card-border)" }}
              >
                <tr className="text-muted-t">
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Marca</th>
                  <th className="px-6 py-4">Precio Base</th>
                  <th className="px-6 py-4">Precio Oferta</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => {
                  const delay = `${Math.min(idx * 30, 300)}ms`;
                  return (
                    <tr
                      key={p.id}
                      className="row-hover border-b animate-slide-up"
                      style={{
                        borderColor: "var(--card-border)",
                        animationDelay: delay,
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border p-[1px]"
                            style={{
                              background:
                                "linear-gradient(135deg, rgba(14,165,233,0.35), rgba(99,102,241,0.35) 50%, rgba(212,175,55,0.30))",
                              borderColor: "transparent",
                            }}
                          >
                            <div className="h-full w-full overflow-hidden rounded-[10px] bg-surf">
                              <ProductThumbnail
                                productId={p.id}
                                imagenPrincipal={p.imagenPrincipal}
                                nombre={p.nombre}
                              />
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-primary">{p.nombre}</p>
                            <p className="text-xs text-muted-t">ID: #{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="chip chip-outline text-[11px] font-semibold uppercase tracking-wider">
                          {p.marca}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-primary">
                        {formatCurrency(p.precioBase)}
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {p.precioOferta ? (
                          <span className="chip chip-accent text-[12px] font-bold">
                            {formatCurrency(p.precioOferta)}
                          </span>
                        ) : (
                          <span className="text-muted-t">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {p.estado === "disponible" || (p.tallasDisponibles && p.tallasDisponibles.length > 0) ? (
                          <Badge tone="success">Disponible</Badge>
                        ) : (
                          <Badge tone="danger">Agotado</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/admin/productos/editar/${p.id}`}>
                            <Button variant="outline" size="sm">
                              Editar ✏️
                            </Button>
                          </Link>
                          <Link to={`/producto/${p.id}`}>
                            <Button variant="ghost" size="sm">
                              Ver Tienda
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(p)}
                            className="text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="h-16" />
    </div>
  );
}
