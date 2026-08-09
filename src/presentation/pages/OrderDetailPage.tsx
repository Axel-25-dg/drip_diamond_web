import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { UploadCloud, CheckCircle2, CreditCard, MessageSquare } from "lucide-react";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Order, UploadComprobanteMetadata } from "@/domain/entities/Order";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button } from "@/presentation/components/ui/Button";
import { formatAddressForDisplay, formatCurrency, formatDate, orderStatusLabel, orderStatusTone, resolveMediaUrl } from "@/presentation/utils/format";

const ORDER_STEPS = [
  "PENDIENTE_DE_PAGO",
  "COMPROBANTE_ENVIADO",
  "PAGO_APROBADO",
  "PREPARANDO_PEDIDO",
  "ENVIADO",
  "ENTREGADO",
] as const;

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [bancoOrigen, setBancoOrigen] = useState("Banco Pichincha");
  const [numeroReferencia, setNumeroReferencia] = useState("");
  const [montoDeclarado, setMontoDeclarado] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    return useCases.getOrderDetail
      .execute(Number(id))
      .then(setOrder)
      .catch(() => toast.error("No se pudo cargar el pedido."));
  }, [id]);

  useEffect(() => {
    setIsLoading(true);
    load()?.finally(() => setIsLoading(false));
  }, [load]);

  useEffect(() => {
    if (order?.total != null) {
      setMontoDeclarado(order.total);
    }
  }, [order?.total]);

  const handleUpload = async (file: File, metadata: UploadComprobanteMetadata) => {
    if (!order) return;
    setIsUploading(true);
    try {
      const updated = await useCases.uploadComprobante.execute(order.id, file, {
        bancoOrigen: metadata.bancoOrigen?.trim() || bancoOrigen.trim(),
        numeroReferencia: metadata.numeroReferencia?.trim() || numeroReferencia.trim(),
        montoDeclarado: metadata.montoDeclarado ?? montoDeclarado ?? order.total,
      });
      setOrder(updated);
      toast.success("Comprobante enviado. Te avisaremos cuando sea verificado.");
    } catch (err: any) {
      toast.error(err?.message || "No se pudo subir el comprobante.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <Spinner full />;
  if (!order) return null;

  const canUploadComprobante = order.estado === "PENDIENTE_DE_PAGO" || order.estado === "PAGO_RECHAZADO";
  const currentStepIndex = ORDER_STEPS.indexOf(order.estado as (typeof ORDER_STEPS)[number]);
  const isWaitingForReview = order.estado === "COMPROBANTE_ENVIADO" || order.estado === "PAGO_EN_REVISION";

  return (
    <div className="container-app py-8 lg:py-12">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl">Pedido {order.numero}</h1>
          <p className="text-sm text-ink/50">{formatDate(order.creadoEn)}</p>
        </div>
        <Badge tone={orderStatusTone(order.estado)} className="w-fit">
          {orderStatusLabel(order.estado)}
        </Badge>
      </div>

      {currentStepIndex >= 0 && order.estado !== "CANCELADO" && order.estado !== "PAGO_RECHAZADO" && (
        <div className="mb-10 hidden gap-1 sm:flex">
          {ORDER_STEPS.map((step, i) => (
            <div key={step} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= currentStepIndex ? "bg-ink" : "bg-black/10"}`} />
              <p className="mt-2 text-[10px] font-semibold uppercase text-ink/40">{orderStatusLabel(step).split(" ")[0]}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl bg-white p-6">
            <h2 className="mb-4 font-display text-xl">Productos</h2>
            <ul className="flex flex-col divide-y-2 divide-ink/5">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-black/5">
                    {resolveMediaUrl(item.imagenUrl) && (
                      <img src={resolveMediaUrl(item.imagenUrl)!} alt={item.nombre} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-sm font-semibold">{item.nombre}</p>
                    <p className="text-xs text-ink/50">
                      Talla {item.talla} · {item.color} · x{item.cantidad}
                    </p>
                  </div>
                  <span className="self-center font-semibold">{formatCurrency(item.precioUnitario * item.cantidad)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-white p-6">
            <h2 className="mb-3 font-display text-xl">Cliente y envío</h2>
            <p className="text-sm font-semibold text-ink">{order.clienteNombre || "Cliente Drip"}</p>
            <p className="mt-1 text-sm text-ink/70">{formatAddressForDisplay(order.direccionEnvio) || "Dirección de cliente"}</p>
            <p className="text-sm text-ink/70">
              {order.ciudad || "Quito"}, {order.provincia || "Pichincha"}
            </p>
            <p className="text-sm text-ink/70">Tel: {order.telefonoContacto || "Sin teléfono registrado"}</p>
            {order.vendedorNombre && <p className="mt-2 text-sm text-ink/50">Vendedor: {order.vendedorNombre}</p>}
          </section>

          <section className="rounded-2xl border border-sky-200 bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 font-bold text-lg shadow-sm">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl text-ink">Datos para la Transferencia</h2>
                <p className="text-xs text-sky-600 font-semibold">Banco Pichincha</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 rounded-xl bg-slate-50 p-4 text-sm">
              <div>
                <span className="text-[11px] text-ink/60 font-semibold uppercase tracking-wider block">Banco</span>
                <span className="font-bold text-ink">Banco Pichincha</span>
              </div>
              <div>
                <span className="text-[11px] text-ink/60 font-semibold uppercase tracking-wider block">N° de Cuenta</span>
                <span className="font-mono font-bold text-sky-600 text-base">2213521473</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[11px] text-ink/60 font-semibold uppercase tracking-wider block">Titular</span>
                <span className="font-bold text-ink">Danny Alexander Guaman Pillajo</span>
              </div>
            </div>

            {/* Dynamic guidance depending on order state */}
            <div className="mt-4">
              {order.estado === "PENDIENTE_DE_PAGO" && (
                <div className="rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-sky-600" />
                    <div>
                      <p className="font-semibold text-ink">Tu pedido está pendiente de pago</p>
                      <p className="mt-1 text-ink/70">Realiza la transferencia y sube el comprobante para que validemos tu pago.</p>
                      <p className="mt-2 text-xs text-ink/60">Si pagaste con un vendedor, envía también una copia al número de contacto.</p>
                    </div>
                  </div>
                </div>
              )}

              {(order.estado === "COMPROBANTE_ENVIADO" || order.estado === "PAGO_EN_REVISION") && (
                <div className="rounded-xl border border-ink/10 bg-white p-4 text-sm">
                  <div className="flex items-center gap-3">
                    <UploadCloud className="h-5 w-5 text-sky-600" />
                    <div>
                      <p className="font-semibold text-ink">Comprobante recibido</p>
                      <p className="mt-1 text-ink/70">Tu comprobante está en revisión. Te notificaremos cuando el pago sea aprobado.</p>
                    </div>
                  </div>
                </div>
              )}

              {order.estado === "PAGO_APROBADO" && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-ink">Pago aprobado</p>
                      <p className="mt-1 text-ink/70">Gracias — tu pedido está siendo preparado para envío.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-xs text-ink/70">
              <div className="font-semibold">¿Cómo subir tu comprobante?</div>
              <div className="mt-1">Sube tu comprobante desde <strong>Mis pedidos</strong> en la entrada correspondiente a este pedido. Además, si fuiste atendido por un vendedor, envíale también el comprobante para su registro.</div>
              <div className="mt-2">Si no fuiste atendido por un vendedor, sube tu comprobante en <strong>Mis pedidos</strong> y, si deseas, notifícanos por WhatsApp: <a href="https://wa.me/593999001471?text=Hola,%20adjunto%20comprobante%20para%20el%20pedido%20" target="_blank" rel="noreferrer" className="font-semibold text-sky-600 underline">+593999001471</a>.</div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6">
            <h2 className="mb-3 font-display text-xl">Comprobante de pago</h2>
            {order.comprobanteUrl && !canUploadComprobante ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-5 w-5" />
                  Comprobante recibido y en proceso de revisión.
                </div>
                {isWaitingForReview && (
                  <p className="text-sm text-ink/60">
                    El equipo de contabilidad revisará tu comprobante y luego avanzará el pedido al siguiente estado.
                  </p>
                )}
              </div>
            ) : canUploadComprobante ? (
              <div className="space-y-3">
                <div className="grid gap-3 rounded-xl border border-ink/10 bg-ink/5 p-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-ink/50">Banco de origen</label>
                    <input
                      value={bancoOrigen}
                      onChange={(e) => setBancoOrigen(e.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-ink/10 bg-white px-3 text-sm outline-none focus:border-sky-500"
                      placeholder="Banco Pichincha"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-ink/50">Número de referencia</label>
                    <input
                      value={numeroReferencia}
                      onChange={(e) => setNumeroReferencia(e.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-ink/10 bg-white px-3 text-sm outline-none focus:border-sky-500"
                      placeholder="TRX-001"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-ink/50">Monto declarado</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={montoDeclarado ?? ""}
                      onChange={(e) => setMontoDeclarado(e.target.value ? Number(e.target.value) : null)}
                      className="mt-1 h-10 w-full rounded-lg border border-ink/10 bg-white px-3 text-sm outline-none focus:border-sky-500"
                    />
                  </div>
                  <p className="sm:col-span-2 text-xs text-ink/50">
                    Estos datos ayudan al contador a validar el comprobante de forma más rápida.
                  </p>
                </div>
                <UploadBox isUploading={isUploading} onUpload={handleUpload} metadata={{ bancoOrigen, numeroReferencia, montoDeclarado }} />
                <p className="text-xs text-ink/50">
                  Sube el comprobante para iniciar la revisión. El contador aprobará o rechazará el pago y luego el pedido avanzará al siguiente paso.
                </p>
              </div>
            ) : (
              <p className="text-sm text-ink/50">No aplica para el estado actual del pedido.</p>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-2xl bg-white p-6">
          <h3 className="font-display text-xl">Resumen</h3>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-ink/60">
              <span>Subtotal</span>
              <span className="font-semibold text-ink">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink/60">
              <span>Envío</span>
              <span className="font-semibold text-ink">
                {order.costoEnvio != null ? formatCurrency(order.costoEnvio) : "Por definir"}
              </span>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function UploadBox({ onUpload, isUploading, metadata }: { onUpload: (file: File, metadata: UploadComprobanteMetadata) => void; isUploading: boolean; metadata: UploadComprobanteMetadata }) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-ink/20 px-6 py-10 text-center transition-colors hover:border-ink">
      <UploadCloud className="h-8 w-8 text-ink/40" />
      <span className="text-sm font-semibold">{fileName ?? "Sube tu comprobante (JPG, PNG o WEBP, máx. 5MB)"}</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setFileName(file.name);
            onUpload(file, metadata);
          }
        }}
      />
      <Button type="button" variant="outline" size="sm" isLoading={isUploading} className="pointer-events-none mt-2">
        Seleccionar archivo
      </Button>
    </label>
  );
}
