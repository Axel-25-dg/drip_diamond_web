import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Order, OrderStatus } from "@/domain/entities/Order";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button } from "@/presentation/components/ui/Button";
import { ShippingTicket } from "@/presentation/components/ui/ShippingTicket";
import { formatCurrency, formatDate, orderStatusLabel, orderStatusTone, formatAddressForDisplay } from "@/presentation/utils/format";
import { toast } from "sonner";
import {
  ArrowLeft, ShoppingBag, Search, Truck, CheckCircle2,
  X, Boxes, MapPin, Eye, Package, Phone, User,
} from "lucide-react";

const NEXT_ACTIONS: Record<
  string,
  { label: string; nextEstado: string; icon: React.ReactNode; variant: "secondary" | "outline" | "ghost" }[]
> = {
  PAGO_APROBADO:     [{ label: "Preparar",         nextEstado: "PREPARANDO_PEDIDO", icon: <Boxes className="h-3.5 w-3.5" />,       variant: "outline" }],
  PREPARANDO_PEDIDO: [{ label: "Marcar Enviado",    nextEstado: "ENVIADO",           icon: <Truck className="h-3.5 w-3.5" />,        variant: "outline" }],
  ENVIADO:           [{ label: "Confirmar Entrega", nextEstado: "ENTREGADO",         icon: <CheckCircle2 className="h-3.5 w-3.5" />, variant: "secondary" }],
};

const STATUS_FILTER_OPTIONS = [
  { value: "TODOS",               label: "Todos" },
  { value: "PAGO_APROBADO",       label: "Pago Aprobado" },
  { value: "PREPARANDO_PEDIDO",   label: "Preparando" },
  { value: "ENVIADO",             label: "Enviado" },
  { value: "ENTREGADO",           label: "Entregado" },
  { value: "PENDIENTE_DE_PAGO",   label: "Pendiente pago" },
  { value: "COMPROBANTE_ENVIADO", label: "Comprobante enviado" },
  { value: "PAGO_EN_REVISION",    label: "En revisión" },
  { value: "PAGO_RECHAZADO",      label: "Pago rechazado" },
  { value: "CANCELADO",           label: "Cancelado" },
];

