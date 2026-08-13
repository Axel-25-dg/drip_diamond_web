import { useEffect, useRef, useState } from "react";
import type { ResumenVendedor, Liquidacion } from "@/domain/ports/AdminRepositoryPort";
import { formatCurrency, resolveMediaUrl } from "@/presentation/utils/format";
import { toast } from "sonner";
import {
  DollarSign, CheckCircle2, Clock, X, UploadCloud,
  ExternalLink, History, Search, TrendingUp, Users,
  Calendar, ChevronRight, AlertCircle, Loader2,
} from "lucide-react";
import { useCases } from "@/infrastructure/factories/useCases.factory";

/* ─── Constants ──────────────────────────────────────────── */
const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function enVentanaDePago(): boolean {
  const hoy = new Date();
  const dia = hoy.getDate();
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  return dia >= 26 && dia <= ultimoDia;
}
function mesActual() {
  const hoy = new Date();
  return { mes: hoy.getMonth() + 1, anio: hoy.getFullYear() };
}

/* ─── Sub-components ──────────────────────────────────────── */

/** Chip de estado */
function StatusChip({ pagada, tieneComision }: { pagada: boolean; tieneComision: boolean }) {
  if (pagada) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="h-3 w-3" /> Pagado
    </span>
  );
  if (tieneComision) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
      <Clock className="h-3 w-3" /> Pendiente
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500 border border-gray-200">
      Sin ventas
    </span>
  );
}

/** Avatar de iniciales */
function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((p) => p[0] ?? "").join("").toUpperCase();
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-sky-400 text-sm font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,0.30)]">
      {initials || "V"}
    </div>
  );
}

