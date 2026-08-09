import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Order, OrderStatus } from "@/domain/entities/Order";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button } from "@/presentation/components/ui/Button";
import { formatCurrency, formatDate, orderStatusLabel, orderStatusTone } from "@/presentation/utils/format";
import { toast } from "sonner";
import {
  ArrowLeft,
  ShoppingBag,
  Search,
  Truck,
  PackageCheck,
  CheckCircle2,
  ChevronDown,
  X,
  Boxes,
} from "lucide-react";

// Which statuses the admin can advance a given order to
const NEXT_ACTIONS: Record<
  string,
  { label: string; nextEstado: string; icon: React.ReactNode; variant: "secondary" | "outline" | "ghost" }[]
> = {
  PAGO_APROBADO: [
    { label: "Marcar Preparando", nextEstado: "PREPARANDO_PEDIDO", icon: <Boxes className="h-3.5 w-3.5" />, variant: "outline" },
  ],
  PREPARANDO_PEDIDO: [
    { label: "Marcar Enviado", nextEstado: "ENVIADO", icon: <Truck className="h-3.5 w-3.5" />, variant: "outline" },
  ],
  ENVIADO: [
    { label: "Confirmar Entrega", nextEstado: "ENTREGADO", icon: <CheckCircle2 className="h-3.5 w-3.5" />, variant: "secondary" },
  ],
};

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
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

  // Modal for entering guía when shipping
  const [shipModal, setShipModal] = useState<{ order: Order; nextEstado: string } | null>(null);
  const [guiaInput, setGuiaInput] = useState("");

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await useCases.getSellerOrders.execute(); // fetches all orders (no vendedorId filter)
      setOrders(res);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search ||
      String(o.id).includes(search) ||
      o.numero?.toLowerCase().includes(search.toLowerCase()) ||
      o.clienteNombre?.toLowerCase().includes(search.toLowerCase()) ||
      o.ciudad?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "TODOS" || o.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdvance = async (order: Order, nextEstado: string) => {
    // If advancing to ENVIADO, show modal to capture guía number
    if (nextEstado === "ENVIADO") {
      setShipModal({ order, nextEstado });
      setGuiaInput("");
      return;
    }
    await doAdvance(order.id, nextEstado);
  };

  const doAdvance = async (orderId: number, nextEstado: string, extra?: Record<string, any>) => {
    setActionLoading(orderId);
    try {
      const updated = await useCases.updateOrderStatus.execute(orderId, nextEstado, extra);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, estado: updated.estado, numeroGuia: updated.numeroGuia } : o))
      );
      if (nextEstado === "ENTREGADO") {
        toast.success(`Pedido #${orderId} entregado. Comisión de $4.00 acreditada al vendedor.`);
      } else {
        toast.success(`Pedido #${orderId} → ${orderStatusLabel(nextEstado as OrderStatus)}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "No se pudo cambiar el estado del pedido.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleShipConfirm = async () => {
    if (!shipModal) return;
    setShipModal(null);
    await doAdvance(shipModal.order.id, "ENVIADO", { numero_guia: guiaInput.trim() });
  };

  // Stats
  const statsCounts = {
    PAGO_APROBADO: orders.filter((o) => o.estado === "PAGO_APROBADO").length,
    PREPARANDO_PEDIDO: orders.filter((o) => o.estado === "PREPARANDO_PEDIDO").length,
    ENVIADO: orders.filter((o) => o.estado === "ENVIADO").length,
    ENTREGADO: orders.filter((o) => o.estado === "ENTREGADO").length,
  };

  return (
    <div className="container-app py-10">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/admin"
          className="chip chip-outline flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-all hover:scale-[1.02]"
        >
          <ArrowLeft className="h-3 w-3" /> Dashboard
        </Link>
        <span className="text-muted-t text-xs">/</span>
        <span className="chip chip-accent text-[11px] font-bold uppercase tracking-wider">
          <ShoppingBag className="h-3 w-3" /> Gestión de Pedidos
        </span>
      </div>

      {/* Header */}
      <div className="mt-6">
        <h1 className="font-display text-4xl sm:text-5xl">
          <span className="text-gradient-ink">Gestión de</span>{" "}
          <span className="text-gradient-brand">Pedidos</span>
        </h1>
        <p className="mt-2 text-sm text-secondary">
          Avanza los pedidos por cada etapa del flujo: Preparando → Enviado → Entregado.
        </p>
      </div>

      {/* Pipeline stats */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { key: "PAGO_APROBADO", label: "Por preparar", color: "bg-amber-50 border-amber-200 text-amber-700" },
          { key: "PREPARANDO_PEDIDO", label: "Preparando", color: "bg-blue-50 border-blue-200 text-blue-700" },
          { key: "ENVIADO", label: "En camino", color: "bg-sky-50 border-sky-200 text-sky-700" },
          { key: "ENTREGADO", label: "Entregados", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? "TODOS" : key)}
            className={`rounded-2xl border p-4 text-left transition-all hover:scale-[1.02] ${color} ${
              statusFilter === key ? "ring-2 ring-current ring-offset-1" : ""
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</p>
            <p className="mt-1 font-display text-3xl font-black">
              {statsCounts[key as keyof typeof statsCounts]}
            </p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-t" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ID, cliente, ciudad..."
            className="h-10 w-full rounded-xl border border-theme bg-surf pl-9 pr-3 text-sm text-primary placeholder:text-muted-t outline-none focus:border-sky-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-theme bg-surf px-3 text-sm font-semibold text-primary outline-none focus:border-sky-400"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {(search || statusFilter !== "TODOS") && (
          <button
            onClick={() => { setSearch(""); setStatusFilter("TODOS"); }}
            className="flex items-center gap-1.5 rounded-xl border border-theme px-3 py-2 text-xs font-semibold text-muted-t hover:bg-surf2 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-theme bg-surf shadow-card">
        {isLoading ? (
          <div className="p-16 text-center text-secondary">
            <ShoppingBag className="mx-auto h-10 w-10 animate-pulse text-muted-t" />
            <p className="mt-3 font-display text-xl">Cargando pedidos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-secondary">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-t" />
            <p className="mt-3 font-display text-xl">No hay pedidos que coincidan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-theme text-xs font-bold uppercase tracking-wider text-muted-t">
                <tr>
                  <th className="px-5 py-4">Pedido</th>
                  <th className="px-5 py-4">Cliente</th>
                  <th className="px-5 py-4">Vendedor</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {filtered.map((o) => {
                  const actions = NEXT_ACTIONS[o.estado] ?? [];
                  return (
                    <tr key={o.id} className="transition-colors hover:bg-surf2">
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-primary">{o.numero || `#${o.id}`}</span>
                        {o.numeroGuia && (
                          <p className="mt-0.5 text-[10px] font-mono text-muted-t">Guía: {o.numeroGuia}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-primary">{o.clienteNombre || "Cliente"}</p>
                        <p className="text-xs text-muted-t">{o.ciudad || ""}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-secondary">
                        {o.vendedorNombre || <span className="text-muted-t">—</span>}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-primary">
                        {formatCurrency(o.total || o.montoTotal || 0)}
                      </td>
                      <td className="px-5 py-4 text-xs text-secondary whitespace-nowrap">
                        {formatDate(o.creadoEn)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={orderStatusTone(o.estado)}>
                          {orderStatusLabel(o.estado)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {actions.length > 0 ? (
                          <div className="flex items-center justify-end gap-2">
                            {actions.map((a) => (
                              <Button
                                key={a.nextEstado}
                                variant={a.variant}
                                size="sm"
                                isLoading={actionLoading === o.id}
                                onClick={() => handleAdvance(o, a.nextEstado)}
                                className="flex items-center gap-1.5"
                              >
                                {a.icon}
                                {a.label}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-t">
                            {o.estado === "ENTREGADO" ? (
                              <span className="inline-flex items-center gap-1 text-xs text-sky-600"><CheckCircle2 className="h-4 w-4" /> Completado</span>
                            ) : (
                              "—"
                            )}
                          </span>
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

      {/* Ship modal — capture guía number */}
      {shipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-theme bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-2xl text-primary">Marcar como Enviado</h3>
                <p className="text-xs text-muted-t">
                  Pedido {shipModal.order.numero || `#${shipModal.order.id}`} ·{" "}
                  {shipModal.order.clienteNombre}
                </p>
              </div>
              <button
                onClick={() => setShipModal(null)}
                className="rounded-lg p-1 text-muted-t hover:bg-surf2 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-t">
                Número de guía de despacho
              </label>
              <input
                autoFocus
                value={guiaInput}
                onChange={(e) => setGuiaInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleShipConfirm()}
                placeholder="Ej. SERVIENTREGA-0012345"
                className="mt-2 h-11 w-full rounded-xl border border-theme bg-surf2 px-4 text-sm text-primary outline-none focus:border-sky-400"
              />
              <p className="mt-1.5 text-xs text-muted-t">
                La guía se mostrará al cliente. Puedes dejarlo vacío si aún no la tienes.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" size="lg" onClick={() => setShipModal(null)}>
                Cancelar
              </Button>
              <Button
                variant="secondary"
                size="lg"
                isLoading={actionLoading === shipModal.order.id}
                onClick={handleShipConfirm}
                className="flex items-center gap-2"
              >
                <Truck className="h-4 w-4" />
                Confirmar envío
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