export default function AdminOrdersPage() {
  const [orders,        setOrders]        = useState<Order[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("TODOS");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Modals
  const [shipModal,   setShipModal]   = useState<{ order: Order; nextEstado: string } | null>(null);
  const [guiaInput,   setGuiaInput]   = useState("");
  const [detailOrder, setDetailOrder] = useState<Order | null>(null); // <- mapa + ticket

  const fetchOrders = async () => {
    setIsLoading(true);
    try { setOrders(await useCases.getSellerOrders.execute()); }
    catch { setOrders([]); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const m = !search || String(o.id).includes(q) || o.numero?.toLowerCase().includes(q) ||
      o.clienteNombre?.toLowerCase().includes(q) || o.ciudad?.toLowerCase().includes(q);
    return m && (statusFilter === "TODOS" || o.estado === statusFilter);
  });

  const handleAdvance = async (order: Order, nextEstado: string) => {
    if (nextEstado === "ENVIADO") { setShipModal({ order, nextEstado }); setGuiaInput(""); return; }
    await doAdvance(order.id, nextEstado);
  };

  const doAdvance = async (orderId: number, nextEstado: string, extra?: Record<string, any>) => {
    setActionLoading(orderId);
    try {
      const updated = await useCases.updateOrderStatus.execute(orderId, nextEstado, extra);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, estado: updated.estado, numeroGuia: updated.numeroGuia } : o));
      // If the detail modal is open for this order, update it too
      setDetailOrder(prev => prev?.id === orderId ? { ...prev, estado: updated.estado, numeroGuia: updated.numeroGuia } : prev);
      toast.success(nextEstado === "ENTREGADO"
        ? `Pedido #${orderId} entregado. Comisión acreditada.`
        : `Pedido #${orderId} → ${orderStatusLabel(nextEstado as OrderStatus)}`);
    } catch (err: any) { toast.error(err?.message || "No se pudo cambiar el estado."); }
    finally { setActionLoading(null); }
  };

  const handleShipConfirm = async () => {
    if (!shipModal) return;
    setShipModal(null);
    await doAdvance(shipModal.order.id, "ENVIADO", { numero_guia: guiaInput.trim() });
  };

  const statsCounts = {
    PAGO_APROBADO:     orders.filter(o => o.estado === "PAGO_APROBADO").length,
    PREPARANDO_PEDIDO: orders.filter(o => o.estado === "PREPARANDO_PEDIDO").length,
    ENVIADO:           orders.filter(o => o.estado === "ENVIADO").length,
    ENTREGADO:         orders.filter(o => o.estado === "ENTREGADO").length,
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="container-app py-10">

        {/* ── Header ── */}
        <div className="flex items-center gap-2 text-sm">
          <Link to="/admin" className="flex items-center gap-1 font-medium text-[var(--text-muted)] hover:text-blue-600 dark:hover:text-sky-400 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="font-semibold text-blue-600 dark:text-sky-400">Gestión de Pedidos</span>
        </div>

        <div className="mt-6">
          <h1 className="font-display text-3xl font-extrabold text-[var(--text-primary)] sm:text-4xl">
            Gestión de <span className="text-blue-600 dark:text-sky-400">Pedidos</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Supervisa y avanza cada pedido. Haz clic en <strong>Ver detalle</strong> para ver el mapa de ubicación e imprimir el ticket de Servientrega.
          </p>
        </div>

        {/* ── KPI cards ── */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { key: "PAGO_APROBADO",     label: "Por preparar",  bg: "bg-amber-50 dark:bg-amber-950/20   border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400" },
            { key: "PREPARANDO_PEDIDO", label: "Preparando",    bg: "bg-blue-50  dark:bg-blue-950/20    border-blue-200  dark:border-blue-800/50  text-blue-700  dark:text-blue-400" },
            { key: "ENVIADO",           label: "En camino",     bg: "bg-sky-50   dark:bg-sky-950/20     border-sky-200   dark:border-sky-800/50   text-sky-700   dark:text-sky-400" },
            { key: "ENTREGADO",         label: "Entregados",    bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400" },
          ].map(({ key, label, bg }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? "TODOS" : key)}
              className={`rounded-2xl border p-4 text-left transition-all ${bg} ${statusFilter === key ? "ring-2 ring-current ring-offset-2" : "hover:shadow-md"}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
              <p className="mt-1 font-display text-3xl font-black">{statsCounts[key as keyof typeof statsCounts]}</p>
            </button>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por ID, cliente, ciudad..."
              className="h-10 w-full rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] px-3 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-blue-400"
          >
            {STATUS_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {(search || statusFilter !== "TODOS") && (
            <button onClick={() => { setSearch(""); setStatusFilter("TODOS"); }}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-surface2)]">
              <X className="h-3.5 w-3.5" /> Limpiar
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)]">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 p-16 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-500" />
              <p className="text-sm font-medium text-[var(--text-muted)]">Cargando pedidos...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-300">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <p className="font-display text-xl font-bold text-[var(--text-primary)]">No hay pedidos que coincidan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--bg-border)] bg-blue-50/60 dark:bg-blue-950/10 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <tr>
                    <th className="px-5 py-3.5">Pedido</th>
                    <th className="px-5 py-3.5">Cliente</th>
                    <th className="px-5 py-3.5">Vendedor</th>
                    <th className="px-5 py-3.5">Total</th>
                    <th className="px-5 py-3.5">Fecha</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--bg-border)]">
                  {filtered.map(o => {
                    const actions = NEXT_ACTIONS[o.estado] ?? [];
                    return (
                      <tr key={o.id} className="transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-950/10">
                        <td className="px-5 py-4">
                          <span className="font-mono font-bold text-[var(--text-primary)]">{o.numero || `#${o.id}`}</span>
                          {o.numeroGuia && <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">Guía: {o.numeroGuia}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[var(--text-primary)]">{o.clienteNombre || "—"}</p>
                          <p className="text-xs text-[var(--text-muted)]">{o.ciudad || "—"}</p>
                          {o.telefonoContacto && <p className="text-xs text-[var(--text-muted)]">{o.telefonoContacto}</p>}
                        </td>
                        <td className="px-5 py-4 text-[var(--text-secondary)]">{o.vendedorNombre || <span className="text-[var(--text-muted)]">—</span>}</td>
                        <td className="px-5 py-4 font-mono font-bold text-[var(--text-primary)]">{formatCurrency(o.total || o.montoTotal || 0)}</td>
                        <td className="px-5 py-4 text-xs text-[var(--text-secondary)] whitespace-nowrap">{formatDate(o.creadoEn)}</td>
                        <td className="px-5 py-4"><Badge tone={orderStatusTone(o.estado)}>{orderStatusLabel(o.estado)}</Badge></td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {/* VER DETALLE → abre modal con mapa y ticket */}
                            <button
                              onClick={() => setDetailOrder(o)}
                              className="flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-sky-800 bg-blue-50 dark:bg-sky-950/30 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-sky-400 hover:bg-blue-100 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" /> Ver detalle
                            </button>
                            {/* Acciones de estado */}
                            {actions.map(a => (
                              <Button key={a.nextEstado} variant={a.variant} size="sm"
                                isLoading={actionLoading === o.id} onClick={() => handleAdvance(o, a.nextEstado)}>
                                {a.icon} {a.label}
                              </Button>
                            ))}
                            {o.estado === "ENTREGADO" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Completado
                              </span>
                            )}
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

      {/* ══════════════════════════════════════════════════════
          MODAL DETALLE — Mapa + Info cliente + Ticket Servientrega
      ══════════════════════════════════════════════════════ */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/50 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-blue-100 dark:border-[#222732] bg-white dark:bg-[#12151c] shadow-[0_20px_60px_rgba(37,99,235,0.20)]">

            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-[var(--bg-border)] p-6">
              <div>
                <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">
                  Pedido {detailOrder.numero}
                  <Badge tone={orderStatusTone(detailOrder.estado)} className="ml-3">{orderStatusLabel(detailOrder.estado)}</Badge>
                </h3>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{formatDate(detailOrder.creadoEn)}</p>
              </div>
              <button onClick={() => setDetailOrder(null)} className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface2)] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Info del cliente */}
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface2)] p-4">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Cliente</p>
                  <p className="mt-0.5 font-semibold text-[var(--text-primary)]">{detailOrder.clienteNombre || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface2)] p-4">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Teléfono</p>
                  <p className="mt-0.5 font-semibold text-[var(--text-primary)]">{detailOrder.telefonoContacto || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface2)] p-4 sm:col-span-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Dirección de envío</p>
                  <p className="mt-0.5 font-semibold text-[var(--text-primary)]">
                    {formatAddressForDisplay(detailOrder.direccionEnvio) || "—"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">{detailOrder.ciudad || "Quito"}, {detailOrder.provincia || "Pichincha"}</p>
                </div>
              </div>
            </div>

            {/* Productos del pedido */}
            <div className="border-t border-[var(--bg-border)] px-6 pb-4 pt-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Productos</p>
              <div className="space-y-2">
                {detailOrder.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface2)] p-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-surface)]">
                      {item.imagenUrl ? <img src={item.imagenUrl} alt={item.nombre} className="h-full w-full object-cover" />
                        : <Package className="m-2 h-6 w-6 text-[var(--text-muted)]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{item.nombre}</p>
                      <p className="text-xs text-[var(--text-muted)]">Talla {item.talla} · ×{item.cantidad}</p>
                    </div>
                    <span className="font-mono font-bold text-[var(--text-primary)]">
                      {formatCurrency(item.precioUnitario * item.cantidad)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between rounded-xl bg-blue-50 dark:bg-blue-950/20 px-4 py-2.5 text-sm font-bold">
                  <span className="text-[var(--text-primary)]">Total del pedido</span>
                  <span className="text-blue-600 dark:text-sky-400">{formatCurrency(detailOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Acciones de estado inline */}
            {(NEXT_ACTIONS[detailOrder.estado] ?? []).length > 0 && (
              <div className="border-t border-[var(--bg-border)] px-6 py-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Avanzar estado</p>
                <div className="flex flex-wrap gap-2">
                  {(NEXT_ACTIONS[detailOrder.estado] ?? []).map(a => (
                    <Button key={a.nextEstado} variant={a.variant} size="sm"
                      isLoading={actionLoading === detailOrder.id}
                      onClick={() => {
                        if (a.nextEstado === "ENVIADO") { setDetailOrder(null); setShipModal({ order: detailOrder, nextEstado: "ENVIADO" }); setGuiaInput(""); return; }
                        handleAdvance(detailOrder, a.nextEstado);
                      }}>
                      {a.icon} {a.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* ── MAPA + TICKET SERVIENTREGA ── */}
            <div className="border-t border-blue-200 dark:border-sky-900/50 p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-[var(--text-primary)]">Ubicación y Ticket Servientrega</p>
                  <p className="text-xs text-[var(--text-muted)]">El mapa muestra la dirección del cliente. Imprime el ticket para pegarlo en el paquete.</p>
                </div>
              </div>
              <ShippingTicket order={detailOrder} />
            </div>
          </div>
        </div>
      )}

      {/* ── Ship modal ── */}
      {shipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-blue-100 dark:border-[#222732] bg-white dark:bg-[#12151c] p-6 shadow-[0_20px_60px_rgba(37,99,235,0.20)]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">Marcar como Enviado</h3>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{shipModal.order.numero} · {shipModal.order.clienteNombre}</p>
              </div>
              <button onClick={() => setShipModal(null)} className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface2)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-sky-400">Número de guía (opcional)</label>
              <input autoFocus value={guiaInput} onChange={e => setGuiaInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleShipConfirm()}
                placeholder="Ej. SERVIENTREGA-0012345"
                className="mt-1.5 h-11 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-blue-400"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
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
