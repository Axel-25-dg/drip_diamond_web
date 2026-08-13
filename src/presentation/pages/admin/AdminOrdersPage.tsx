import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Order, OrderStatus } from "@/domain/entities/Order";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button } from "@/presentation/components/ui/Button";
import { formatCurrency, formatDate, orderStatusLabel, orderStatusTone } from "@/presentation/utils/format";
import { toast } from "sonner";
import { ArrowLeft, ShoppingBag, Search, Truck, CheckCircle2, X, Boxes } from "lucide-react";

const NEXT_ACTIONS: Record<
  string,
  { label: string; nextEstado: string; icon: React.ReactNode; variant: "secondary" | "outline" | "ghost" }[]
> = {
  PAGO_APROBADO:     [{ label: "Preparar",         nextEstado: "PREPARANDO_PEDIDO", icon: <Boxes className="h-3.5 w-3.5" />,      variant: "outline" }],
  PREPARANDO_PEDIDO: [{ label: "Marcar Enviado",    nextEstado: "ENVIADO",           icon: <Truck className="h-3.5 w-3.5" />,       variant: "outline" }],
  ENVIADO:           [{ label: "Confirmar Entrega", nextEstado: "ENTREGADO",         icon: <CheckCircle2 className="h-3.5 w-3.5" />, variant: "secondary" }],
};

