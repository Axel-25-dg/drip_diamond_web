import { useEffect, useRef, useState } from "react";
import type { ResumenVendedor, Liquidacion } from "@/domain/ports/AdminRepositoryPort";
import { formatCurrency, resolveMediaUrl } from "@/presentation/utils/format";
import { toast } from "sonner";
import {
  DollarSign, CheckCircle2, Clock, X, UploadCloud,
  ExternalLink, History, Search, TrendingUp, Users,
  Calendar, ChevronRight, AlertCircle, Loader2, FileText, Wallet, Sun, Moon,
} from "lucide-react";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import { useThemeStore } from "@/presentation/store/themeStore";

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
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-3 w-3" /> Pagado
    </span>
  );
  if (tieneComision) return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
      <Clock className="h-3 w-3" /> Pendiente
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
      Sin ventas
    </span>
  );
}

/** Avatar de iniciales */
function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((p) => p[0] ?? "").join("").toUpperCase();
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-400 text-sm font-bold text-white shadow-md shadow-blue-500/20">
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
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 dark:border-[#222732] dark:bg-[#12151c] dark:hover:border-[#313746]">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={v.vendedorNombre} />
            <div className="min-w-0">
              <p className="truncate font-display font-bold text-slate-900 dark:text-white">{v.vendedorNombre}</p>
              <p className="truncate text-xs text-slate-400 dark:text-slate-400">{v.vendedorEmail}</p>
            </div>
          </div>
          <StatusChip pagada={tienePago} tieneComision={tieneComision} />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-[#1e232e] dark:bg-[#171a22]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pares</p>
            <p className="mt-0.5 font-display text-lg font-black text-slate-900 dark:text-white">{v.totalParesMes}</p>
          </div>
          <div className="border-x border-slate-200 dark:border-[#262b38]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Mes</p>
            <p className="mt-0.5 font-display text-lg font-black text-[#0084ff] dark:text-[#38bdf8]">{formatCurrency(v.totalComisionesMes)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Histórico</p>
            <p className="mt-0.5 font-display text-lg font-bold text-slate-500 dark:text-slate-400">{formatCurrency(v.totalComisionesHistorico)}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        {v.liquidacionId && (
          <button
            onClick={() => onDetalle(v)}
            disabled={detalleLoading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 dark:border-[#2a303d] dark:bg-[#1b1f28] dark:text-slate-200 dark:hover:bg-[#242a37] disabled:opacity-50"
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
            className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition-all hover:bg-emerald-500/20"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Comprobante
          </a>
        )}

        {puedeAPagar && (
          <button
            onClick={() => onPagar(v)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0062ff] to-[#00aaff] py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:from-[#0052df] hover:to-[#0088ee]"
          >
            <DollarSign className="h-3.5 w-3.5" /> Registrar pago
          </button>
        )}

        {!tienePago && tieneComision && !ventana && (
          <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 py-2.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" /> Disponible día 26
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────── */
export default function ContadorLiquidacionesPage() {
  const { theme, toggleTheme } = useThemeStore();
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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0a0c10] dark:text-slate-100 transition-colors duration-200">
      <div className="container-app py-8 sm:py-10">

        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-600 dark:border-sky-500/20 dark:text-sky-400">
              <FileText className="h-3.5 w-3.5" />
              Liquidaciones de comisiones
            </div>

            {/* Title */}
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
              Pago de <span className="text-[#0084ff] dark:text-[#38bdf8]">Comisiones</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
              Resumen automático del mes actual — <strong className="font-bold text-slate-900 dark:text-white">{MESES[mes - 1]} {anio}</strong>. El botón de pago está activo del <strong className="font-bold text-slate-900 dark:text-white">día 26 al último día del mes</strong>.
            </p>

            {/* Ventana de pago badge pill */}
            <div className="pt-2">
              {ventana ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  Ventana de pago activa — los pagos se habilitan del día 26 al último día del mes.
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400">
                  <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  Fuera de ventana de pago — los pagos se habilitan del día 26 al último día del mes.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">

          {/* Destacada con gradiente azul */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0062ff] to-[#00aaff] p-6 text-white shadow-xl shadow-blue-500/20 flex flex-col justify-between">
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white">
                  <Wallet className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/80">Por pagar este mes</p>
              </div>
              <p className="mt-3 font-display text-3xl sm:text-4xl font-black text-white tracking-tight">{formatCurrency(totalPendiente)}</p>
              <p className="mt-1 text-xs sm:text-sm text-white/80 font-medium">
                {totalVendedoresConComision} vendedor(es) con comisión pendiente
              </p>
            </div>
          </div>

          {/* Pagados este mes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#222732] dark:bg-[#12151c] transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pagados este mes</p>
              </div>
              <p className="mt-3 font-display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{totalPagados}</p>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">vendedor(es) ya liquidados</p>
            </div>
          </div>

          {/* Total vendedores */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#222732] dark:bg-[#12151c] transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-500">
                  <Users className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total vendedores</p>
              </div>
              <p className="mt-3 font-display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{vendedores.length}</p>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">registrados en el sistema</p>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="mt-10 flex gap-8 border-b border-slate-200 dark:border-[#1e232e]">
          {[
            { key: "actual",   label: `${MESES[mes - 1]} ${anio}`, icon: <DollarSign className="h-4 w-4" /> },
            { key: "historial",label: "Historial de pagos",         icon: <History className="h-4 w-4" /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as "actual" | "historial")}
              className={`flex items-center gap-2 py-3 text-sm font-bold transition-all relative ${
                tab === key
                  ? "text-[#0084ff] dark:text-[#38bdf8] border-b-2 border-[#0084ff] dark:border-[#38bdf8]"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border-b-2 border-transparent"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* ══ TAB: MES ACTUAL ══ */}
        {tab === "actual" && (
          <div className="mt-6">

            {/* Controls Search & Filter */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar vendedor por nombre o email"
                  className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-[#222732] dark:bg-[#12151c] dark:text-white dark:placeholder:text-slate-500 transition-all"
                />
              </div>

              {/* Status Pill Filters */}
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-[#222732] dark:bg-[#12151c]">
                {(["all","pending","paid"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                      statusFilter === f
                        ? "bg-[#0084ff] text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
                <Loader2 className="h-6 w-6 animate-spin text-[#0084ff]" />
                <p className="text-sm font-medium text-slate-400">Cargando vendedores...</p>
              </div>
            ) : filteredVendedores.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 dark:border-[#222732] bg-white dark:bg-[#12151c] py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500">
                  <Users className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    {searchQuery || statusFilter !== "all" ? "Sin resultados" : "No hay vendedores"}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {searchQuery ? "Intenta con otro término de búsqueda." : "Los vendedores aparecerán aquí cuando tengan ventas."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
                <Loader2 className="h-6 w-6 animate-spin text-[#0084ff]" />
                <p className="text-sm font-medium text-slate-400">Cargando historial...</p>
              </div>
            ) : historial.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 dark:border-[#222732] bg-white dark:bg-[#12151c] py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500">
                  <History className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-200">Sin pagos registrados</p>
                  <p className="mt-1 text-sm text-slate-400">Los pagos realizados aparecerán aquí.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#222732] dark:bg-[#12151c]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-[#222732] dark:bg-[#171a22] dark:text-slate-400">
                      <tr>
                        <th className="px-5 py-3.5">Vendedor</th>
                        <th className="px-5 py-3.5">Período</th>
                        <th className="px-5 py-3.5">Pares</th>
                        <th className="px-5 py-3.5">Total</th>
                        <th className="px-5 py-3.5">Fecha de pago</th>
                        <th className="px-5 py-3.5 text-right">Comprobante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1c2029]">
                      {historial.map((liq) => (
                        <tr key={liq.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-[#171a22]/60">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={liq.vendedorNombre || "V"} />
                              <span className="font-bold text-slate-900 dark:text-white">
                                {liq.vendedorNombre || `Vendedor #${liq.vendedorId}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {MESES[liq.periodoMes - 1]} {liq.periodoAnio}
                            </div>
                          </td>
                          <td className="px-5 py-4 font-mono font-semibold text-slate-700 dark:text-slate-300">{liq.totalPares}</td>
                          <td className="px-5 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(liq.totalComisiones)}</td>
                          <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                            {liq.fechaPago
                              ? new Date(liq.fechaPago).toLocaleDateString("es-EC", { day: "2-digit", month: "long", year: "numeric" })
                              : "—"}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {liq.comprobanteUrl ? (
                              <a
                                href={resolveMediaUrl(liq.comprobanteUrl) ?? "#"}
                                target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-all"
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> Ver
                              </a>
                            ) : <span className="text-slate-400 text-xs">—</span>}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-[#262c38] dark:bg-[#12151c] dark:text-white">

            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white dark:bg-[#12151c] dark:border-[#1e232e] p-6">
              <div className="flex items-center gap-3">
                <Avatar name={detalleVendedor.nombre} />
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{detalleVendedor.nombre}</h3>
                  <p className="text-xs text-slate-400">
                    {MESES[detalleVendedor.liq.periodoMes - 1]} {detalleVendedor.liq.periodoAnio}
                    <span className="mx-1.5 text-slate-300 dark:text-slate-700">·</span>
                    <span className="font-bold text-[#0084ff] dark:text-[#38bdf8]">{formatCurrency(detalleVendedor.liq.totalComisiones)}</span>
                    <span className="mx-1.5 text-slate-300 dark:text-slate-700">·</span>
                    {detalleVendedor.liq.totalPares} pares
                  </p>
                </div>
              </div>
              <button onClick={() => setDetalleVendedor(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e232e] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6">
              {(detalleVendedor.liq.comisiones?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-slate-400">No hay ventas detalladas para este período.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#222732]">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-[#222732] dark:bg-[#171a22] dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Pedido</th>
                        <th className="px-4 py-3 text-left">Pares</th>
                        <th className="px-4 py-3 text-left">$/par</th>
                        <th className="px-4 py-3 text-right">Comisión</th>
                        <th className="px-4 py-3 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1c2029]">
                      {detalleVendedor.liq.comisiones!.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-[#171a22]/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">#{c.pedidoId}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.cantidadPares}</td>
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{formatCurrency(c.montoPorPar)}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(c.monto)}</td>
                          <td className="px-4 py-3 text-right">
                            {c.estado === "LIQUIDADA"
                              ? <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Liquidada</span>
                              : <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">Pendiente</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-200 dark:border-[#222732] bg-slate-50/60 dark:bg-[#171a22]">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total</td>
                        <td className="px-4 py-3 text-right font-mono font-black text-[#0084ff] dark:text-[#38bdf8]">{formatCurrency(detalleVendedor.liq.totalComisiones)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 dark:border-[#1e232e] px-6 py-4">
              <button onClick={() => setDetalleVendedor(null)} className="rounded-xl border border-slate-200 bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:border-[#2a303d] dark:bg-[#1b1f28] dark:text-slate-200 dark:hover:bg-[#242a37] transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL PAGO ══ */}
      {pagoVendedor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-[#262c38] dark:bg-[#12151c] dark:text-white">

            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#1e232e] p-6">
              <div className="flex items-center gap-3">
                <Avatar name={pagoVendedor.vendedorNombre} />
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Registrar pago</h3>
                  <p className="text-xs text-slate-400">
                    {pagoVendedor.vendedorNombre}
                    <span className="mx-1.5 text-slate-300 dark:text-slate-700">·</span>
                    {MESES[mes - 1]} {anio}
                  </p>
                </div>
              </div>
              <button onClick={() => setPagoVendedor(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e232e] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Amount highlight */}
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#0062ff] to-[#00aaff] px-6 py-4 text-white shadow-lg shadow-blue-500/20">
                <div>
                  <p className="text-xs font-semibold text-white/80">Monto a transferir</p>
                  <p className="mt-0.5 font-mono text-3xl font-black">{formatCurrency(pagoVendedor.totalComisionesMes)}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>

              {/* Instructions */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 shrink-0" /> Antes de marcar como pagado:
                </p>
                <ol className="mt-2 list-decimal list-inside space-y-1 text-xs text-amber-800 dark:text-amber-300">
                  <li>Realiza la transferencia de <strong>{formatCurrency(pagoVendedor.totalComisionesMes)}</strong> a {pagoVendedor.vendedorNombre}</li>
                  <li>Sube el comprobante de la transferencia</li>
                  <li>El vendedor recibirá una notificación automática</li>
                </ol>
              </div>

              {/* Upload area */}
              <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/40 px-6 py-8 text-center transition-colors hover:border-sky-500 hover:bg-sky-50 dark:border-[#26354a] dark:bg-[#131b26] dark:hover:border-[#38bdf8] dark:hover:bg-[#162333]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20 text-sky-500">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {fileName || "Subir comprobante"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">JPG, PNG o PDF · máx 5 MB</p>
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
            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-[#1e232e] px-6 py-4">
              <button onClick={() => setPagoVendedor(null)} className="rounded-xl border border-slate-200 bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:border-[#2a303d] dark:bg-[#1b1f28] dark:text-slate-200 dark:hover:bg-[#242a37] transition-colors">
                Cancelar
              </button>
              <button
                disabled={isPaying}
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0062ff] to-[#00aaff] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:from-[#0052df] hover:to-[#0088ee] disabled:opacity-50 disabled:pointer-events-none"
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
