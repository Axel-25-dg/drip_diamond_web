import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { AdminStats } from "@/domain/entities/User";
import { Button } from "@/presentation/components/ui/Button";
import { formatCurrency } from "@/presentation/utils/format";
import {
  Package, Users, Mail, DollarSign, ShoppingBag, Clock,
  Plus, ArrowUpRight, Tag, Layers, Ruler, TrendingUp, Zap,
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
    <div className="min-h-screen bg-sky-50">
      <div className="container-app py-10">
        <section className="rounded-[32px] border border-blue-100 bg-white p-8 shadow-[0_24px_70px_rgba(14,165,233,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Panel Administrador</p>
              <h1 className="mt-4 font-display text-4xl font-extrabold text-slate-900 sm:text-5xl">
                Control central de <span className="text-blue-600">Pedidos y Ventas</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Un tablero limpio para revisar en un vistazo pedidos, comisiones y operaciones con una interfaz clara y moderna.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/admin/productos/nuevo" className="min-w-[180px]">
                <Button variant="secondary" size="md" fullWidth>
                  <Plus className="h-4 w-4" /> Nuevo producto
                </Button>
              </Link>
              <Link to="/admin/campanas" className="min-w-[180px]">
                <Button variant="outline" size="md" fullWidth>
                  <Mail className="h-4 w-4" /> Campañas
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Ventas totales", value: isLoading ? "..." : formatCurrency(stats?.totalVentas ?? 0), icon: DollarSign },
              { label: "Pedidos totales", value: isLoading ? "..." : String(stats?.totalPedidos ?? 0), sub: `${stats?.pedidosPendientes ?? 0} pendientes`, icon: ShoppingBag },
              { label: "Productos activos", value: isLoading ? "..." : String(stats?.productosActivos ?? 0), icon: Package },
              { label: "Clientes / Vendedores", value: isLoading ? "..." : `${stats?.totalClientes ?? 0} / ${stats?.totalVendedores ?? 0}`, icon: Users },
            ].map(({ label, value, sub, icon: Icon }) => (
              <div key={label} className="rounded-[28px] border border-blue-100 bg-slate-50 p-6 shadow-[0_18px_45px_rgba(14,165,233,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600">{label}</p>
                    <p className="mt-3 font-display text-3xl font-extrabold text-slate-900">{value}</p>
                    {sub && <p className="mt-2 text-xs text-slate-500">{sub}</p>}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { to: "/admin/pedidos", title: "Gestión de Pedidos", desc: "Avanza pedidos: Preparando → Enviado → Entregado.", icon: ShoppingBag, badge: "Despacho" },
            { to: "/admin/productos", title: "Catálogo de Productos", desc: "Crea y edita zapatillas, precios, marcas y variantes.", icon: Package, badge: "Catálogo" },
            { to: "/admin/usuarios", title: "Usuarios & Roles", desc: "Vendedores, contadores, admins y clientes.", icon: Users, badge: "Personal" },
            { to: "/admin/campanas", title: "Campañas Email", desc: "Envía promociones masivas a segmentos reales.", icon: Mail, badge: "Marketing" },
            { to: "/admin/marcas", title: "Marcas", desc: "Gestiona las marcas disponibles en el catálogo.", icon: Tag, badge: "Catálogo" },
            { to: "/admin/categorias", title: "Categorías", desc: "Organiza productos por categorías con imágenes.", icon: Layers, badge: "Catálogo" },
            { to: "/admin/tallas", title: "Tallas", desc: "Administra las tallas maestras del sistema.", icon: Ruler, badge: "Catálogo" },
            { to: "/contador", title: "Contabilidad & Despacho", desc: "Verifica pagos y confirma entregas.", icon: Clock, badge: "Contador" },
            { to: "/vendedor", title: "Comisiones & Ventas", desc: "Panel de vendedores y liquidaciones mensuales.", icon: DollarSign, badge: "Vendedor" },
          ].map(({ to, title, desc, icon: Icon, badge }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col justify-between rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_18px_45px_rgba(14,165,233,0.08)] transition-all duration-200 hover:-translate-y-1 hover:border-blue-200"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                    {badge}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-600">
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
