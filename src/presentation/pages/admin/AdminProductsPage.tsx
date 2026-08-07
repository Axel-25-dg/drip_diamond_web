import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { ProductSummary } from "@/domain/entities/Product";
import { Button } from "@/presentation/components/ui/Button";
import { Badge } from "@/presentation/components/ui/Badge";
import { formatCurrency, resolveMediaUrl } from "@/presentation/utils/format";
import { Plus, Package, Search, ArrowLeft } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await useCases.getProducts.execute({ page: 1, pageSize: 50 });
        setProducts(res.items);
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filtered = products.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.marca.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container-app py-10">
      {/* NAVIGATION HEADER */}
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        <Link to="/admin" className="hover:text-slate-900 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-900">Catálogo</span>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-slate-900 sm:text-5xl">
            CATÁLOGO DE <span className="text-accent">ZAPATILLAS</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Administra productos, fotos, precios de lista/oferta y stock disponible.
          </p>
        </div>

        <Link to="/admin/productos/nuevo">
          <Button variant="secondary" size="lg" className="shadow-md shadow-sky-500/20">
            <Plus className="h-4 w-4" /> Agregar Nueva Zapatilla
          </Button>
        </Link>
      </div>

      {/* SEARCH BAR */}
      <div className="mt-8 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por nombre o marca..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Cargando productos...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Package className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 font-display text-xl text-slate-700">No hay zapatillas registradas</p>
            <p className="text-xs">Crea tu primer producto para comenzar a vender.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Marca</th>
                  <th className="px-6 py-4">Precio Base</th>
                  <th className="px-6 py-4">Precio Oferta</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const img = resolveMediaUrl(p.imagenPrincipal);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                            {img ? (
                              <img src={img} alt={p.nombre} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-display text-xs text-slate-400">
                                DD
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{p.nombre}</p>
                            <p className="text-xs text-slate-400">ID: #{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{p.marca}</td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-900">
                        {formatCurrency(p.precioBase)}
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {p.precioOferta ? (
                          <span className="font-bold text-sky-600">{formatCurrency(p.precioOferta)}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {p.estado === "disponible" ? (
                          <Badge tone="success">Disponible</Badge>
                        ) : (
                          <Badge tone="danger">Agotado</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/admin/productos/editar/${p.id}`}>
                            <Button variant="secondary" size="sm">
                              Editar ✏️
                            </Button>
                          </Link>
                          <Link to={`/producto/${p.id}`}>
                            <Button variant="ghost" size="sm">
                              Ver Tienda
                            </Button>
                          </Link>
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
    </div>
  );
}
