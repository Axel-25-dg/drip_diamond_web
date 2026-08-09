import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { AdminStats } from "@/domain/entities/User";
import { Button } from "@/presentation/components/ui/Button";
import { Badge } from "@/presentation/components/ui/Badge";
import { formatCurrency } from "@/presentation/utils/format";
import {
  Package,
  Users,
  Mail,
  DollarSign,
  ShoppingBag,
  Clock,
  Plus,
  ArrowUpRight,
  Tag,
  Layers,
  Ruler,
  Sparkles,
  TrendingUp,
  Zap,
  Shield,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await useCases.getAdminStats.execute();
        setStats(res);
      } catch (error) {
        console.error("No se pudo cargar el dashboard del administrador:", error);
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container-app py-10">
      {/* HERO HEADER */}
      <div className="relative overflow-hidden rounded-[28px] p-[1px] animate-fade-in"
        style={{
          background:
            "linear-gradient(135deg, rgba(14,165,233,0.55), rgba(99,102,241,0.55) 50%, rgba(212,175,55,0.45))",
        }}
      >
        <div className="relative overflow-hidden rounded-[27px] bg-surf px-8 py-10 sm:px-12 sm:py-12">
          <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(14,165,233,0.22), transparent)" }}
          />
          <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(212,175,55,0.20), transparent)" }}
          />
          <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl animate-slide-up">
              <Badge tone="gold" className="mb-4">
                <Sparkles className="h-3 w-3" />
                Panel administrador · DRIP DIAMOND
              </Badge>
              <h1 className="font-display text-4xl sm:text-6xl leading-[1.02] tracking-tight">
                <span className="text-gradient-ink">Gestión Global</span>{" "}
                <span className="text-gradient-brand">DRIP DIAMOND</span>
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-secondary">
                Control central de catálogo, usuarios, campañas, comisiones y
                despacho. Todo en un solo lugar con herramientas de nivel
                enterprise.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-t">
                <span className="chip chip-accent">
                  <Zap className="h-3 w-3" /> En tiempo real
                </span>
                <span className="chip chip-success">
                  <Shield className="h-3 w-3" /> Modo seguro
                </span>
                <span className="chip chip-gold">
                  <TrendingUp className="h-3 w-3" /> Analytics listo
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 animate-slide-up delay-200">
              <Link to="/admin/productos/nuevo">
                <Button variant="secondary" size="lg">
                  <Plus className="h-4 w-4" /> Crear Zapatilla
                </Button>
              </Link>
              <Link to="/admin/campanas">
                <Button variant="outline" size="lg">
                  <Mail className="h-4 w-4" /> Campañas Email
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          tone="brand"
          title="Ventas Totales"
          value={isLoading ? "..." : formatCurrency(stats?.totalVentas ?? 0)}
          icon={<DollarSign className="h-6 w-6" />}
          change="+14% este mes"
          delta="up"
        />
        <MetricCard
          tone="purple"
          title="Pedidos Registrados"
          value={isLoading ? "..." : String(stats?.totalPedidos ?? 0)}
          icon={<ShoppingBag className="h-6 w-6" />}
          change={`${stats?.pedidosPendientes ?? 0} pendientes de pago`}
          delta="warn"
        />
        <MetricCard
          tone="green"
          title="Productos en Catálogo"
          value={isLoading ? "..." : String(stats?.productosActivos ?? 0)}
          icon={<Package className="h-6 w-6" />}
          change="Con variantes activas"
          delta="up"
        />
        <MetricCard
          tone="gold"
          title="Clientes & Vendedores"
          value={
            isLoading
              ? "..."
              : `${stats?.totalClientes ?? 0} / ${stats?.totalVendedores ?? 0}`
          }
          icon={<Users className="h-6 w-6" />}
          change="Clientes / Vendedores"
          delta="up"
        />
      </div>

      {/* ADMIN MODULES */}
      <div className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="animate-slide-up">
            <Badge tone="accent" className="mb-3">
              <Zap className="h-3 w-3" /> Módulos
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl text-gradient-ink">
              Módulos Administrativos
            </h2>
            <p className="mt-2 text-sm text-secondary max-w-xl">
              Accesos directos a cada sección del panel. Diseñado para que
              gestiones tu tienda sin fricciones.
            </p>
          </div>
          <span className="chip chip-accent animate-slide-up delay-150">
            8 módulos disponibles
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AdminModuleCard
            to="/admin/pedidos"
            title="Gestión de Pedidos"
            description="Avanza los pedidos por cada etapa: Preparando → Enviado (con guía) → Entregado. Comisión automática al vendedor."
            icon={<ShoppingBag className="h-8 w-8" />}
            badge="Flujo de despacho"
            tone="purple"
            delay="75ms"
          />
          <AdminModuleCard
            to="/admin/productos"
            title="Gestión de Catálogo"
            description="Crear y editar zapatillas, calidad, marcas, categorías y stock de variantes con control granular."
            icon={<Package className="h-8 w-8" />}
            badge="Catálogo & Inventario"
            tone="brand"
            delay="0ms"
          />
          <AdminModuleCard
            to="/admin/usuarios"
            title="Gestión de Usuarios & Roles"
            description="Registrar nuevos Vendedores o Contadores y administrar permisos de acceso fino."
            icon={<Users className="h-8 w-8" />}
            badge="Personal & Clientes"
            tone="brand"
            delay="150ms"
          />
          <AdminModuleCard
            to="/admin/campanas"
            title="Campañas Email Masivo"
            description="Crear y despachar promociones por Gmail / Resend a segmentos reales de usuarios."
            icon={<Mail className="h-8 w-8" />}
            badge="Marketing Masivo"
            tone="gold"
            delay="225ms"
          />
          <AdminModuleCard
            to="/admin/marcas"
            title="Gestión de Marcas"
            description="Crear, editar y eliminar marcas disponibles en el catálogo de zapatillas con logo propio."
            icon={<Tag className="h-8 w-8" />}
            badge="Catálogo"
            tone="rose"
            delay="300ms"
          />
          <AdminModuleCard
            to="/admin/categorias"
            title="Gestión de Categorías"
            description="Administra las categorías para clasificar y filtrar los productos con imágenes premium."
            icon={<Layers className="h-8 w-8" />}
            badge="Catálogo"
            tone="teal"
            delay="375ms"
          />
          <AdminModuleCard
            to="/admin/tallas"
            title="Gestión de Tallas"
            description="Registra tus tallas maestras (38, 39, 40…) y selecciónalas con un solo check en cada zapatilla."
            icon={<Ruler className="h-8 w-8" />}
            badge="Catálogo"
            tone="violet"
            delay="450ms"
          />
          <AdminModuleCard
            to="/contador"
            title="Panel Contabilidad & Pagos"
            description="Verificar comprobantes de depósito/transferencia y confirmar entregas de pedidos."
            icon={<Clock className="h-8 w-8" />}
            badge="Acceso Directo Contador"
            tone="green"
            delay="525ms"
          />
          <AdminModuleCard
            to="/vendedor"
            title="Panel Vendedor & Comisiones"
            description="Visualizar pedidos asignados y liquidaciones de $4.00 por par entregado con trazabilidad."
            icon={<DollarSign className="h-8 w-8" />}
            badge="Acceso Directo Vendedor"
            tone="indigo"
            delay="600ms"
          />
        </div>
      </div>

      <div className="h-16" />
    </div>
  );
}

