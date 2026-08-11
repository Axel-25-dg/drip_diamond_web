import { useEffect, useRef, useState } from "react";
import type { ResumenVendedor, Liquidacion } from "@/domain/ports/AdminRepositoryPort";
import { Button } from "@/presentation/components/ui/Button";
import { Badge } from "@/presentation/components/ui/Badge";
import { formatCurrency, resolveMediaUrl } from "@/presentation/utils/format";
import { toast } from "sonner";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  UploadCloud,
  ExternalLink,
  History,
} from "lucide-react";
import { useCases } from "@/infrastructure/factories/useCases.factory";

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

/** Devuelve true si hoy está en la ventana de pago: del día 26 al último día del mes */
function enVentanaDePago(): boolean {
  const hoy = new Date();
  const dia = hoy.getDate();
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  return dia >= 26 && dia <= ultimoDia;
}

/** Mes y año actuales */
function mesActual() {
  const hoy = new Date();
  return { mes: hoy.getMonth() + 1, anio: hoy.getFullYear() };
}

export default function ContadorLiquidacionesPage() {
  const [vendedores, setVendedores] = useState<ResumenVendedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Historial de liquidaciones pagadas (tab aparte)
  const [historial, setHistorial] = useState<Liquidacion[]>([]);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [tab, setTab] = useState<"actual" | "historial">("actual");

  // Modal detalle de ventas
  const [detalleVendedor, setDetalleVendedor] = useState<{ nombre: string; liq: Liquidacion } | null>(null);
  const [detalleLoading, setDetalleLoading] = useState(false);

  // Modal pago
  const [pagoVendedor, setPagoVendedor] = useState<ResumenVendedor | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  const ventana = enVentanaDePago();
  const { mes, anio } = mesActual();

  const loadVendedores = async () => {
    setIsLoading(true);
    try {
      const data = await useCases.getResumenGlobalVendedores.execute();
      setVendedores(data);
    } catch {
      toast.error("No se pudo cargar el resumen de vendedores.");
      setVendedores([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistorial = async () => {
    setHistorialLoading(true);
    try {
      const all = await useCases.getLiquidaciones.execute();
      setHistorial(all.filter((l) => l.pagada));
    } catch {
      setHistorial([]);
    } finally {
      setHistorialLoading(false);
    }
  };

  useEffect(() => {
    loadVendedores();
  }, []);

  useEffect(() => {
    if (tab === "historial" && historial.length === 0) {
      loadHistorial();
    }
  }, [tab]);

  const openDetalle = async (v: ResumenVendedor) => {
    if (!v.liquidacionId) {
      toast.info("Este vendedor no tiene liquidación generada aún este mes.");
      return;
    }
    setDetalleLoading(true);
    try {
      const liq = await useCases.getLiquidacionDetalle.execute(v.liquidacionId);
      setDetalleVendedor({ nombre: v.vendedorNombre, liq });
    } catch {
      toast.error("No se pudo cargar el detalle.");
    } finally {
      setDetalleLoading(false);
    }
  };

  const handlePago = async (file: File) => {
    if (!pagoVendedor?.liquidacionId) return;
    setIsPaying(true);
    try {
      await useCases.marcarLiquidacionPagada.execute(pagoVendedor.liquidacionId, file);
      toast.success(`Pago registrado para ${pagoVendedor.vendedorNombre}. Se notificó al vendedor.`);
      setPagoVendedor(null);
      setFileName("");
      loadVendedores();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo registrar el pago.");
    } finally {
      setIsPaying(false);
    }
  };

  // KPIs
  const totalPendiente = vendedores
    .filter((v) => !v.liquidacionPagada && v.totalComisionesMes > 0)
    .reduce((s, v) => s + v.totalComisionesMes, 0);
  const totalVendedoresConComision = vendedores.filter((v) => v.totalComisionesMes > 0).length;
  const totalPagados = vendedores.filter((v) => v.liquidacionPagada).length;

  return (
    <div className="container-app py-10">
      {/* Header */}
      <div className="border-b border-theme pb-6">
        <span className="inline-block rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-600 border border-purple-400/20">
          Liquidaciones de comisiones
        </span>
        <h1 className="mt-2 font-display text-4xl text-primary">
          Pago de <span className="text-gradient-brand">Comisiones</span>
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Resumen automático del mes actual — <strong>{MESES[mes - 1]} {anio}</strong>.
          El botón de pago está activo del <strong>día 26 al último día del mes</strong>.
        </p>

        {/* Ventana de pago banner */}
        {ventana ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Ventana de pago activa — puedes registrar pagos hasta el último día del mes.
          </div>
        ) : (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
            <Clock className="h-4 w-4" />
            Fuera de ventana de pago — los pagos se habilitan del día 26 al último día del mes.
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Por pagar este mes</p>
          <p className="mt-2 font-display text-3xl text-amber-900 dark:text-amber-300">{formatCurrency(totalPendiente)}</p>
          <p className="mt-1 text-xs text-amber-700">{totalVendedoresConComision} vendedor(es) con comisión pendiente</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/30">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Pagados este mes</p>
          <p className="mt-2 font-display text-3xl text-emerald-900 dark:text-emerald-300">{totalPagados}</p>
          <p className="mt-1 text-xs text-emerald-700">vendedor(es) ya liquidados</p>
        </div>
        <div className="rounded-2xl border border-theme bg-surf p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-t">Total vendedores</p>
          <p className="mt-2 font-display text-3xl text-primary">{vendedores.length}</p>
          <p className="mt-1 text-xs text-muted-t">registrados en el sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10 flex gap-1 border-b border-theme">
        {[
          { key: "actual", label: `${MESES[mes - 1]} ${anio}`, icon: <DollarSign className="h-4 w-4" /> },
          { key: "historial", label: "Historial de pagos", icon: <History className="h-4 w-4" /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as "actual" | "historial")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === key
                ? "border-sky-500 text-sky-600 dark:text-sky-400"
                : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── TAB: MES ACTUAL ── */}
      {tab === "actual" && (
        <div className="mt-6">
          {isLoading ? (
            <p className="py-16 text-center text-secondary">Cargando vendedores...</p>
          ) : vendedores.length === 0 ? (
            <div className="rounded-2xl border border-theme bg-surf p-16 text-center text-secondary">
              <DollarSign className="mx-auto h-10 w-10 text-muted-t mb-3" />
              <p className="font-display text-xl">No hay vendedores registrados</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-theme bg-surf shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-theme text-xs font-bold uppercase tracking-wider text-muted-t">
                    <tr>
                      <th className="px-5 py-4">Vendedor</th>
                      <th className="px-5 py-4">Pares del mes</th>
                      <th className="px-5 py-4">Comisión del mes</th>
                      <th className="px-5 py-4">Histórico total</th>
                      <th className="px-5 py-4">Estado</th>
                      <th className="px-5 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {vendedores.map((v) => {
                      const tienePago = v.liquidacionPagada;
                      const tieneComision = v.totalComisionesMes > 0;
                      const puedeAPagar = ventana && tieneComision && !tienePago && v.liquidacionId != null;

                      return (
                        <tr key={v.vendedorId} className="hover:bg-surf2 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-primary">{v.vendedorNombre}</p>
                            <p className="text-xs text-muted-t">{v.vendedorEmail}</p>
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-primary">
                            {v.totalParesMes > 0 ? `${v.totalParesMes} par(es)` : <span className="text-muted-t">—</span>}
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                            {tieneComision ? formatCurrency(v.totalComisionesMes) : <span className="text-muted-t">$0.00</span>}
                          </td>
                          <td className="px-5 py-4 font-mono text-secondary">
                            {formatCurrency(v.totalComisionesHistorico)}
                          </td>
                          <td className="px-5 py-4">
                            {tienePago ? (
                              <Badge tone="success">
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Pagado
                              </Badge>
                            ) : tieneComision ? (
                              <Badge tone="warning">Pendiente</Badge>
                            ) : (
                              <Badge tone="neutral">Sin ventas</Badge>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Ver detalle de ventas */}
                              {v.liquidacionId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  isLoading={detalleLoading}
                                  onClick={() => openDetalle(v)}
                                >
                                  Ver detalle
                                </Button>
                              )}

                              {/* Ver comprobante si ya se pagó */}
                              {tienePago && v.comprobantePagoUrl && (
                                <a
                                  href={resolveMediaUrl(v.comprobantePagoUrl) ?? "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-100"
                                >
                                  <ExternalLink className="h-3 w-3" /> Comprobante
                                </a>
                              )}

                              {/* Botón pagar — solo en ventana, con comisión, sin pago previo */}
                              {puedeAPagar && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => { setPagoVendedor(v); setFileName(""); }}
                                >
                                  <DollarSign className="h-3.5 w-3.5" /> Pagar
                                </Button>
                              )}

                              {/* Fuera de ventana con comisión pendiente */}
                              {!tienePago && tieneComision && !ventana && (
                                <span className="text-xs text-muted-t italic">Disponible día 26</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: HISTORIAL ── */}
      {tab === "historial" && (
        <div className="mt-6">
          {historialLoading ? (
            <p className="py-16 text-center text-secondary">Cargando historial...</p>
          ) : historial.length === 0 ? (
            <div className="rounded-2xl border border-theme bg-surf p-16 text-center text-secondary">
              <History className="mx-auto h-10 w-10 text-muted-t mb-3" />
              <p className="font-display text-xl">No hay pagos registrados aún</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-theme bg-surf shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-theme text-xs font-bold uppercase tracking-wider text-muted-t">
                    <tr>
                      <th className="px-5 py-4">Vendedor</th>
                      <th className="px-5 py-4">Período</th>
                      <th className="px-5 py-4">Pares</th>
                      <th className="px-5 py-4">Total pagado</th>
                      <th className="px-5 py-4">Fecha de pago</th>
                      <th className="px-5 py-4 text-right">Comprobante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {historial.map((liq) => (
                      <tr key={liq.id} className="hover:bg-surf2 transition-colors">
                        <td className="px-5 py-4 font-semibold text-primary">
                          {liq.vendedorNombre || `Vendedor #${liq.vendedorId}`}
                        </td>
                        <td className="px-5 py-4 text-secondary">
                          {MESES[liq.periodoMes - 1]} {liq.periodoAnio}
                        </td>
                        <td className="px-5 py-4 font-mono text-primary">{liq.totalPares}</td>
                        <td className="px-5 py-4 font-mono font-bold text-emerald-600">
                          {formatCurrency(liq.totalComisiones)}
                        </td>
                        <td className="px-5 py-4 text-xs text-secondary">
                          {liq.fechaPago
                            ? new Date(liq.fechaPago).toLocaleDateString("es-EC", {
                                day: "2-digit", month: "long", year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {liq.comprobanteUrl ? (
                            <a
                              href={resolveMediaUrl(liq.comprobanteUrl) ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-500 hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> Ver
                            </a>
                          ) : (
                            <span className="text-muted-t text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal detalle de ventas ── */}
      {detalleVendedor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-theme bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-display text-2xl text-primary">
                  Detalle — {detalleVendedor.nombre}
                </h3>
                <p className="text-xs text-muted-t mt-0.5">
                  {MESES[detalleVendedor.liq.periodoMes - 1]} {detalleVendedor.liq.periodoAnio}
                  {" · "}
                  <span className="font-bold text-primary">
                    {formatCurrency(detalleVendedor.liq.totalComisiones)}
                  </span>
                  {" · "}
                  {detalleVendedor.liq.totalPares} pares
                </p>
              </div>
              <button
                onClick={() => setDetalleVendedor(null)}
                className="rounded-lg p-1 text-muted-t hover:bg-surf2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {(detalleVendedor.liq.comisiones?.length ?? 0) === 0 ? (
              <p className="text-secondary text-sm py-6 text-center">No hay ventas detalladas para este período.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs font-bold uppercase tracking-wider text-muted-t border-b border-theme">
                  <tr>
                    <th className="pb-3 text-left">Pedido</th>
                    <th className="pb-3 text-left">Pares</th>
                    <th className="pb-3 text-left">$/par</th>
                    <th className="pb-3 text-right">Comisión</th>
                    <th className="pb-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {detalleVendedor.liq.comisiones!.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 font-mono text-primary">#{c.pedidoId}</td>
                      <td className="py-3 text-secondary">{c.cantidadPares}</td>
                      <td className="py-3 font-mono text-secondary">{formatCurrency(c.montoPorPar)}</td>
                      <td className="py-3 text-right font-mono font-bold text-primary">{formatCurrency(c.monto)}</td>
                      <td className="py-3 text-right">
                        <Badge tone={c.estado === "LIQUIDADA" ? "success" : "warning"}>{c.estado}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-theme">
                    <td colSpan={3} className="pt-3 text-xs font-bold text-muted-t">Total</td>
                    <td className="pt-3 text-right font-mono font-bold text-primary">
                      {formatCurrency(detalleVendedor.liq.totalComisiones)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}

            <div className="mt-6 flex justify-end">
              <Button variant="ghost" onClick={() => setDetalleVendedor(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal pago ── */}
      {pagoVendedor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-theme bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-display text-2xl text-primary">Registrar pago</h3>
                <p className="text-xs text-muted-t mt-1">
                  {pagoVendedor.vendedorNombre} · {MESES[mes - 1]} {anio}
                  {" · "}
                  <span className="font-bold text-primary">
                    {formatCurrency(pagoVendedor.totalComisionesMes)}
                  </span>
                </p>
              </div>
              <button onClick={() => setPagoVendedor(null)} className="rounded-lg p-1 text-muted-t hover:bg-surf2">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 mb-4 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-semibold">Antes de marcar como pagado:</p>
              <ol className="mt-1 list-decimal list-inside space-y-0.5 text-xs">
                <li>Transfiere <strong>{formatCurrency(pagoVendedor.totalComisionesMes)}</strong> a {pagoVendedor.vendedorNombre}</li>
                <li>Sube el comprobante de la transferencia</li>
                <li>El vendedor recibirá una notificación automática</li>
              </ol>
            </div>

            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-theme px-6 py-8 text-center hover:border-sky-400 transition-colors">
              <UploadCloud className="h-7 w-7 text-muted-t" />
              <span className="text-sm font-semibold text-primary">
                {fileName || "Subir comprobante de transferencia"}
              </span>
              <span className="text-xs text-muted-t">JPG, PNG o PDF · máx 5 MB</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setFileName(f.name); handlePago(f); }
                }}
              />
            </label>

            <div className="mt-5 flex justify-end gap-3">
              <Button variant="ghost" size="lg" onClick={() => setPagoVendedor(null)}>Cancelar</Button>
              <Button
                variant="secondary"
                size="lg"
                isLoading={isPaying}
                onClick={() => fileRef.current?.click()}
              >
                <CheckCircle2 className="h-4 w-4" /> Subir y registrar pago
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
