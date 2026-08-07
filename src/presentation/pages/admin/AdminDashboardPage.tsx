import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { AdminStats } from "@/domain/entities/User";
import { Button } from "@/presentation/components/ui/Button";
import { formatCurrency } from "@/presentation/utils/format";
import { Package, Users, Mail, DollarSign, ShoppingBag, Clock, Plus, ArrowUpRight } from "lucide-react";

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
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-600 border border-sky-400/20">
              Panel administrador
            </span>
          </div>
          <h1 className="mt-2 font-display text-4xl text-slate-900 sm:text-5xl">
            GESTIÓN GLOBAL <span className="text-accent">DRIP DIAMOND</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Control central de catálogo, usuarios, comisiones y despacho.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/admin/productos/nuevo">
            <Button variant="secondary" className="shadow-md shadow-sky-500/20">
              <Plus className="h-4 w-4" /> Crear Zapatilla
            </Button>
          </Link>
          <Link to="/admin/campanas">
            <Button variant="outline">
              <Mail className="h-4 w-4" /> Campañas Email
            </Button>
          </Link>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Ventas Totales"
          value={isLoading ? "..." : formatCurrency(stats?.totalVentas ?? 0)}
          icon={<DollarSign className="h-6 w-6 text-sky-500" />}
          change="+14% este mes"
        />
        <MetricCard
          title="Pedidos Registrados"
          value={isLoading ? "..." : String(stats?.totalPedidos ?? 0)}
          icon={<ShoppingBag className="h-6 w-6 text-purple-500" />}
          change={`${stats?.pedidosPendientes ?? 0} pendientes de pago`}
        />
        <MetricCard
          title="Productos en Catálogo"
          value={isLoading ? "..." : String(stats?.productosActivos ?? 0)}
          icon={<Package className="h-6 w-6 text-emerald-500" />}
          change="Con variantes activas"
        />
        <MetricCard
          title="Clientes & Vendedores"
          value={isLoading ? "..." : `${stats?.totalClientes ?? 0} / ${stats?.totalVendedores ?? 0}`}
          icon={<Users className="h-6 w-6 text-amber-500" />}
          change="Clientes / Vendedores"
        />
      </div>

      {/* QUICK ACCESS GRID */}
      <div className="mt-12">
        <h2 className="font-display text-2xl text-slate-900">Módulos Administrativos</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AdminModuleCard
            to="/admin/productos"
            title="Gestión de Catálogo"
            description="Crear y editar zapatillas, calidad, marcas, categorías y stock de variantes."
            icon={<Package className="h-8 w-8 text-sky-500" />}
            badge="Catálogo & Inventario"
          />

          <AdminModuleCard
            to="/admin/usuarios"
            title="Gestión de Usuarios & Roles"
            description="Registrar nuevos Vendedores o Contadores y administrar permisos."
            icon={<Users className="h-8 w-8 text-purple-500" />}
            badge="Personal & Clientes"
          />

          <AdminModuleCard
            to="/admin/campanas"
            title="Campañas Email Masivo"
            description="Crear y despachar promociones por Gmail / Resend a segmentos de usuarios."
            icon={<Mail className="h-8 w-8 text-amber-500" />}
            badge="Marketing Masivo"
          />

          <AdminModuleCard
            to="/contador"
            title="Panel de Contabilidad & Pagos"
            description="Verificar comprobantes de depósito/transferencia y confirmar entregas."
            icon={<Clock className="h-8 w-8 text-emerald-500" />}
            badge="Acceso Directo Contador"
          />

          <AdminModuleCard
            to="/vendedor"
            title="Panel de Vendedor & Comisiones"
            description="Visualizar pedidos asignados y liquidaciones de $4.00 por par entregado."
            icon={<DollarSign className="h-8 w-8 text-indigo-500" />}
            badge="Acceso Directo Vendedor"
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  change,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
        <div className="rounded-xl bg-slate-50 p-2.5">{icon}</div>
      </div>
      <p className="mt-3 font-display text-3xl text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-semibold text-sky-600">{change}</p>
    </div>
  );
}

function AdminModuleCard({
  to,
  title,
  description,
  icon,
  badge,
}: {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl"
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="rounded-2xl bg-slate-100 p-3 transition-colors group-hover:bg-sky-50">{icon}</div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {badge}
          </span>
        </div>
        <h3 className="mt-4 font-display text-2xl text-slate-900 group-hover:text-sky-600">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>

      <div className="mt-6 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-sky-600">
        Ingresar <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  );
}
