import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { AdminStats } from "@/domain/entities/User";
import { Button } from "@/presentation/components/ui/Button";
import { formatCurrency } from "@/presentation/utils/format";
import {
  Package, Users, Mail, DollarSign, ShoppingBag, Clock,
  Plus, ArrowUpRight, Tag, Layers, Ruler, TrendingUp, Zap, Shield,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setStats(await useCases.getAdminStats.execute()); }
      catch { setStats(null); }
      finally { setIsLoading(false); }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0a0c10] dark:text-slate-100 transition-colors duration-200">
      <div className="container-app py-6 sm:py-10">
        <section className="rounded-[28px] sm:rounded-[32px] border border-blue-100 bg-white p-5 sm:p-8 shadow-sm dark:border-[#222732] dark:bg-[#12151c]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-400">Panel Administrador</p>
              <h1 className="mt-3 font-display text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
                Control central de <span className="text-blue-600 dark:text-[#38bdf8]">Pedidos y Ventas</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Un tablero limpio para revisar en un vistazo pedidos, comisiones y operaciones con una interfaz clara y moderna.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Link to="/admin/productos/nuevo" className="w-full sm:w-auto sm:min-w-[180px]">
                <Button variant="secondary" size="md" fullWidth>
                  <Plus className="h-4 w-4" /> Nuevo producto
                </Button>
              </Link>
              <Link to="/admin/campanas" className="w-full sm:w-auto sm:min-w-[180px]">
                <Button variant="outline" size="md" fullWidth>
                  <Mail className="h-4 w-4" /> Campañas
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 grid gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4">
            {[
              { label: "Ventas totales", value: isLoading ? "..." : formatCurrency(stats?.totalVentas ?? 0), icon: DollarSign },
              { label: "Pedidos totales", value: isLoading ? "..." : String(stats?.totalPedidos ?? 0), sub: `${stats?.pedidosPendientes ?? 0} pendientes`, icon: ShoppingBag },
              { label: "Productos activos", value: isLoading ? "..." : String(stats?.productosActivos ?? 0), icon: Package },
              { label: "Clientes / Vendedores", value: isLoading ? "..." : `${stats?.totalClientes ?? 0} / ${stats?.totalVendedores ?? 0}`, icon: Users },
            ].map(({ label, value, sub, icon: Icon }) => (
              <div key={label} className="rounded-[24px] sm:rounded-[28px] border border-blue-100 bg-slate-50 p-5 sm:p-6 shadow-sm dark:border-[#222732] dark:bg-[#171a22]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600 dark:text-sky-400">{label}</p>
                    <p className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{value}</p>
                    {sub && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
                  </div>
                  <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-sky-400">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 sm:mt-10 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {[
            { to: "/admin/pedidos", title: "Gestión de Pedidos", desc: "Avanza pedidos: Preparando → Enviado → Entregado.", icon: ShoppingBag, badge: "Despacho" },
            { to: "/admin/productos", title: "Catálogo de Productos", desc: "Crea y edita zapatillas, precios, marcas y variantes.", icon: Package, badge: "Catálogo" },
            { to: "/admin/usuarios", title: "Usuarios & Roles", desc: "Vendedores, contadores, admins y clientes.", icon: Users, badge: "Personal" },
            { to: "/admin/campanas", title: "Campañas Email", desc: "Envía promociones masivas a segmentos reales.", icon: Mail, badge: "Marketing" },
            { to: "/admin/marcas", title: "Marcas", desc: "Gestiona las marcas disponibles en el catálogo.", icon: Tag, badge: "Catálogo" },
            { to: "/admin/categorias", title: "Categorías", desc: "Organiza productos por categorías con imágenes.", icon: Layers, badge: "Catálogo" },
            { to: "/admin/tallas", title: "Tallas", desc: "Administra las tallas maestras del sistema.", icon: Ruler, badge: "Catálogo" },
            { to: "/admin/seguridad", title: "Panel de Seguridad", desc: "IPs bloqueadas, intentos de login y auditoría de acciones.", icon: Shield, badge: "Seguridad" },
            { to: "/contador", title: "Contabilidad & Despacho", desc: "Verifica pagos y confirma entregas.", icon: Clock, badge: "Contador" },
            { to: "/vendedor", title: "Comisiones & Ventas", desc: "Panel de vendedores y liquidaciones mensuales.", icon: DollarSign, badge: "Vendedor" },
          ].map(({ to, title, desc, icon: Icon, badge }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col justify-between rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm dark:border-[#222732] dark:bg-[#12151c] transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 dark:hover:border-slate-700"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-sky-400 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-600 dark:group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-sky-50 dark:bg-sky-950/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
                    {badge}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-sky-400">
                Ingresar
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