/* ───────────────────────── Metric card ───────────────────────── */

const METRIC_TONES = {
  brand: {
    glow: "rgba(14,165,233,0.5)",
    iconBg:
      "linear-gradient(135deg, rgba(14,165,233,0.14), rgba(99,102,241,0.10))",
    iconBorder: "rgba(14,165,233,0.25)",
    iconColor: "#0284c7",
    valueGradient:
      "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
    accent: "text-sky-700",
    accentBg: "bg-sky-500/10",
  },
  purple: {
    glow: "rgba(139,92,246,0.45)",
    iconBg:
      "linear-gradient(135deg, rgba(139,92,246,0.14), rgba(124,58,237,0.10))",
    iconBorder: "rgba(139,92,246,0.25)",
    iconColor: "#7c3aed",
    valueGradient:
      "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
    accent: "text-violet-700",
    accentBg: "bg-violet-500/10",
  },
  green: {
    glow: "rgba(16,185,129,0.45)",
    iconBg:
      "linear-gradient(135deg, rgba(16,185,129,0.14), rgba(5,150,105,0.10))",
    iconBorder: "rgba(16,185,129,0.25)",
    iconColor: "#059669",
    valueGradient:
      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    accent: "text-emerald-700",
    accentBg: "bg-emerald-500/10",
  },
  gold: {
    glow: "rgba(212,175,55,0.45)",
    iconBg:
      "linear-gradient(135deg, rgba(244,207,87,0.18), rgba(212,175,55,0.12))",
    iconBorder: "rgba(212,175,55,0.30)",
    iconColor: "#9d7b1b",
    valueGradient:
      "linear-gradient(135deg, #d4af37 0%, #9d7b1b 100%)",
    accent: "text-yellow-800",
    accentBg: "bg-yellow-500/10",
  },
} as const;

