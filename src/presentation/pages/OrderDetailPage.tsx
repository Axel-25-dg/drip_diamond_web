import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { UploadCloud, CheckCircle2, XCircle, CreditCard, MessageSquare, ArrowLeft, Package, Ban } from "lucide-react";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Order, UploadComprobanteMetadata } from "@/domain/entities/Order";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button } from "@/presentation/components/ui/Button";
import {
  formatAddressForDisplay, formatCurrency, formatDate,
  orderStatusLabel, orderStatusTone, resolveMediaUrl,
} from "@/presentation/utils/format";

const ORDER_STEPS = [
  "PENDIENTE_DE_PAGO",
  "COMPROBANTE_ENVIADO",
  "PAGO_APROBADO",
  "PREPARANDO_PEDIDO",
  "ENVIADO",
  "ENTREGADO",
] as const;

const STEP_LABELS: Record<string, string> = {
  PENDIENTE_DE_PAGO:   "Pendiente",
  COMPROBANTE_ENVIADO: "Comprobante",
  PAGO_APROBADO:       "Pago",
  PREPARANDO_PEDIDO:   "Preparando",
  ENVIADO:             "Enviado",
  ENTREGADO:           "Entregado",
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder]             = useState<Order | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [bancoOrigen, setBancoOrigen]           = useState("Banco Pichincha");
  const [numeroReferencia, setNumeroReferencia] = useState("");
  const [montoDeclarado, setMontoDeclarado]     = useState<number | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    return useCases.getOrderDetail
      .execute(Number(id))
      .then(setOrder)
      .catch(() => toast.error("No se pudo cargar el pedido."));
  }, [id]);

  useEffect(() => { setIsLoading(true); load()?.finally(() => setIsLoading(false)); }, [load]);
  useEffect(() => { if (order?.total != null) setMontoDeclarado(order.total); }, [order?.total]);

  const handleUpload = async (file: File, metadata: UploadComprobanteMetadata) => {
    if (!order) return;
    setIsUploading(true);
    try {
      const updated = await useCases.uploadComprobante.execute(order.id, file, {
        bancoOrigen:      metadata.bancoOrigen?.trim()      || bancoOrigen.trim(),
        numeroReferencia: metadata.numeroReferencia?.trim() || numeroReferencia.trim(),
        montoDeclarado:   metadata.montoDeclarado ?? montoDeclarado ?? order.total,
      });
      setOrder(updated);
      toast.success("Comprobante enviado. Te avisaremos cuando sea verificado.");
    } catch (err: any) {
      toast.error(err?.message || "No se pudo subir el comprobante.");
    } finally {
      setIsUploading(false);
    }
  };

  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!order) return;
    if (!confirm("¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.")) return;
    setIsCancelling(true);
    try {
      const { data } = await import("@/infrastructure/http/httpClient").then(m =>
        m.httpClient.post<any>(`/pedidos/${order.id}/cancelar/`)
      );
      const safeUnwrap = (d: any) => d?.data ?? d;
      const updated = await import("@/infrastructure/adapters/order.adapter").then(m =>
        m.toOrder(safeUnwrap(data))
      );
      setOrder(updated);
      toast.success("Pedido cancelado correctamente.");
    } catch (err: any) {
      toast.error(err?.message || "No se pudo cancelar el pedido.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) return <Spinner full />;
  if (!order)    return null;

  const canUploadComprobante = order.estado === "PENDIENTE_DE_PAGO" || order.estado === "PAGO_RECHAZADO";
  const currentStepIndex     = ORDER_STEPS.indexOf(order.estado as (typeof ORDER_STEPS)[number]);
  const isWaitingForReview   = order.estado === "COMPROBANTE_ENVIADO" || order.estado === "PAGO_EN_REVISION";

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="container-app py-6 sm:py-8 lg:py-10">

        {/* Back */}
        <Link
          to="/pedidos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Mis pedidos
        </Link>

        {/* Header */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[var(--text-primary)] sm:text-3xl">
              Pedido <span className="text-blue-600 dark:text-sky-400">{order.numero}</span>
            </h1>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">{formatDate(order.creadoEn)}</p>
          </div>
          <Badge tone={orderStatusTone(order.estado)} className="w-fit">
            {orderStatusLabel(order.estado)}
          </Badge>
        </div>

        {/* Progress bar */}
        {currentStepIndex >= 0 && order.estado !== "CANCELADO" && order.estado !== "PAGO_RECHAZADO" && (
          <div className="mt-6 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {ORDER_STEPS.map((step, i) => (
              <div key={step} className="min-w-[60px] flex-1">
                <div className={`h-1.5 rounded-full transition-colors ${
                  i < currentStepIndex   ? "bg-blue-600 dark:bg-sky-500" :
                  i === currentStepIndex ? "bg-sky-400 dark:bg-sky-400"  :
                  "bg-[var(--bg-border)]"
                }`} />
                <p className="mt-1.5 truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {STEP_LABELS[step]}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-5">

            {/* ── Productos ── */}
            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 font-display text-lg font-bold text-[var(--text-primary)]">Productos</h2>
              <ul className="flex flex-col divide-y divide-[var(--bg-border)]">
                {order.items.map((item) => (
                  <li key={item.id} className="flex gap-4 py-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface2)]">
                      {resolveMediaUrl(item.imagenUrl) ? (
                        <img src={resolveMediaUrl(item.imagenUrl)!} alt={item.nombre} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{item.nombre}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        Talla {item.talla} · {item.color} · ×{item.cantidad}
                      </p>
                    </div>
                    <span className="self-center font-bold text-[var(--text-primary)]">
                      {formatCurrency(item.precioUnitario * item.cantidad)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── Cliente y envío ── */}
            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 font-display text-lg font-bold text-[var(--text-primary)]">Cliente y envío</h2>
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-[var(--text-primary)]">{order.clienteNombre || "Cliente"}</p>
                <p className="text-[var(--text-secondary)]">{formatAddressForDisplay(order.direccionEnvio) || "Dirección de cliente"}</p>
                <p className="text-[var(--text-secondary)]">{order.ciudad || "Quito"}, {order.provincia || "Pichincha"}</p>
                <p className="text-[var(--text-muted)]">Tel: {order.telefonoContacto || "Sin teléfono registrado"}</p>
                {order.vendedorNombre && (
                  <p className="mt-2 text-xs font-medium text-blue-500 dark:text-sky-400">
                    Vendedor: {order.vendedorNombre}
                  </p>
                )}
              </div>
            </section>

            {/* ── Datos bancarios ── */}
            <section className="rounded-2xl border border-blue-200 dark:border-sky-900/50 bg-[var(--card-bg)] p-6 shadow-[var(--shadow-card)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Datos para la Transferencia</h2>
                  <p className="text-xs font-semibold text-blue-500 dark:text-sky-400">Banco Pichincha</p>
                </div>
              </div>

              <div className="grid gap-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 p-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Banco</span>
                  <span className="mt-0.5 block font-bold text-[var(--text-primary)]">Banco Pichincha</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">N° de Cuenta</span>
                  <span className="mt-0.5 block font-mono text-lg font-bold text-blue-600 dark:text-sky-400">2213521473</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Titular</span>
                  <span className="mt-0.5 block font-bold text-[var(--text-primary)]">Danny Alexander Guaman Pillajo</span>
                </div>
              </div>

              {/* State-specific banners */}
              <div className="mt-4 space-y-3">
                {order.estado === "PENDIENTE_DE_PAGO" && (
                  <div className="flex items-start gap-3 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 p-4 text-sm">
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-blue-500 dark:text-sky-400" />
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Tu pedido está pendiente de pago</p>
                      <p className="mt-1 text-[var(--text-secondary)]">Realiza la transferencia y sube el comprobante para que validemos tu pago.</p>
                    </div>
                  </div>
                )}
                {(order.estado === "COMPROBANTE_ENVIADO" || order.estado === "PAGO_EN_REVISION") && (
                  <div className="flex items-center gap-3 rounded-xl border border-sky-100 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-950/20 p-4 text-sm">
                    <UploadCloud className="h-4 w-4 shrink-0 text-sky-500" />
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Comprobante recibido</p>
                      <p className="mt-0.5 text-[var(--text-secondary)]">Tu comprobante está en revisión. Te notificaremos cuando se apruebe.</p>
                    </div>
                  </div>
                )}
                {order.estado === "PAGO_APROBADO" && (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Pago aprobado</p>
                      <p className="mt-0.5 text-[var(--text-secondary)]">Tu pedido está siendo preparado para envío.</p>
                    </div>
                  </div>
                )}
                {order.estado === "ENVIADO" && (
                  <div className="flex items-center gap-3 rounded-xl border border-blue-100 dark:border-sky-900/50 bg-blue-50 dark:bg-sky-950/20 p-4 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-500 dark:text-sky-400" />
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Pedido enviado</p>
                      {order.numeroGuia && (
                        <p className="mt-0.5 text-[var(--text-secondary)]">
                          Guía: <span className="font-mono font-bold text-blue-600 dark:text-sky-400">{order.numeroGuia}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {order.estado === "ENTREGADO" && (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">¡Pedido entregado!</p>
                      <p className="mt-0.5 text-[var(--text-secondary)]">Gracias por tu compra. ¡Esperamos que disfrutes tus zapatillas!</p>
                    </div>
                  </div>
                )}
                {order.estado === "PAGO_RECHAZADO" && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 text-sm">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Pago rechazado</p>
                      <p className="mt-0.5 text-[var(--text-secondary)]">Tu comprobante no pudo ser verificado. Por favor sube un nuevo comprobante con los datos correctos o contáctanos.</p>
                    </div>
                  </div>
                )}
                {order.estado === "CANCELADO" && (
                  <div className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4 text-sm">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Pedido cancelado</p>
                      <p className="mt-0.5 text-[var(--text-secondary)]">Este pedido fue cancelado. Si tienes dudas contáctanos por WhatsApp.</p>
                    </div>
                  </div>
                )}
              </div>

              <p className="mt-4 text-xs text-[var(--text-muted)]">
                ¿Necesitas ayuda? Escríbenos por WhatsApp:{" "}
                <a href="https://wa.me/593999001471" target="_blank" rel="noreferrer"
                  className="font-semibold text-blue-600 dark:text-sky-400 hover:underline">
                  +593 999 001 471
                </a>
              </p>
            </section>

            {/* ── Comprobante ── */}
            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 font-display text-lg font-bold text-[var(--text-primary)]">Comprobante de pago</h2>

              {order.comprobanteUrl && !canUploadComprobante ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Comprobante recibido {isWaitingForReview ? "y en proceso de revisión." : "y procesado."}
                </div>
              ) : canUploadComprobante ? (
                <div className="space-y-4">
                  <div className="grid gap-3 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface2)] p-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400">
                        Banco de origen
                      </label>
                      <input
                        value={bancoOrigen}
                        onChange={(e) => setBancoOrigen(e.target.value)}
                        placeholder="Banco Pichincha"
                        className="mt-1 h-10 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--input-border-focus)] focus:shadow-[var(--ring-focus)]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400">
                        Número de referencia
                      </label>
                      <input
                        value={numeroReferencia}
                        onChange={(e) => setNumeroReferencia(e.target.value)}
                        placeholder="TRX-001"
                        className="mt-1 h-10 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--input-border-focus)] focus:shadow-[var(--ring-focus)]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400">
                        Monto declarado
                      </label>
                      <input
                        type="number" min="0" step="0.01"
                        value={montoDeclarado ?? ""}
                        onChange={(e) => setMontoDeclarado(e.target.value ? Number(e.target.value) : null)}
                        className="mt-1 h-10 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--input-border-focus)] focus:shadow-[var(--ring-focus)]"
                      />
                    </div>
                    <p className="sm:col-span-2 text-xs text-[var(--text-muted)]">
                      Estos datos ayudan al contador a validar el comprobante más rápido.
                    </p>
                  </div>
                  <UploadBox
                    isUploading={isUploading}
                    onUpload={handleUpload}
                    metadata={{ bancoOrigen, numeroReferencia, montoDeclarado }}
                  />
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No aplica para el estado actual del pedido.</p>
              )}
            </section>
          </div>

          {/* ── Aside: Resumen ── */}
          <aside className="h-fit rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-card)]">
            <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">Resumen del pedido</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Subtotal</span>
                <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Envío</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {order.costoEnvio != null ? formatCurrency(order.costoEnvio) : "Por definir"}
                </span>
              </div>
              <div className="mt-2 flex justify-between border-t border-[var(--bg-border)] pt-3 text-base font-bold">
                <span className="text-[var(--text-primary)]">Total</span>
                <span className="text-blue-600 dark:text-sky-400">{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="mt-5 space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface2)]">
                    {resolveMediaUrl(item.imagenUrl) ? (
                      <img src={resolveMediaUrl(item.imagenUrl)!} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="m-1.5 h-5 w-5 text-[var(--text-muted)]" />
                    )}
                  </div>
                  <span className="flex-1 truncate text-[var(--text-secondary)]">{item.nombre}</span>
                  <span className="font-mono font-semibold text-[var(--text-primary)]">×{item.cantidad}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Link to="/pedidos">
                <Button variant="outline" fullWidth size="sm">
                  <ArrowLeft className="h-3.5 w-3.5" /> Volver a mis pedidos
                </Button>
              </Link>

              {/* Cancelar pedido — solo si está en estados cancelables */}
              {["PENDIENTE_DE_PAGO", "COMPROBANTE_ENVIADO", "PAGO_RECHAZADO"].includes(order.estado) && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 transition-all hover:border-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 disabled:opacity-50"
                >
                  {isCancelling
                    ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" /> Cancelando...</>
                    : <><Ban className="h-4 w-4" /> Cancelar pedido</>
                  }
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ─── Upload box ─────────────────────────────────────────── */
function UploadBox({
  onUpload, isUploading, metadata,
}: {
  onUpload: (file: File, metadata: UploadComprobanteMetadata) => void;
  isUploading: boolean;
  metadata: UploadComprobanteMetadata;
}) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-blue-200 dark:border-sky-800 bg-blue-50/40 dark:bg-sky-950/10 px-6 py-10 text-center transition-colors hover:border-blue-400 dark:hover:border-sky-500 hover:bg-blue-50 dark:hover:bg-sky-950/20">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-sky-900/40 text-blue-500 dark:text-sky-400">
        <UploadCloud className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {fileName ?? "Sube tu comprobante"}
        </p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">JPG, PNG o WEBP · máx. 5 MB</p>
      </div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) { setFileName(file.name); onUpload(file, metadata); }
        }}
      />
      <Button type="button" variant="secondary" size="sm" isLoading={isUploading} className="pointer-events-none">
        Seleccionar archivo
      </Button>
    </label>
  );
}