const STATUS_FILTER_OPTIONS = [
  { value: "TODOS", label: "Todos" },
  { value: "PAGO_APROBADO", label: "Pago Aprobado" },
  { value: "PREPARANDO_PEDIDO", label: "Preparando" },
  { value: "ENVIADO", label: "Enviado" },
  { value: "ENTREGADO", label: "Entregado" },
  { value: "PENDIENTE_DE_PAGO", label: "Pendiente pago" },
  { value: "COMPROBANTE_ENVIADO", label: "Comprobante enviado" },
  { value: "PAGO_EN_REVISION", label: "En revisión" },
  { value: "PAGO_RECHAZADO", label: "Pago rechazado" },
  { value: "CANCELADO", label: "Cancelado" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [shipModal, setShipModal] = useState<{ order: Order; nextEstado: string } | null>(null);
  const [guiaInput, setGuiaInput] = useState("");

  const fetchOrders = async () => {
    setIsLoading(true);
    try { setOrders(await useCases.getSellerOrders.execute()); }
    catch { setOrders([]); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !search || String(o.id).includes(q) || o.numero?.toLowerCase().includes(q) ||
      o.clienteNombre?.toLowerCase().includes(q) || o.ciudad?.toLowerCase().includes(q);
    return matchSearch && (statusFilter === "TODOS" || o.estado === statusFilter);
  });

  const handleAdvance = async (order: Order, nextEstado: string) => {
    if (nextEstado === "ENVIADO") { setShipModal({ order, nextEstado }); setGuiaInput(""); return; }
    await doAdvance(order.id, nextEstado);
  };
  const doAdvance = async (orderId: number, nextEstado: string, extra?: Record<string, any>) => {
    setActionLoading(orderId);
    try {
      const updated = await useCases.updateOrderStatus.execute(orderId, nextEstado, extra);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, estado: updated.estado, numeroGuia: updated.numeroGuia } : o));
      toast.success(nextEstado === "ENTREGADO" ? `Pedido #${orderId} entregado. Comisión acreditada.` : `Pedido #${orderId} → ${orderStatusLabel(nextEstado as OrderStatus)}`);
    } catch (err: any) { toast.error(err?.message || "No se pudo cambiar el estado."); }
    finally { setActionLoading(null); }
  };
  const handleShipConfirm = async () => {
    if (!shipModal) return;
    setShipModal(null);
    await doAdvance(shipModal.order.id, "ENVIADO", { numero_guia: guiaInput.trim() });
  };

  const statsCounts = {
    PAGO_APROBADO:     orders.filter((o) => o.estado === "PAGO_APROBADO").length,
    PREPARANDO_PEDIDO: orders.filter((o) => o.estado === "PREPARANDO_PEDIDO").length,
    ENVIADO:           orders.filter((o) => o.estado === "ENVIADO").length,
    ENTREGADO:         orders.filter((o) => o.estado === "ENTREGADO").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0a0c10] dark:text-slate-100 transition-colors duration-200">
      <div className="container-app py-10">
        <section className="rounded-[32px] border border-blue-100 bg-white p-8 shadow-sm dark:border-[#222732] dark:bg-[#12151c]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <Link to="/admin" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-400 hover:text-sky-800">
                <ArrowLeft className="h-4 w-4" /> Volver al panel admin
              </Link>
              <h1 className="mt-4 font-display text-4xl font-extrabold text-slate-900 dark:text-white sm:text-5xl">
                Gestión de <span className="text-blue-600 dark:text-[#38bdf8]">Pedidos</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Supervisa el estado de cada orden y avanza las etapas desde la verificación del pago hasta la entrega al cliente.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="inline-flex h-11 items-center justify-center rounded-2xl border border-blue-100 bg-slate-50 px-5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                <Search className="mr-2 h-4 w-4 text-sky-500" /> Buscar pedidos
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { title: "Por preparar", value: statsCounts.PAGO_APROBADO, color: "blue" },
              { title: "Preparando", value: statsCounts.PREPARANDO_PEDIDO, color: "blue" },
              { title: "En camino", value: statsCounts.ENVIADO, color: "sky" },
              { title: "Entregados", value: statsCounts.ENTREGADO, color: "blue" },
            ].map((item) => (
              <div key={item.title} className="rounded-[28px] border border-blue-100 bg-slate-50 p-5 shadow-sm dark:border-[#222732] dark:bg-[#171a22]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{item.title}</p>
                <p className="mt-3 text-4xl font-extrabold text-slate-900 dark:text-white">{item.value}</p>
                <div className="mt-4 h-1.5 w-full rounded-full bg-blue-100 dark:bg-slate-800" />
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por ID, cliente o ciudad"
                className="h-11 w-full rounded-2xl border border-blue-100 bg-white dark:border-[#222732] dark:bg-[#171a22] pl-11 pr-4 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-2xl border border-blue-100 bg-white dark:border-[#222732] dark:bg-[#171a22] px-4 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-sky-100"
              >
                {STATUS_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {(search || statusFilter !== "TODOS") && (
                <button
                  onClick={() => { setSearch(""); setStatusFilter("TODOS"); }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-sm dark:border-[#222732] dark:bg-[#12151c]">
            {isLoading ? (
              <div className="flex min-h-[260px] items-center justify-center p-12 text-slate-500 dark:text-slate-400">Cargando pedidos...</div>
            ) : filtered.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-12 text-center text-slate-500 dark:text-slate-400">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 dark:bg-slate-800 text-blue-400 dark:text-sky-400">
                  <ShoppingBag className="h-7 w-7" />
                </div>
                <p className="font-display text-xl font-semibold text-slate-900 dark:text-white">No hay pedidos que coincidan</p>
                <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">Ajusta la búsqueda o cambia el filtro de estado para ver pedidos activos.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-sky-50 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-[#171a22] dark:text-slate-400 border-b border-slate-100 dark:border-[#222732]">
                    <tr>
                      <th className="px-6 py-4">Pedido</th>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Vendedor</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Fecha</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1c2029]">
                    {filtered.map((o) => {
                      const actions = NEXT_ACTIONS[o.estado] ?? [];
                      return (
                        <tr key={o.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-[#171a22]/60">
                          <td className="px-6 py-4">
                            <div className="font-mono font-semibold text-slate-900 dark:text-white">{o.numero || `#${o.id}`}</div>
                            {o.numeroGuia && <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">Guía: {o.numeroGuia}</div>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900 dark:text-white">{o.clienteNombre || "—"}</div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">{o.ciudad || "—"}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{o.vendedorNombre || "—"}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(o.total || o.montoTotal || 0)}</td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{formatDate(o.creadoEn)}</td>
                          <td className="px-6 py-4"><Badge tone={orderStatusTone(o.estado)}>{orderStatusLabel(o.estado)}</Badge></td>
                          <td className="px-6 py-4 text-right">
                            {actions.length > 0 ? (
                              <div className="flex flex-wrap justify-end gap-2">
                                {actions.map((a) => (
                                  <Button key={a.nextEstado} variant={a.variant} size="sm" isLoading={actionLoading === o.id} onClick={() => handleAdvance(o, a.nextEstado)}>
                                    {a.icon} {a.label}
                                  </Button>
                                ))}
                              </div>
                            ) : o.estado === "ENTREGADO" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Completado</span>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {shipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-blue-100 bg-white p-6 shadow-2xl dark:border-[#262c38] dark:bg-[#12151c] dark:text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Marcar pedido como enviado</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{shipModal.order.numero || `#${shipModal.order.id}`} · {shipModal.order.clienteNombre}</p>
              </div>
              <button onClick={() => setShipModal(null)} className="rounded-2xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-400">Número de guía</label>
              <input
                autoFocus
                value={guiaInput}
                onChange={(e) => setGuiaInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleShipConfirm()}
                placeholder="Ej. SERVIENTREGA-0012345"
                className="mt-3 h-12 w-full rounded-2xl border border-blue-100 bg-sky-50 dark:border-[#262c38] dark:bg-[#171a22] px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-sky-100"
              />
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Este número de guía se enviará al cliente. Puedes dejarlo opcional.</p>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button variant="ghost" onClick={() => setShipModal(null)}>Cancelar</Button>
              <Button variant="secondary" isLoading={actionLoading === shipModal.order.id} onClick={handleShipConfirm}>
                <Truck className="h-4 w-4" /> Confirmar envío
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