function MetricCard({
  title,
  value,
  icon,
  change,
  tone,
  delta,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: string;
  tone: keyof typeof METRIC_TONES;
  delta?: "up" | "down" | "warn";
}) {
  const t = METRIC_TONES[tone];
  return (
    <div
      className="group relative overflow-hidden rounded-[22px] p-[1px] transition-all duration-300 hover:-translate-y-1 animate-slide-up"
      style={{
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.10), rgba(15,23,42,0.02) 30%, rgba(15,23,42,0.10))",
      }}
    >
      <div className="relative h-full rounded-[21px] bg-surf p-5 shadow-card transition-all duration-300 group-hover:shadow-card-hover">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: t.glow }}
        />

        <div className="relative flex items-start justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-t">
              {title}
            </span>
            <p
              className="mt-2 font-display text-3xl sm:text-[34px] leading-none"
              style={{
                background: t.valueGradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {value}
            </p>
          </div>
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              background: t.iconBg,
              borderColor: t.iconBorder,
              color: t.iconColor,
              boxShadow: "0 8px 24px -12px " + t.glow,
            }}
          >
            {icon}
          </div>
        </div>

        <div className="relative mt-4 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${t.accentBg} ${t.accent}`}>
            {delta === "up" && <TrendingUp className="h-3 w-3" />}
            {delta === "warn" && <Clock className="h-3 w-3" />}
            {change}
          </span>
          <span className="inline-flex h-1.5 w-12 overflow-hidden rounded-full bg-slate-200/60">
            <span
              className="inline-block h-full rounded-full"
              style={{
                width: delta === "warn" ? "55%" : "82%",
                background: t.valueGradient,
              }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Module card ───────────────────────── */

const MODULE_TONES = {
  brand: {
    iconBg: "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(56,189,248,0.06))",
    iconBorder: "rgba(14,165,233,0.18)",
    iconColor: "#0284c7",
    hoverBorder: "rgba(14,165,233,0.28)",
    hoverGlow: "rgba(14,165,233,0.18)",
    chipTone: "accent" as const,
  },
  purple: {
    iconBg: "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(56,189,248,0.06))",
    iconBorder: "rgba(14,165,233,0.18)",
    iconColor: "#0284c7",
    hoverBorder: "rgba(14,165,233,0.28)",
    hoverGlow: "rgba(14,165,233,0.18)",
    chipTone: "accent" as const,
  },
  green: {
    iconBg: "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(56,189,248,0.06))",
    iconBorder: "rgba(14,165,233,0.18)",
    iconColor: "#0284c7",
    hoverBorder: "rgba(14,165,233,0.28)",
    hoverGlow: "rgba(14,165,233,0.18)",
    chipTone: "accent" as const,
  },
  gold: {
    iconBg: "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(56,189,248,0.06))",
    iconBorder: "rgba(14,165,233,0.18)",
    iconColor: "#0284c7",
    hoverBorder: "rgba(14,165,233,0.28)",
    hoverGlow: "rgba(14,165,233,0.18)",
    chipTone: "accent" as const,
  },
  rose: {
    iconBg: "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(56,189,248,0.06))",
    iconBorder: "rgba(14,165,233,0.18)",
    iconColor: "#0284c7",
    hoverBorder: "rgba(14,165,233,0.28)",
    hoverGlow: "rgba(14,165,233,0.18)",
    chipTone: "accent" as const,
  },
  teal: {
    iconBg: "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(56,189,248,0.06))",
    iconBorder: "rgba(14,165,233,0.18)",
    iconColor: "#0284c7",
    hoverBorder: "rgba(14,165,233,0.28)",
    hoverGlow: "rgba(14,165,233,0.18)",
    chipTone: "accent" as const,
  },
  violet: {
    iconBg: "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(56,189,248,0.06))",
    iconBorder: "rgba(14,165,233,0.18)",
    iconColor: "#0284c7",
    hoverBorder: "rgba(14,165,233,0.28)",
    hoverGlow: "rgba(14,165,233,0.18)",
    chipTone: "accent" as const,
  },
  indigo: {
    iconBg: "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(56,189,248,0.06))",
    iconBorder: "rgba(14,165,233,0.18)",
    iconColor: "#0284c7",
    hoverBorder: "rgba(14,165,233,0.28)",
    hoverGlow: "rgba(14,165,233,0.18)",
    chipTone: "accent" as const,
  },
} as const;

function AdminModuleCard({
  to,
  title,
  description,
  icon,
  badge,
  tone,
  delay,
}: {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  tone: keyof typeof MODULE_TONES;
  delay?: string;
}) {
  const t = MODULE_TONES[tone];
  return (
    <Link
      to={to}
      style={{ animationDelay: delay }}
      className="group relative block h-full animate-slide-up"
    >
      <div
        className="absolute inset-0 rounded-[22px] opacity-0 blur transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, " + t.hoverGlow + ", transparent 70%)",
          transform: "translateY(-6px)",
        }}
      />
      <div
        className="relative h-full rounded-[22px] border bg-surf p-6 shadow-card transition-all duration-300 ease-out group-hover:-translate-y-1.5"
        style={{
          borderColor: "var(--card-border)",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget.style.borderColor = t.hoverBorder) as any)
        }
        onMouseLeave={(e) =>
          ((e.currentTarget.style.borderColor = "var(--card-border)") as any)
        }
      >
        <div className="flex items-start justify-between">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300 group-hover:scale-105"
            style={{
              background: t.iconBg,
              borderColor: t.iconBorder,
              color: t.iconColor,
            }}
          >
            {icon}
          </div>
          <Badge tone={t.chipTone}>{badge}</Badge>
        </div>

        <div className="mt-5">
          <h3 className="font-display text-xl sm:text-[22px] text-primary transition-colors duration-300 group-hover:text-[color:var(--accent,#0ea5e9)]">
            {title}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-secondary">
            {description}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wider transition-all duration-300"
            style={{ color: t.iconColor }}
          >
            Ingresar
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
          <span className="block h-[3px] w-10 overflow-hidden rounded-full bg-slate-200/70">
            <span
              className="block h-full w-0 rounded-full transition-all duration-500 group-hover:w-full"
              style={{
                background:
                  "linear-gradient(90deg, " + t.iconColor + ", " + t.iconColor + "aa)",
              }}
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
