import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Package, UploadCloud, ChevronRight, ShoppingBag, MapPin, Calendar, Ban, Loader2 } from "lucide-react";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import { httpClient } from "@/infrastructure/http/httpClient";
import { toOrder } from "@/infrastructure/adapters/order.adapter";
import type { Order } from "@/domain/entities/Order";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { Button } from "@/presentation/components/ui/Button";
import { formatCurrency, formatDate, orderStatusLabel, orderStatusTone, resolveMediaUrl } from "@/presentation/utils/format";

/* ── Status dot + label — compact ───────────────────────── */
const STATUS_STYLES: Record<string, { dot: string; text: string; bg: string }> = {
  PENDIENTE_DE_PAGO:   { dot: "bg-amber-400",  text: "text-amber-700 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50" },
  COMPROBANTE_ENVIADO: { dot: "bg-sky-400",     text: "text-sky-700 dark:text-sky-400",      bg: "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/50" },
  PAGO_EN_REVISION:    { dot: "bg-sky-400",     text: "text-sky-700 dark:text-sky-400",      bg: "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/50" },
  PAGO_APROBADO:       { dot: "bg-blue-500",    text: "text-blue-700 dark:text-sky-400",     bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50" },
  PAGO_RECHAZADO:      { dot: "bg-red-500",     text: "text-red-700 dark:text-red-400",      bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50" },
  PREPARANDO_PEDIDO:   { dot: "bg-indigo-500",  text: "text-indigo-700 dark:text-indigo-400",bg: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50" },
  ENVIADO:             { dot: "bg-blue-500",    text: "text-blue-700 dark:text-sky-400",     bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50" },
  ENTREGADO:           { dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50" },
  CANCELADO:           { dot: "bg-gray-400",    text: "text-gray-500 dark:text-gray-400",    bg: "bg-gray-100 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/50" },
};

function StatusPill({ estado }: { estado: string }) {
  const s = STATUS_STYLES[estado] ?? STATUS_STYLES["CANCELADO"];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {orderStatusLabel(estado as any)}
    </span>
  );
}

export default function OrdersPage() {
  const [orders, setOrders]       = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter]       = useState<"all" | "active" | "delivered">("all");

  useEffect(() => {
    useCases.getOrders
      .execute()
      .then(setOrders)
      .catch(() => toast.error("No se pudo cargar tu historial de pedidos."))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Spinner full />;

  const filtered = orders.filter((o) => {
    if (filter === "active")    return !["ENTREGADO","CANCELADO"].includes(o.estado);
    if (filter === "delivered") return o.estado === "ENTREGADO";
    return true;
  });

  const activeCount    = orders.filter((o) => !["ENTREGADO","CANCELADO"].includes(o.estado)).length;
  const deliveredCount = orders.filter((o) => o.estado === "ENTREGADO").length;

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="container-app py-8 lg:py-12">

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-500 dark:text-sky-400">
              Mi cuenta
            </p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-[var(--text-primary)] sm:text-4xl">
              Mis <span className="text-blue-600 dark:text-sky-400">pedidos</span>
            </h1>
          </div>

          {/* Filter tabs */}
          {orders.length > 0 && (
            <div className="flex items-center gap-1 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-1">
              {([
                { key: "all",       label: `Todos (${orders.length})` },
                { key: "active",    label: `Activos (${activeCount})` },
                { key: "delivered", label: `Entregados (${deliveredCount})` },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    filter === key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Empty ── */}
        {orders.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-[var(--bg-border)] bg-[var(--bg-surface)] py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-300 dark:text-sky-600">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-[var(--text-primary)]">Aún no tienes pedidos</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Cuando compres, tu historial aparecerá aquí.</p>
            </div>
            <Link to="/catalogo">
              <Button variant="secondary" size="lg">Ir al catálogo</Button>
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--bg-border)] bg-[var(--bg-surface)] py-14 text-center">
            <p className="text-sm text-[var(--text-muted)]">No hay pedidos en esta categoría.</p>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {filtered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onCancelled={(id) => {
                  setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, estado: "CANCELADO" } : o)));
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─── Compact order card ──────────────────────────────────── */
function OrderCard({ order, onCancelled }: { order: Order; onCancelled?: (id: number) => void }) {
  const canUpload  = order.estado === "PENDIENTE_DE_PAGO" || order.estado === "PAGO_RECHAZADO";
  const canCancel  = ["PENDIENTE_DE_PAGO", "COMPROBANTE_ENVIADO", "PAGO_RECHAZADO"].includes(order.estado);
  const firstItem  = order.items?.[0];
  const imgSrc     = resolveMediaUrl(firstItem?.imagenUrl);
  const extraItems = (order.items?.length ?? 0) - 1;
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.")) return;
    setCancelling(true);
    try {
      await useCases.cancelOrder.execute(order.id);
      toast.success("Pedido cancelado correctamente.");
      if (onCancelled) onCancelled(order.id);
    } catch (err: any) {
      toast.error(err?.message || "No se pudo cancelar el pedido.");
    } finally {
      setCancelling(false);
    }
  };

  /* Left accent color */
  const accentLeft =
    order.estado === "ENTREGADO"      ? "border-l-emerald-500" :
    order.estado === "ENVIADO"        ? "border-l-blue-500"    :
    order.estado === "PAGO_RECHAZADO" ? "border-l-red-500"     :
    order.estado === "CANCELADO"      ? "border-l-gray-400"    :
    "border-l-sky-500";

  return (
    <li className={`relative overflow-hidden rounded-2xl border border-[var(--card-border)] border-l-4 ${accentLeft} bg-[var(--card-bg)] shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5`}>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">

        {/* Thumbnail */}
        <div className="relative shrink-0 self-start sm:self-center">
          <div className="h-14 w-14 overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface2)]">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={firstItem?.nombre ?? ""}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
                <Package className="h-6 w-6" />
              </div>
            )}
          </div>
          {extraItems > 0 && (
            <div className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white">
              +{extraItems}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
          {/* Top row: number + status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-[var(--text-primary)]">
              {order.numero}
            </span>
            <StatusPill estado={order.estado} />
            {canUpload && (
              <span className="animate-pulse rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                Acción requerida
              </span>
            )}
          </div>

          {/* Product name */}
          {firstItem && (
            <p className="truncate text-sm text-[var(--text-secondary)]">{firstItem.nombre}</p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(order.creadoEn)}
            </span>
            {order.ciudad && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {order.ciudad}
              </span>
            )}
            {order.items.length > 1 && (
              <span>{order.items.length} productos</span>
            )}
            {order.estado === "ENVIADO" && order.numeroGuia && (
              <span className="font-mono font-semibold text-blue-600 dark:text-sky-400">
                Guía: {order.numeroGuia}
              </span>
            )}
          </div>
        </div>

        {/* Right: price + actions */}
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
          <span className="font-display text-base font-black text-[var(--text-primary)]">
            {formatCurrency(order.total)}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Cancel — when actionable */}
            {canCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                title="Cancelar pedido"
                className="inline-flex items-center gap-1 rounded-full border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-2.5 py-1 text-[11px] font-semibold text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-950/50 disabled:opacity-50"
              >
                {cancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
                Cancelar
              </button>
            )}

            {/* Upload — only when action required */}
            {canUpload && (
              <Link to={`/pedidos/${order.id}`}>
                <button className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-blue-700">
                  <UploadCloud className="h-3 w-3" />
                  Pagar
                </button>
              </Link>
            )}

            {/* Ver detalle — always */}
            <Link to={`/pedidos/${order.id}`}>
              <button className="inline-flex items-center gap-0.5 rounded-full border border-[var(--bg-border)] bg-[var(--bg-surface2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] transition-colors hover:border-blue-300 dark:hover:border-sky-700 hover:text-blue-700 dark:hover:text-sky-400">
                Ver <ChevronRight className="h-3 w-3" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}
