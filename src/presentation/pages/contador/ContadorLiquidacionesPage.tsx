import { useEffect, useRef, useState } from "react";
import type { Liquidacion } from "@/domain/ports/AdminRepositoryPort";
import type { User } from "@/domain/entities/User";
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
  Users,
  Download,
} from "lucide-react";
import { useCases } from "@/infrastructure/factories/useCases.factory";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function ContadorLiquidacionesPage() {
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [vendedores, setVendedores] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Generate modal
  const [genModal, setGenModal] = useState(false);
  const [genVendedorId, setGenVendedorId] = useState<number | "">("");
  const [genAnio, setGenAnio] = useState(new Date().getFullYear());
  const [genMes, setGenMes] = useState(new Date().getMonth() + 1);
  const [isGenerating, setIsGenerating] = useState(false);
  // Orders without seller
  const [ordersNoSeller, setOrdersNoSeller] = useState<any[]>([]);
  const [noSellerModal, setNoSellerModal] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState<number | null>(null);
  const [selectedSellerForAssign, setSelectedSellerForAssign] = useState<number | "">("");

  // Pay modal
  const [payModal, setPayModal] = useState<Liquidacion | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  const load = async () => {
    try {
      const [lRes, vRes] = await Promise.all([
        useCases.getLiquidaciones.execute(),
        useCases.getAdminUsers.execute("VENDEDOR"),
      ]);
      setLiquidaciones(lRes);
      setVendedores(vRes);
    } catch {
      setLiquidaciones([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrdersNoSeller = async () => {
    try {
      const all = await useCases.getOrders.execute();
      const noSeller = all.filter((o: any) => !o.vendedorId && o.estado === "ENTREGADO");
      setOrdersNoSeller(noSeller);
    } catch {
      setOrdersNoSeller([]);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => { loadOrdersNoSeller(); }, []);

  const exportLiquidacionPDF = (liq: Liquidacion) => {
    // Open a new window and print — user can choose "Save as PDF" in browser
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = (liq.comisiones ?? []).map((c) => `
      <tr>
        <td>#${c.pedidoId}</td>
        <td>${c.cantidadPares}</td>
        <td>${formatCurrency(c.montoPorPar)}</td>
        <td>${formatCurrency(c.monto)}</td>
      </tr>
    `).join("\n");
    const html = `
      <html><head><title>Liquidación ${liq.vendedorNombre}</title></head><body>
        <h1>Liquidación — ${liq.vendedorNombre}</h1>
        <p>Periodo: ${MESES[liq.periodoMes - 1]} ${liq.periodoAnio}</p>
        <table border="1" cellpadding="6" cellspacing="0" width="100%">
          <thead><tr><th>Pedido</th><th>Pares</th><th>$/par</th><th>Total</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:16px;font-weight:bold;">Total: ${formatCurrency(liq.totalComisiones)}</p>
      </body></html>`;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const handleMarkCommission = async (comisionId: number) => {
    try {
      await useCases.marcarComisionLiquidada.execute(comisionId);
      toast.success("Comisión marcada como liquidada.");
      load();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo marcar la comisión.");
    }
  };

  const handleGenerar = async () => {
    if (!genVendedorId) { toast.error("Selecciona un vendedor."); return; }
    setIsGenerating(true);
    try {
      const liq = await useCases.generarLiquidacion.execute(Number(genVendedorId), genAnio, genMes);
      toast.success(`Liquidación ${MESES[liq.periodoMes - 1]} ${liq.periodoAnio} generada — ${formatCurrency(liq.totalComisiones)}`);
      setGenModal(false);
      load();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo generar la liquidación.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePagar = async (file: File) => {
    if (!payModal) return;
    setIsPaying(true);
    try {
      await useCases.marcarLiquidacionPagada.execute(payModal.id, file);
      toast.success(`Liquidación #${payModal.id} marcada como PAGADA. Notificación enviada al vendedor.`);
      setPayModal(null);
      setFileName("");
      load();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo marcar como pagada.");
    } finally {
      setIsPaying(false);
    }
  };

  // Stats
  const pendientes = liquidaciones.filter((l) => !l.pagada);
  const pagadas = liquidaciones.filter((l) => l.pagada);
  const totalPendiente = pendientes.reduce((s, l) => s + l.totalComisiones, 0);

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
          Genera el cierre mensual de cada vendedor y marca el pago al transferir. La comisión ($4/par) se genera automáticamente al confirmar cada entrega.
        </p>
      </div>

      {/* KPIs */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Por pagar</p>
          <p className="mt-2 font-display text-3xl text-amber-900">{formatCurrency(totalPendiente)}</p>
          <p className="mt-1 text-xs text-amber-700">{pendientes.length} liquidación(es) pendiente(s)</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/30">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Pagadas este año</p>
          <p className="mt-2 font-display text-3xl text-emerald-900">
            {formatCurrency(pagadas.filter(l => l.periodoAnio === new Date().getFullYear()).reduce((s, l) => s + l.totalComisiones, 0))}
          </p>
          <p className="mt-1 text-xs text-emerald-700">{pagadas.length} liquidación(es) pagada(s)</p>
        </div>
        <div className="rounded-2xl border border-theme bg-surf p-5 flex flex-col justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-t">Vendedores activos</p>
          <p className="mt-2 font-display text-3xl text-primary">{vendedores.length}</p>
          <Button variant="secondary" size="sm" className="mt-3 self-start" onClick={() => setGenModal(true)}>
            <DollarSign className="h-3.5 w-3.5" /> Generar liquidación
          </Button>
          <div className="mt-3">
            <Button variant="ghost" size="sm" onClick={() => { setNoSellerModal(true); loadOrdersNoSeller(); }}>
              Ver ventas sin vendedor
            </Button>
          </div>
        </div>
      </div>

      {/* Liquidaciones list */}
      <div className="mt-10">
        <h2 className="font-display text-2xl text-primary mb-4">Historial de liquidaciones</h2>

        {isLoading ? (
          <p className="text-secondary py-8 text-center">Cargando liquidaciones...</p>
        ) : liquidaciones.length === 0 ? (
          <div className="rounded-2xl border border-theme bg-surf p-12 text-center text-secondary">
            <Users className="mx-auto h-10 w-10 text-muted-t mb-3" />
            <p className="font-display text-xl">No hay liquidaciones aún</p>
            <p className="text-sm mt-1">Genera la primera liquidación mensual de un vendedor.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {liquidaciones.map((liq) => (
              <div key={liq.id} className="overflow-hidden rounded-2xl border border-theme bg-surf shadow-card">
                {/* Row */}
                <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-primary">
                        {liq.vendedorNombre || `Vendedor #${liq.vendedorId}`}
                      </span>
                      <span className="text-xs text-muted-t">
                        {MESES[liq.periodoMes - 1]} {liq.periodoAnio}
                      </span>
                      {liq.pagada ? (
                        <Badge tone="success">Pagada</Badge>
                      ) : (
                        <Badge tone="warning">Pendiente de pago</Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-4 text-sm">
                      <span className="text-muted-t">{liq.totalPares} pares</span>
                      <span className="font-mono font-bold text-primary">{formatCurrency(liq.totalComisiones)}</span>
                      {liq.fechaPago && (
                        <span className="text-xs text-emerald-600">
                          Pagado: {new Date(liq.fechaPago).toLocaleDateString("es-EC")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!liq.pagada && liq.totalComisiones > 0 && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { setPayModal(liq); setFileName(""); }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Marcar pagada
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportLiquidacionPDF(liq)}
                          className="ml-2"
                        >
                          <Download className="h-3.5 w-3.5" /> Exportar PDF
                        </Button>
                      </>
                    )}
                    {liq.comprobanteUrl && (
                      <a
                        href={resolveMediaUrl(liq.comprobanteUrl) ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-sky-500 hover:underline"
                      >
                        Ver comprobante
                      </a>
                    )}
                    <button
                      onClick={() => setExpanded(expanded === liq.id ? null : liq.id)}
                      className="flex items-center gap-1 rounded-lg border border-theme px-2 py-1.5 text-xs text-muted-t hover:bg-surf2 transition-colors"
                    >
                      {expanded === liq.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {(liq.comisiones?.length ?? 0)} comisiones
                    </button>
                  </div>
                </div>

                {/* Expanded comisiones detail */}
                {expanded === liq.id && liq.comisiones && liq.comisiones.length > 0 && (
                  <div className="border-t border-theme bg-surf2 px-5 py-4">
                    <table className="w-full text-sm">
                      <thead className="text-xs font-bold uppercase tracking-wider text-muted-t">
                        <tr>
                          <th className="pb-2 text-left">Pedido</th>
                          <th className="pb-2 text-left">Pares</th>
                          <th className="pb-2 text-left">$/par</th>
                          <th className="pb-2 text-left">Total</th>
                          <th className="pb-2 text-left">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme">
                        {liq.comisiones.map((c) => (
                          <tr key={c.id}>
                            <td className="py-2 font-mono text-primary">#{c.pedidoId}</td>
                            <td className="py-2 text-secondary">{c.cantidadPares}</td>
                            <td className="py-2 font-mono text-secondary">{formatCurrency(c.montoPorPar)}</td>
                            <td className="py-2 font-mono font-bold text-primary">{formatCurrency(c.monto)}</td>
                            <td className="py-2 flex items-center gap-2">
                              <Badge tone={c.estado === "LIQUIDADA" ? "success" : "warning"}>
                                {c.estado}
                              </Badge>
                              {c.estado !== "LIQUIDADA" && (
                                <Button size="xs" variant="ghost" onClick={() => handleMarkCommission(c.id)}>
                                  Marcar
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate modal */}
      {genModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-theme bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-5">
              <h3 className="font-display text-2xl text-primary">Generar liquidación</h3>
              <button onClick={() => setGenModal(false)} className="rounded-lg p-1 text-muted-t hover:bg-surf2">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-t">Vendedor</label>
                <select
                  value={genVendedorId}
                  onChange={(e) => setGenVendedorId(e.target.value ? Number(e.target.value) : "")}
                  className="mt-1 h-11 w-full rounded-xl border border-theme bg-surf2 px-3 text-sm text-primary outline-none focus:border-sky-400"
                >
                  <option value="">Seleccionar vendedor...</option>
                  {vendedores.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nombre} {v.apellido}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-t">Mes</label>
                  <select
                    value={genMes}
                    onChange={(e) => setGenMes(Number(e.target.value))}
                    className="mt-1 h-11 w-full rounded-xl border border-theme bg-surf2 px-3 text-sm text-primary outline-none focus:border-sky-400"
                  >
                    {MESES.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-t">Año</label>
                  <input
                    type="number"
                    value={genAnio}
                    onChange={(e) => setGenAnio(Number(e.target.value))}
                    className="mt-1 h-11 w-full rounded-xl border border-theme bg-surf2 px-3 text-sm text-primary outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-t">
                Esto agrupa todas las comisiones PENDIENTE del vendedor en ese período y genera la liquidación para pago.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" size="lg" onClick={() => setGenModal(false)}>Cancelar</Button>
              <Button variant="secondary" size="lg" isLoading={isGenerating} onClick={handleGenerar}>
                <DollarSign className="h-4 w-4" /> Generar liquidación
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* No-seller modal */}
      {noSellerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-theme bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-5">
              <h3 className="font-display text-2xl text-primary">Ventas sin vendedor asignado</h3>
              <button onClick={() => setNoSellerModal(false)} className="rounded-lg p-1 text-muted-t hover:bg-surf2">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {ordersNoSeller.length === 0 ? (
                <p className="text-sm text-secondary">No se encontraron ventas sin vendedor.</p>
              ) : (
                <div className="space-y-2">
                  {ordersNoSeller.map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-lg border border-theme p-3">
                      <div>
                        <div className="font-semibold">Pedido #{o.numero} · {o.clienteNombre}</div>
                        <div className="text-xs text-muted-t">Total: {formatCurrency(o.total)} · {o.items?.length ?? 0} pares</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select value={selectedSellerForAssign} onChange={(e) => setSelectedSellerForAssign(e.target.value ? Number(e.target.value) : "")} className="h-9 rounded-xl border px-3">
                          <option value="">Seleccionar vendedor...</option>
                          {vendedores.map((v) => (
                            <option key={v.id} value={v.id}>{v.nombre} {v.apellido}</option>
                          ))}
                        </select>
                        <Button size="sm" variant="secondary" onClick={async () => {
                          if (!selectedSellerForAssign) { toast.error("Selecciona un vendedor"); return; }
                          try {
                            await useCases.assignSellerToOrder.execute(o.id, Number(selectedSellerForAssign));
                            toast.success("Vendedor asignado.");
                            loadOrdersNoSeller(); load();
                          } catch (err: any) {
                            toast.error(err?.message || "No se pudo asignar vendedor.");
                          }
                        }}>Asignar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pay modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-theme bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-display text-2xl text-primary">Marcar como pagada</h3>
                <p className="text-xs text-muted-t mt-1">
                  {payModal.vendedorNombre} · {MESES[payModal.periodoMes - 1]} {payModal.periodoAnio}
                  · <span className="font-bold text-primary">{formatCurrency(payModal.totalComisiones)}</span>
                </p>
              </div>
              <button onClick={() => setPayModal(null)} className="rounded-lg p-1 text-muted-t hover:bg-surf2">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 mb-4 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-semibold">Antes de marcar como pagada:</p>
              <ol className="mt-1 list-decimal list-inside space-y-0.5 text-xs">
                <li>Transfiere <strong>{formatCurrency(payModal.totalComisiones)}</strong> al vendedor</li>
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
                  if (f) {
                    setFileName(f.name);
                    handlePagar(f);
                  }
                }}
              />
            </label>

            <div className="mt-5 flex justify-end gap-3">
              <Button variant="ghost" size="lg" onClick={() => setPayModal(null)}>Cancelar</Button>
              <Button
                variant="secondary"
                size="lg"
                isLoading={isPaying}
                onClick={() => fileRef.current?.click()}
              >
                <CheckCircle2 className="h-4 w-4" /> Subir y marcar pagada
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
