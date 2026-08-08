import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Order } from "@/domain/entities/Order";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button } from "@/presentation/components/ui/Button";
import { formatCurrency, formatDate, orderStatusLabel, orderStatusTone, resolveMediaUrl } from "@/presentation/utils/format";

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

  const handleUpload = async (file: File) => {
    if (!order) return;
    setIsUploading(true);
    try {
      const updated = await useCases.uploadComprobante.execute(order.id, file);
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
            <h2 className="mb-3 font-display text-xl">Envío</h2>
            <p className="text-sm text-ink/70">{order.direccionEnvio}</p>
            <p className="text-sm text-ink/70">
              {order.ciudad}, {order.provincia}
            </p>
            <p className="text-sm text-ink/70">Tel: {order.telefonoContacto}</p>
            {order.vendedorNombre && <p className="mt-2 text-sm text-ink/50">Vendedor: {order.vendedorNombre}</p>}
          </section>

          <section className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-500/5 to-indigo-500/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white font-bold text-lg shadow-sm">
                🏦
              </div>
              <div>
                <h2 className="font-display text-xl text-primary">Datos para la Transferencia</h2>
                <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold">Banco Pichincha</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 rounded-xl bg-white dark:bg-slate-900 p-4 border border-theme text-sm shadow-sm">
              <div>
                <span className="text-[11px] text-muted-t font-semibold uppercase tracking-wider block">Banco</span>
                <span className="font-bold text-primary">Banco Pichincha</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-t font-semibold uppercase tracking-wider block">N° de Cuenta</span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-base">2213521473</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[11px] text-muted-t font-semibold uppercase tracking-wider block">Titular</span>
                <span className="font-bold text-primary">Danny Alexander Guaman Pillajo</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/25 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-1.5 leading-relaxed">
              <p className="font-bold text-sm text-amber-800 dark:text-amber-100">
                📲 Envío de Voucher:
              </p>
              <p>Envía tu comprobante al vendedor que te atendió o directamente al WhatsApp:{" "}
                <a
                  href="https://wa.me/593999001471?text=Hola,%20adjunto%20comprobante%20para%20el%20pedido%20"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-sky-600 dark:text-sky-400 underline"
                >
                  +593999001471
                </a>
              </p>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6">
            <h2 className="mb-3 font-display text-xl">Comprobante de pago</h2>
            {order.comprobanteUrl && !canUploadComprobante ? (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="h-5 w-5" />
                Comprobante recibido, en revisión o ya verificado.
              </div>
            ) : canUploadComprobante ? (
              <UploadBox isUploading={isUploading} onUpload={handleUpload} />
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

function UploadBox({ onUpload, isUploading }: { onUpload: (file: File) => void; isUploading: boolean }) {
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
            onUpload(file);
          }
        }}
      />
      <Button type="button" variant="outline" size="sm" isLoading={isUploading} className="pointer-events-none mt-2">
        Seleccionar archivo
      </Button>
    </label>
  );
}
