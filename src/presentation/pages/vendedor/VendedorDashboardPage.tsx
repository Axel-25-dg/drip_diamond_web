import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import { useAuthStore } from "@/presentation/store/authStore";
import type { Order } from "@/domain/entities/Order";
import type { CommissionReport } from "@/domain/entities/User";
import type { Liquidacion } from "@/domain/ports/AdminRepositoryPort";
import { Button } from "@/presentation/components/ui/Button";
import { Badge } from "@/presentation/components/ui/Badge";
import { formatAddressForDisplay, formatCurrency, resolveMediaUrl } from "@/presentation/utils/format";
import { toast } from "sonner";
import {
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Copy,
  Plus,
  MessageCircle,
  Search,
  Target,
  Share2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
} from "lucide-react";

export default function VendedorDashboardPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [commissions, setCommissions] = useState<CommissionReport[]>([]);
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [commissionSummary, setCommissionSummary] = useState<{
    totalComisiones: number;
    comisionesPendientes: number;
    comisionesPagadas: number;
    ventasEntregadas: number;
    ventasAsignadas: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("TODOS");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedLiq, setExpandedLiq] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [oRes, cRes, summaryRes, liqRes] = await Promise.all([
          useCases.getSellerOrders.execute(user?.id),
          useCases.getCommissionReport.execute(),
          useCases.getSellerCommissionSummary.execute(),
          useCases.getLiquidaciones.execute(user?.id),
        ]);
        setOrders(oRes);
        setCommissions(cRes);
        setCommissionSummary(summaryRes);
        setLiquidaciones(liqRes);
      } catch {
        setOrders([]);
        setCommissions([]);
        setCommissionSummary(null);
        setLiquidaciones([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user?.id]);

  const deliveredOrders = orders.filter((o) => o.estado === "ENTREGADO");
  const totalPairs = deliveredOrders.reduce(
    (acc, o) => acc + o.items.reduce((sum, item) => sum + item.cantidad, 0),
    0
  );

  // Use server data if available, otherwise calculate locally
  const totalCommissions = commissionSummary?.totalComisiones ?? totalPairs * 4;
  const comisionesPagadas = commissionSummary?.comisionesPagadas ?? 0;
  const comisionesPendientes = commissionSummary?.comisionesPendientes ?? (totalCommissions - comisionesPagadas);

  // Pairs in transit (active orders not yet delivered or cancelled)
  const pendingPairs = orders
    .filter((o) => !["ENTREGADO", "CANCELADO", "PAGO_RECHAZADO"].includes(o.estado))
    .reduce((acc, o) => acc + o.items.reduce((sum, item) => sum + item.cantidad, 0), 0);

  // Monthly target: 50 pairs
  const monthlyGoal = 50;
  const progressPercent = Math.min(Math.round((totalPairs / monthlyGoal) * 100), 100);

  const referralLink = `${window.location.origin}/catalogo?ref=VEND-${user?.id || 1}`;

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("¡Link de vendedor copiado al portapapeles!");
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toString().includes(search) ||
      (o.clienteNombre && o.clienteNombre.toLowerCase().includes(search.toLowerCase())) ||
      (o.ciudad && o.ciudad.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      selectedStatus === "TODOS" ||
      (selectedStatus === "ENTREGADO" && o.estado === "ENTREGADO") ||
      (selectedStatus === "PENDIENTE" && o.estado !== "ENTREGADO" && o.estado !== "CANCELADO");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container-app py-10">
      {/* HEADER WITH QUICK VENTA ASISTIDA BUTTON */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-600 border border-purple-400/20">
              Panel de vendedor profesional
            </span>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-sky-400">
              {user?.nombre} {user?.apellido}
            </span>
          </div>
          <h1 className="mt-2 font-display text-4xl text-slate-900 sm:text-5xl">
            MIS VENTAS & <span className="text-accent">COMISIONES</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Comisiones de <strong>$4.00 USD por par entregado</strong> · Venta asistida directa.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/catalogo">
            <Button variant="secondary" size="lg" className="shadow-lg shadow-sky-500/20 font-bold">
              <Plus className="h-4 w-4" /> Realizar venta asistida
            </Button>
          </Link>
        </div>
      </div>

      {/* BANNER: VENTA ASISTIDA INFO & REFERRAL LINK */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-900 to-slate-900 p-6 text-white shadow-xl relative overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-400/20 blur-2xl" />
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-sky-500/20 p-2.5 text-sky-300">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-2xl text-white">¿Cómo realizar Ventas Asistidas?</h3>
              <p className="mt-1 text-sm text-sky-100 max-w-xl">
                Al comprar cualquier zapatilla para un cliente estando logueado con tu cuenta de Vendedor,
                la venta queda asignada automáticamente a ti y **aseguras tu comisión de $4.00 por par**.
              </p>
            </div>
          </div>
        </div>

        {/* REFERRAL LINK BOX */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mi Link de Vendedor</span>
              <Share2 className="h-4 w-4 text-sky-500" />
            </div>
            <p className="mt-2 text-xs text-slate-400 font-mono truncate bg-slate-50 p-2 rounded-lg border border-slate-200">
              {referralLink}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={copyReferral} className="mt-4 w-full justify-center">
            <Copy className="h-3.5 w-3.5" /> Copiar Link de Referido
          </Button>
        </div>
      </div>

      {/* KPI STATS */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Saldo por cobrar</span>
            <div className="rounded-xl bg-purple-100 p-2.5">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
            <p className="mt-3 font-display text-4xl text-slate-900">{formatCurrency(totalCommissions)}</p>
          <p className="mt-1 text-xs font-semibold text-purple-600">
            {totalPairs} pares entregados × $4.00 — solo pedidos <strong>ENTREGADO</strong>
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Ya cobrado</span>
            <div className="rounded-xl bg-emerald-100 p-2.5">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
            <p className="mt-3 font-display text-4xl text-slate-900">{formatCurrency(comisionesPagadas)}</p>
          <p className="mt-1 text-xs font-semibold text-emerald-700">Liquidaciones pagadas</p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Por liquidar</span>
            <div className="rounded-xl bg-amber-100 p-2.5">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
          </div>
            <p className="mt-3 font-display text-4xl text-slate-900">{formatCurrency(comisionesPendientes)}</p>
          <p className="mt-1 text-xs font-semibold text-amber-700">
            {pendingPairs} pares en camino · se acredita al entregar
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pedidos Asignados</span>
            <div className="rounded-xl bg-slate-100 p-2.5">
              <ShoppingBag className="h-6 w-6 text-sky-500" />
            </div>
          </div>
          <p className="mt-3 font-display text-4xl text-slate-900">{orders.length}</p>
          <p className="mt-1 text-xs font-semibold text-sky-600">{deliveredOrders.length} finalizados</p>
        </div>

        {/* MONTHLY TARGET PROGRESS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Meta Mensual (50 Pares)</span>
            <Target className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-3 font-display text-4xl text-slate-900">{progressPercent}%</p>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{totalPairs} de {monthlyGoal} pares alcanzados</p>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="mt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl text-slate-900">Mis Pedidos & Clientes Asignados</h2>

          {/* FILTERS & SEARCH */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente, ciudad o ID..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-sky-500"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="ENTREGADO">Entregados (Comisión Liquidada)</option>
              <option value="PENDIENTE">En Camino / Pendientes</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">Cargando pedidos asignados...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-3 font-display text-xl text-slate-700">No hay pedidos que coincidan</p>
              <p className="text-xs">Usa la venta asistida para registrar pedidos a nombre de tus clientes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Pedido ID</th>
                    <th className="px-6 py-4">Cliente & Ubicación</th>
                    <th className="px-6 py-4">Pares Comprados</th>
                    <th className="px-6 py-4">Total Venta</th>
                    <th className="px-6 py-4">Estado Pedido</th>
                    <th className="px-6 py-4">Comisión ($4.00/par)</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((o) => {
                    const orderPairs = o.items.reduce((sum, item) => sum + item.cantidad, 0);
                    const commission = orderPairs * 4;
                    const cleanPhone = o.telefonoContacto ? o.telefonoContacto.replace(/\D/g, "") : "";
                    const whatsappUrl = cleanPhone
                      ? `https://wa.me/593${cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(
                          `¡Hola ${o.clienteNombre || ""}! Te saludo de Drip Diamond sobre tu pedido #${o.id}.`
                        )}`
                      : null;

                    return (
                      <tr key={o.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">#{o.id}</td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{o.clienteNombre || "Cliente Drip"}</p>
                          <p className="text-xs text-slate-400">{o.ciudad ? `${o.ciudad}, ${o.provincia || ""}` : "Ecuador"}</p>
                          <p className="mt-1 text-xs text-slate-500">{o.telefonoContacto || "Sin teléfono registrado"}</p>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-700 font-medium">
                          {orderPairs} par(es)
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          {formatCurrency(o.total ?? o.montoTotal ?? 0)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge tone={o.estado === "ENTREGADO" ? "success" : "info"}>{o.estado}</Badge>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-purple-700">
                          {o.estado === "ENTREGADO" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 border border-sky-100">
                              <CheckCircle2 className="h-3.5 w-3.5 text-sky-700" /> +{formatCurrency(commission)} acreditado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 border border-sky-100">
                              <Clock className="h-3.5 w-3.5 text-sky-700" /> +{formatCurrency(commission)} al entregar
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {whatsappUrl && (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                title="Contactar por WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(o)}>
                              Ver Detalle
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── LIQUIDACIONES ── */}
      <div className="mt-12 border-t border-theme pt-10">
        <h2 className="font-display text-2xl text-primary mb-1">Mis liquidaciones</h2>
        <p className="text-sm text-secondary mb-5">
          El contador genera la liquidación mensual. Cuando realizan la transferencia la marcan como <strong>Pagada</strong> y recibes una notificación.
        </p>

        {liquidaciones.length === 0 ? (
          <div className="rounded-2xl border border-theme bg-surf p-10 text-center text-secondary">
            <DollarSign className="mx-auto h-10 w-10 text-muted-t mb-3" />
            <p className="font-display text-xl">Aún no tienes liquidaciones</p>
            <p className="text-sm mt-1 text-muted-t">
              El contador generará tu primera liquidación al cerrar el mes.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {liquidaciones.map((liq) => (
              <div key={liq.id} className="overflow-hidden rounded-2xl border border-theme bg-surf shadow-card">
                <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-primary">
                        {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][liq.periodoMes - 1]} {liq.periodoAnio}
                      </span>
                      {liq.pagada ? (
                        <Badge tone="success" className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Pagada</Badge>
                      ) : (
                        <Badge tone="warning">Pendiente de pago</Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-4 text-sm">
                      <span className="text-muted-t">{liq.totalPares} pares entregados</span>
                      <span className="font-mono font-bold text-primary">{formatCurrency(liq.totalComisiones)}</span>
                      {liq.fechaPago && (
                        <span className="text-xs text-emerald-600">
                          Pagado el {new Date(liq.fechaPago).toLocaleDateString("es-EC")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {liq.comprobanteUrl && (
                      <a
                        href={resolveMediaUrl(liq.comprobanteUrl) ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-100 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" /> Ver comprobante
                      </a>
                    )}
                    {(liq.comisiones?.length ?? 0) > 0 && (
                      <button
                        onClick={() => setExpandedLiq(expandedLiq === liq.id ? null : liq.id)}
                        className="flex items-center gap-1 rounded-lg border border-theme px-2 py-1.5 text-xs text-muted-t hover:bg-surf2 transition-colors"
                      >
                        {expandedLiq === liq.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        {liq.comisiones?.length} pedidos
                      </button>
                    )}
                  </div>
                </div>

                {expandedLiq === liq.id && liq.comisiones && liq.comisiones.length > 0 && (
                  <div className="border-t border-theme bg-surf2 px-5 py-4">
                    <table className="w-full text-sm">
                      <thead className="text-xs font-bold uppercase tracking-wider text-muted-t">
                        <tr>
                          <th className="pb-2 text-left">Pedido</th>
                          <th className="pb-2 text-left">Pares</th>
                          <th className="pb-2 text-left">$/par</th>
                          <th className="pb-2 text-right">Comisión</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme">
                        {liq.comisiones.map((c) => (
                          <tr key={c.id}>
                            <td className="py-2 font-mono text-primary">#{c.pedidoId}</td>
                            <td className="py-2 text-secondary">{c.cantidadPares}</td>
                            <td className="py-2 font-mono text-secondary">{formatCurrency(c.montoPorPar)}</td>
                            <td className="py-2 text-right font-mono font-bold text-primary">{formatCurrency(c.monto)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-theme">
                          <td colSpan={3} className="pt-2 text-xs font-bold text-muted-t">Total</td>
                          <td className="pt-2 text-right font-mono font-bold text-primary">{formatCurrency(liq.totalComisiones)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display text-2xl text-slate-900">Pedido #{selectedOrder.id}</h3>
                <p className="text-xs text-slate-400">Cliente: {selectedOrder.clienteNombre || "Cliente Drip"}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Zapatillas Compradas:</p>
                <div className="mt-2 space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm bg-white p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <p className="font-semibold text-slate-900">{item.nombre}</p>
                        <p className="text-xs text-slate-400">Talla US {item.talla} · {item.color}</p>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-900">
                        {item.cantidad} x {formatCurrency(item.precioUnitario)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs text-slate-400">Cliente:</span>
                  <p className="font-medium text-slate-800">{selectedOrder.clienteNombre || "Cliente Drip"}</p>
                  <p className="text-xs text-slate-500">{selectedOrder.ciudad || "Quito"}, {selectedOrder.provincia || "Pichincha"}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Teléfono Contacto:</span>
                  <p className="font-mono font-bold text-slate-800">{selectedOrder.telefonoContacto || "—"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-slate-400">Dirección de Envío:</span>
                  <p className="font-medium text-slate-800">{formatAddressForDisplay(selectedOrder.direccionEnvio) || "Dirección de cliente"}</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="secondary" onClick={() => setSelectedOrder(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