/** Tarjeta de vendedor */
function VendedorCard({
  v, ventana, detalleLoading, onDetalle, onPagar,
}: {
  v: ResumenVendedor;
  ventana: boolean;
  detalleLoading: boolean;
  onDetalle: (v: ResumenVendedor) => void;
  onPagar: (v: ResumenVendedor) => void;
}) {
  const tienePago    = v.liquidacionPagada;
  const tieneComision = v.totalComisionesMes > 0;
  const puedeAPagar  = ventana && tieneComision && !tienePago;

  return (
    <div className="flex flex-col rounded-2xl border border-blue-100 bg-white shadow-[0_2px_12px_rgba(37,99,235,0.07)] transition-all duration-200 hover:shadow-[0_6px_24px_rgba(37,99,235,0.12)] hover:-translate-y-0.5">

      {/* Top strip */}
      <div className={`h-1.5 w-full rounded-t-2xl ${tienePago ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : tieneComision ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-gray-200"}`} />

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={v.vendedorNombre} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">{v.vendedorNombre}</p>
              <p className="truncate text-xs text-gray-400">{v.vendedorEmail}</p>
            </div>
          </div>
          <StatusChip pagada={tienePago} tieneComision={tieneComision} />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-blue-50/60 p-3">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pares</p>
            <p className="mt-0.5 font-display text-xl font-black text-gray-900">{v.totalParesMes}</p>
          </div>
          <div className="border-x border-blue-100 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Mes</p>
            <p className="mt-0.5 font-display text-lg font-black text-blue-700">{formatCurrency(v.totalComisionesMes)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Histórico</p>
            <p className="mt-0.5 font-display text-lg font-bold text-gray-500">{formatCurrency(v.totalComisionesHistorico)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {v.liquidacionId && (
            <button
              onClick={() => onDetalle(v)}
              disabled={detalleLoading}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
            >
              {detalleLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Ver detalle
            </button>
          )}

          {tienePago && v.comprobantePagoUrl && (
            <a
              href={resolveMediaUrl(v.comprobantePagoUrl) ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Comprobante
            </a>
          )}

          {puedeAPagar && (
            <button
              onClick={() => onPagar(v)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 py-2 text-xs font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(37,99,235,0.45)]"
            >
              <DollarSign className="h-3.5 w-3.5" /> Registrar pago
            </button>
          )}

          {!tienePago && tieneComision && !ventana && (
            <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-100 bg-amber-50 py-2 text-xs font-semibold text-amber-600">
              <Clock className="h-3.5 w-3.5" /> Disponible día 26
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────── */
export default function ContadorLiquidacionesPage() {
  const [vendedores,      setVendedores]      = useState<ResumenVendedor[]>([]);
  const [isLoading,       setIsLoading]       = useState(true);
  const [historial,       setHistorial]       = useState<Liquidacion[]>([]);
  const [historialLoading,setHistorialLoading]= useState(false);
  const [tab,             setTab]             = useState<"actual" | "historial">("actual");
  const [searchQuery,     setSearchQuery]     = useState("");
  const [statusFilter,    setStatusFilter]    = useState<"all" | "pending" | "paid">("all");
  const [detalleVendedor, setDetalleVendedor] = useState<{ nombre: string; liq: Liquidacion } | null>(null);
  const [detalleLoading,  setDetalleLoading]  = useState(false);
  const [pagoVendedor,    setPagoVendedor]    = useState<ResumenVendedor | null>(null);
  const [isPaying,        setIsPaying]        = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  const ventana        = enVentanaDePago();
  const { mes, anio }  = mesActual();

  /* ── Loaders ── */
  const loadVendedores = async () => {
    setIsLoading(true);
    try { setVendedores(await useCases.getResumenGlobalVendedores.execute()); }
    catch { toast.error("No se pudo cargar el resumen de vendedores."); setVendedores([]); }
    finally { setIsLoading(false); }
  };

  const loadHistorial = async () => {
    setHistorialLoading(true);
    try {
      const all = await useCases.getLiquidaciones.execute();
      setHistorial(all.filter((l) => l.pagada));
    } catch { setHistorial([]); }
    finally { setHistorialLoading(false); }
  };

  useEffect(() => { loadVendedores(); }, []);
  useEffect(() => { if (tab === "historial" && historial.length === 0) loadHistorial(); }, [tab]);

  /* ── Detalle ── */
  const openDetalle = async (v: ResumenVendedor) => {
    setDetalleLoading(true);
    try {
      if (v.liquidacionId) {
        const liq = await useCases.getLiquidacionDetalle.execute(v.liquidacionId);
        setDetalleVendedor({ nombre: v.vendedorNombre, liq });
      } else {
        try {
          const pend = await useCases.getComisionesPendientes.execute(v.vendedorId);
          const pseudo: Liquidacion = {
            id: -1, vendedorId: v.vendedorId, vendedorNombre: v.vendedorNombre,
            periodoMes: mes, periodoAnio: anio,
            totalPares: pend.reduce((s, p) => s + (p.cantidadPares ?? 0), 0),
            totalComisiones: pend.reduce((s, p) => s + (p.monto ?? 0), 0),
            comisiones: pend, pagada: false, creadaEn: "",
          };
          setDetalleVendedor({ nombre: v.vendedorNombre, liq: pseudo });
        } catch { toast.info("No hay detalle disponible."); }
      }
    } catch { toast.error("No se pudo cargar el detalle."); }
    finally { setDetalleLoading(false); }
  };

  /* ── Pago ── */
  const handlePago = async (file: File) => {
    if (!pagoVendedor) return;
    setIsPaying(true);
    try {
      let lid = pagoVendedor.liquidacionId;
      if (!lid) { const c = await useCases.generarLiquidacion.execute(pagoVendedor.vendedorId, anio, mes); lid = c.id; }
      await useCases.marcarLiquidacionPagada.execute(lid, file);
      toast.success(`Pago registrado para ${pagoVendedor.vendedorNombre}.`);
      setPagoVendedor(null); setFileName(""); loadVendedores();
    } catch (err: any) { toast.error(err?.message || "No se pudo registrar el pago."); }
    finally { setIsPaying(false); }
  };

  /* ── KPIs ── */
  const totalPendiente           = vendedores.filter((v) => !v.liquidacionPagada && v.totalComisionesMes > 0).reduce((s, v) => s + v.totalComisionesMes, 0);
  const totalVendedoresConComision = vendedores.filter((v) => v.totalComisionesMes > 0).length;
  const totalPagados             = vendedores.filter((v) => v.liquidacionPagada).length;

  /* ── Filtered vendors ── */
  const filteredVendedores = vendedores
    .filter((v) => {
      if (statusFilter === "pending") return !v.liquidacionPagada && v.totalComisionesMes > 0;
      if (statusFilter === "paid")    return v.liquidacionPagada;
      return true;
    })
    .filter((v) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return v.vendedorNombre.toLowerCase().includes(q) || (v.vendedorEmail || "").toLowerCase().includes(q);
    });

  /* ════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#f0f6ff]">
      <div className="container-app py-10">

        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-500">
              Contabilidad · Liquidaciones
            </p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Pago de <span className="text-blue-600">Comisiones</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {MESES[mes - 1]} {anio} — comisiones de $4.00 por par entregado
            </p>
          </div>

          {/* Ventana de pago badge */}
          {ventana ? (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Ventana de pago activa · hasta fin de mes
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 shadow-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Pagos disponibles del día 26 al último del mes
            </div>
          )}
        </div>

        {/* ── KPI CARDS ── */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* Destacada con gradiente */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 p-6 text-white shadow-[0_4px_24px_rgba(37,99,235,0.30)]">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-sky-300/20 blur-xl" aria-hidden />
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-white/80">Por pagar este mes</p>
              </div>
              <p className="mt-3 font-display text-4xl font-black text-white">{formatCurrency(totalPendiente)}</p>
              <p className="mt-1 text-sm text-white/70">
                {totalVendedoresConComision} vendedor{totalVendedoresConComision !== 1 ? "es" : ""} con comisión pendiente
              </p>
            </div>
          </div>

          {/* Pagados */}
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_2px_12px_rgba(37,99,235,0.07)]">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-gray-500">Pagados este mes</p>
            </div>
            <p className="mt-3 font-display text-4xl font-black text-gray-900">{totalPagados}</p>
            <p className="mt-1 text-sm text-gray-400">vendedor{totalPagados !== 1 ? "es" : ""} ya liquidado{totalPagados !== 1 ? "s" : ""}</p>
          </div>

          {/* Total vendedores */}
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_2px_12px_rgba(37,99,235,0.07)]">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-gray-500">Total vendedores</p>
            </div>
            <p className="mt-3 font-display text-4xl font-black text-gray-900">{vendedores.length}</p>
            <p className="mt-1 text-sm text-gray-400">registrados en el sistema</p>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="mt-10 flex gap-0 rounded-xl border border-blue-100 bg-white p-1 shadow-[0_2px_8px_rgba(37,99,235,0.06)] w-fit">
          {[
            { key: "actual",   label: `${MESES[mes - 1]} ${anio}`, icon: <DollarSign className="h-4 w-4" /> },
            { key: "historial",label: "Historial de pagos",         icon: <History className="h-4 w-4" /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as "actual" | "historial")}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
                tab === key
                  ? "bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.35)]"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* ══ TAB: MES ACTUAL ══ */}
        {tab === "actual" && (
          <div className="mt-6">

            {/* Controls */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o correo..."
                  className="h-10 w-full rounded-xl border border-blue-100 bg-white pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]"
                />
              </div>
              <div className="flex gap-2">
                {(["all","pending","paid"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                      statusFilter === f
                        ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                        : "border-blue-100 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700"
                    }`}
                  >
                    {{ all: "Todos", pending: "Pendientes", paid: "Pagados" }[f]}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex items-center justify-center gap-3 py-20">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <p className="text-sm font-medium text-gray-400">Cargando vendedores...</p>
              </div>
            ) : filteredVendedores.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-blue-200 bg-white py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-300">
                  <Users className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-gray-700">
                    {searchQuery || statusFilter !== "all" ? "Sin resultados" : "No hay vendedores"}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    {searchQuery ? "Intenta con otro término de búsqueda." : "Los vendedores aparecerán aquí cuando tengan ventas."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredVendedores.map((v) => (
                  <VendedorCard
                    key={v.vendedorId}
                    v={v}
                    ventana={ventana}
                    detalleLoading={detalleLoading}
                    onDetalle={openDetalle}
                    onPagar={(vend) => { setPagoVendedor(vend); setFileName(""); }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: HISTORIAL ══ */}
        {tab === "historial" && (
          <div className="mt-6">
            {historialLoading ? (
              <div className="flex items-center justify-center gap-3 py-20">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <p className="text-sm font-medium text-gray-400">Cargando historial...</p>
              </div>
            ) : historial.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-blue-200 bg-white py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-300">
                  <History className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-gray-700">Sin pagos registrados</p>
                  <p className="mt-1 text-sm text-gray-400">Los pagos pagados aparecerán aquí.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_2px_12px_rgba(37,99,235,0.07)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-blue-50 bg-blue-50/60 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-5 py-3.5">Vendedor</th>
                        <th className="px-5 py-3.5">Período</th>
                        <th className="px-5 py-3.5">Pares</th>
                        <th className="px-5 py-3.5">Total</th>
                        <th className="px-5 py-3.5">Fecha de pago</th>
                        <th className="px-5 py-3.5 text-right">Comprobante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {historial.map((liq) => (
                        <tr key={liq.id} className="transition-colors hover:bg-blue-50/40">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={liq.vendedorNombre || "V"} />
                              <span className="font-semibold text-gray-900">
                                {liq.vendedorNombre || `Vendedor #${liq.vendedorId}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                              {MESES[liq.periodoMes - 1]} {liq.periodoAnio}
                            </div>
                          </td>
                          <td className="px-5 py-4 font-mono font-semibold text-gray-700">{liq.totalPares}</td>
                          <td className="px-5 py-4 font-mono font-bold text-emerald-700">{formatCurrency(liq.totalComisiones)}</td>
                          <td className="px-5 py-4 text-xs text-gray-500">
                            {liq.fechaPago
                              ? new Date(liq.fechaPago).toLocaleDateString("es-EC", { day: "2-digit", month: "long", year: "numeric" })
                              : "—"}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {liq.comprobanteUrl ? (
                              <a
                                href={resolveMediaUrl(liq.comprobanteUrl) ?? "#"}
                                target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> Ver
                              </a>
                            ) : <span className="text-gray-300 text-xs">—</span>}
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
      </div>

      {/* ══ MODAL DETALLE ══ */}
      {detalleVendedor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-[0_20px_60px_rgba(37,99,235,0.18)]">

            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-blue-50 bg-white p-6">
              <div className="flex items-center gap-3">
                <Avatar name={detalleVendedor.nombre} />
                <div>
                  <h3 className="font-display text-xl font-bold text-gray-900">{detalleVendedor.nombre}</h3>
                  <p className="text-xs text-gray-400">
                    {MESES[detalleVendedor.liq.periodoMes - 1]} {detalleVendedor.liq.periodoAnio}
                    <span className="mx-1.5 text-gray-300">·</span>
                    <span className="font-bold text-blue-700">{formatCurrency(detalleVendedor.liq.totalComisiones)}</span>
                    <span className="mx-1.5 text-gray-300">·</span>
                    {detalleVendedor.liq.totalPares} pares
                  </p>
                </div>
              </div>
              <button onClick={() => setDetalleVendedor(null)} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6">
              {(detalleVendedor.liq.comisiones?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-300">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-gray-400">No hay ventas detalladas para este período.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-blue-100">
                  <table className="w-full text-sm">
                    <thead className="border-b border-blue-50 bg-blue-50/60 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Pedido</th>
                        <th className="px-4 py-3 text-left">Pares</th>
                        <th className="px-4 py-3 text-left">$/par</th>
                        <th className="px-4 py-3 text-right">Comisión</th>
                        <th className="px-4 py-3 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {detalleVendedor.liq.comisiones!.map((c) => (
                        <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-gray-700">#{c.pedidoId}</td>
                          <td className="px-4 py-3 text-gray-600">{c.cantidadPares}</td>
                          <td className="px-4 py-3 font-mono text-gray-600">{formatCurrency(c.montoPorPar)}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">{formatCurrency(c.monto)}</td>
                          <td className="px-4 py-3 text-right">
                            {c.estado === "LIQUIDADA"
                              ? <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">Liquidada</span>
                              : <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">Pendiente</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-blue-100 bg-blue-50/40">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Total</td>
                        <td className="px-4 py-3 text-right font-mono font-black text-blue-700">{formatCurrency(detalleVendedor.liq.totalComisiones)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-blue-50 px-6 py-4">
              <button onClick={() => setDetalleVendedor(null)} className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL PAGO ══ */}
      {pagoVendedor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white shadow-[0_20px_60px_rgba(37,99,235,0.18)]">

            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-blue-50 p-6">
              <div className="flex items-center gap-3">
                <Avatar name={pagoVendedor.vendedorNombre} />
                <div>
                  <h3 className="font-display text-xl font-bold text-gray-900">Registrar pago</h3>
                  <p className="text-xs text-gray-400">
                    {pagoVendedor.vendedorNombre}
                    <span className="mx-1.5 text-gray-300">·</span>
                    {MESES[mes - 1]} {anio}
                  </p>
                </div>
              </div>
              <button onClick={() => setPagoVendedor(null)} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Amount highlight */}
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-4 text-white">
                <div>
                  <p className="text-xs font-semibold text-white/70">Monto a transferir</p>
                  <p className="mt-0.5 font-display text-3xl font-black">{formatCurrency(pagoVendedor.totalComisionesMes)}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>

              {/* Instructions */}
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-amber-800">
                  <AlertCircle className="h-4 w-4 shrink-0" /> Antes de marcar como pagado:
                </p>
                <ol className="mt-2 list-decimal list-inside space-y-1 text-xs text-amber-700">
                  <li>Realiza la transferencia de <strong>{formatCurrency(pagoVendedor.totalComisionesMes)}</strong> a {pagoVendedor.vendedorNombre}</li>
                  <li>Sube el comprobante de la transferencia</li>
                  <li>El vendedor recibirá una notificación automática</li>
                </ol>
              </div>

              {/* Upload area */}
              <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 px-6 py-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-500">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {fileName || "Subir comprobante"}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">JPG, PNG o PDF · máx 5 MB</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFileName(f.name); handlePago(f); } }}
                />
              </label>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-blue-50 px-6 py-4">
              <button onClick={() => setPagoVendedor(null)} className="rounded-xl border border-blue-100 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button
                disabled={isPaying}
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(37,99,235,0.45)] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isPaying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Subir y registrar pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
