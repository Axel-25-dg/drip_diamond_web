import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { httpClient } from "@/infrastructure/http/httpClient";
import { formatDate } from "@/presentation/utils/format";
import {
  ArrowLeft, Shield, AlertTriangle, Ban, Activity,
  RefreshCw, User, Globe, CheckCircle2, XCircle, Clock,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
interface IntentoLogin {
  id: number;
  username_intentado: string;
  ip: string;
  exitoso: boolean;
  fecha: string;
}
interface IPBloqueada {
  id: number;
  ip: string;
  motivo: string;
  bloqueada_en: string;
  desbloquear_en: string;
}
interface LogAuditoria {
  id: number;
  usuario: number | null;
  accion: string;
  modelo_afectado: string;
  objeto_id: string;
  detalle: string;
  ip: string | null;
  fecha: string;
}

function safeList<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data?.data && Array.isArray(data.data)) return data.data as T[];
  if (data?.results && Array.isArray(data.results)) return data.results as T[];
  return [];
}

/* ─── Page ──────────────────────────────────────────────── */
export default function AdminSecurityPage() {
  const [tab, setTab] = useState<"intentos" | "bloqueadas" | "auditoria">("intentos");

  const [intentos, setIntentos]         = useState<IntentoLogin[]>([]);
  const [bloqueadas, setBloqueadas]     = useState<IPBloqueada[]>([]);
  const [auditoria, setAuditoria]       = useState<LogAuditoria[]>([]);
  const [loading, setLoading]           = useState(false);
  const [lastRefresh, setLastRefresh]   = useState<Date>(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const [iRes, bRes, aRes] = await Promise.all([
        httpClient.get<any>("/seguridad/intentos-login/"),
        httpClient.get<any>("/seguridad/ips-bloqueadas/"),
        httpClient.get<any>("/seguridad/auditoria/"),
      ]);
      setIntentos(safeList<IntentoLogin>(iRes.data));
      setBloqueadas(safeList<IPBloqueada>(bRes.data));
      setAuditoria(safeList<LogAuditoria>(aRes.data));
      setLastRefresh(new Date());
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* Auto-refresh cada 30 segundos */
  useEffect(() => {
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  /* KPIs */
  const fallidosUltima1h = intentos.filter((i) => {
    return !i.exitoso && new Date(i.fecha) > new Date(Date.now() - 3_600_000);
  }).length;
  const ipsBloqueadasActivas = bloqueadas.filter(
    (b) => new Date(b.desbloquear_en) > new Date()
  ).length;
  const exitososHoy = intentos.filter((i) => {
    return i.exitoso && new Date(i.fecha) > new Date(new Date().setHours(0,0,0,0));
  }).length;

  /* Colors */
  const kpiCards = [
    { label: "IPs bloqueadas activas", value: ipsBloqueadasActivas, icon: Ban,           color: "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400",     border: "border-red-100 dark:border-red-900/40" },
    { label: "Intentos fallidos (1h)", value: fallidosUltima1h,      icon: AlertTriangle,  color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400", border: "border-amber-100 dark:border-amber-900/40" },
    { label: "Logins exitosos hoy",   value: exitososHoy,            icon: CheckCircle2,   color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-900/40" },
    { label: "Acciones auditadas",    value: auditoria.length,       icon: Activity,       color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-sky-400",   border: "border-blue-100 dark:border-blue-900/40" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="container-app py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link to="/admin" className="flex items-center gap-1 font-medium text-[var(--text-muted)] hover:text-blue-600 dark:hover:text-sky-400 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="font-semibold text-blue-600 dark:text-sky-400">Seguridad</span>
        </div>

        {/* Header */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-extrabold text-[var(--text-primary)] sm:text-3xl">
                  Panel de <span className="text-blue-600 dark:text-sky-400">Seguridad</span>
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Auto-actualiza cada 30s · Última actualización: {lastRefresh.toLocaleTimeString("es-EC")}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-blue-300 dark:hover:border-sky-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        {/* KPI Cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpiCards.map(({ label, value, icon: Icon, color, border }) => (
            <div key={label} className={`rounded-2xl border ${border} bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)]`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
              </div>
              <p className="mt-3 font-display text-3xl font-black text-[var(--text-primary)]">{value}</p>
            </div>
          ))}
        </div>

        {/* Alerta si hay IPs bloqueadas activas */}
        {ipsBloqueadasActivas > 0 && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-5 py-4">
            <Ban className="h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="font-semibold text-red-700 dark:text-red-400">
                {ipsBloqueadasActivas} IP{ipsBloqueadasActivas > 1 ? "s" : ""} bloqueada{ipsBloqueadasActivas > 1 ? "s" : ""} actualmente
              </p>
              <p className="text-xs text-red-500">El sistema bloqueó automáticamente estas IPs por múltiples intentos fallidos de login.</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-8 flex gap-0 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-1 w-fit">
          {([
            { key: "intentos",   label: `Intentos login (${intentos.length})`,  icon: Globe },
            { key: "bloqueadas", label: `IPs bloqueadas (${bloqueadas.length})`, icon: Ban },
            { key: "auditoria",  label: `Auditoría (${auditoria.length})`,       icon: Activity },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                tab === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {/* ── TAB: Intentos de login ── */}
        {tab === "intentos" && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--bg-border)] bg-[var(--bg-surface2)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <tr>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5">IP</th>
                    <th className="px-5 py-3.5">Usuario intentado</th>
                    <th className="px-5 py-3.5">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--bg-border)]">
                  {intentos.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-12 text-center text-[var(--text-muted)]">Sin registros</td></tr>
                  ) : intentos.slice(0, 100).map((i) => (
                    <tr key={i.id} className={`transition-colors hover:bg-[var(--bg-surface2)] ${!i.exitoso ? "bg-red-50/30 dark:bg-red-950/10" : ""}`}>
                      <td className="px-5 py-3.5">
                        {i.exitoso
                          ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40"><CheckCircle2 className="h-3 w-3" /> Exitoso</span>
                          : <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-950/30 px-2.5 py-0.5 text-[11px] font-bold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40"><XCircle className="h-3 w-3" /> Fallido</span>
                        }
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[var(--text-primary)]">{i.ip}</td>
                      <td className="px-5 py-3.5 text-[var(--text-secondary)]">{i.username_intentado || "—"}</td>
                      <td className="px-5 py-3.5 text-xs text-[var(--text-muted)]">{formatDate(i.fecha)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB: IPs bloqueadas ── */}
        {tab === "bloqueadas" && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--bg-border)] bg-[var(--bg-surface2)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <tr>
                    <th className="px-5 py-3.5">IP bloqueada</th>
                    <th className="px-5 py-3.5">Motivo</th>
                    <th className="px-5 py-3.5">Bloqueada en</th>
                    <th className="px-5 py-3.5">Desbloquea en</th>
                    <th className="px-5 py-3.5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--bg-border)]">
                  {bloqueadas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                          <p className="font-semibold text-[var(--text-primary)]">Sin IPs bloqueadas</p>
                          <p className="text-sm text-[var(--text-muted)]">El sistema está funcionando correctamente.</p>
                        </div>
                      </td>
                    </tr>
                  ) : bloqueadas.map((b) => {
                    const activa = new Date(b.desbloquear_en) > new Date();
                    return (
                      <tr key={b.id} className={`transition-colors hover:bg-[var(--bg-surface2)] ${activa ? "bg-red-50/30 dark:bg-red-950/10" : ""}`}>
                        <td className="px-5 py-3.5 font-mono font-bold text-[var(--text-primary)]">{b.ip}</td>
                        <td className="px-5 py-3.5 text-[var(--text-secondary)]">{b.motivo}</td>
                        <td className="px-5 py-3.5 text-xs text-[var(--text-muted)]">{formatDate(b.bloqueada_en)}</td>
                        <td className="px-5 py-3.5 text-xs text-[var(--text-muted)]">{formatDate(b.desbloquear_en)}</td>
                        <td className="px-5 py-3.5">
                          {activa
                            ? <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-950/30 px-2.5 py-0.5 text-[11px] font-bold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40"><Ban className="h-3 w-3" /> Activa</span>
                            : <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800/40 px-2.5 py-0.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700/50"><Clock className="h-3 w-3" /> Expirada</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB: Auditoría ── */}
        {tab === "auditoria" && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--bg-border)] bg-[var(--bg-surface2)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <tr>
                    <th className="px-5 py-3.5">Acción</th>
                    <th className="px-5 py-3.5">Usuario</th>
                    <th className="px-5 py-3.5">Modelo</th>
                    <th className="px-5 py-3.5">IP</th>
                    <th className="px-5 py-3.5">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--bg-border)]">
                  {auditoria.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-[var(--text-muted)]">Sin registros de auditoría</td></tr>
                  ) : auditoria.slice(0, 100).map((a) => (
                    <tr key={a.id} className="transition-colors hover:bg-[var(--bg-surface2)]">
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/30 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:text-sky-400 border border-blue-200 dark:border-blue-900/40">
                          {a.accion}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                          <User className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                          {a.usuario ?? "Sistema"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--text-secondary)]">{a.modelo_afectado || "—"}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-[var(--text-muted)]">{a.ip || "—"}</td>
                      <td className="px-5 py-3.5 text-xs text-[var(--text-muted)]">{formatDate(a.fecha)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
