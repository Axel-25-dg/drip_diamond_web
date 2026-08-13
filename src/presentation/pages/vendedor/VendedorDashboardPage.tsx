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
  const [pendingComisiones, setPendingComisiones] = useState<import("@/domain/ports/AdminRepositoryPort").ComisionItem[]>([]);
  const [activeTab, setActiveTab] = useState<"ventas" | "por_liquidar" | "pagadas">("ventas");
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
  const [uploadingLiqId, setUploadingLiqId] = useState<number | null>(null);

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
        // fetch pending comisiones separately
        try {
          const pend = await useCases.getComisionesPendientes.execute(user?.id);
          setPendingComisiones(pend || []);
        } catch (err) {
          setPendingComisiones([]);
        }
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

  // Helper: compute delivered orders that are not yet included in any comision record
  const allComisionPedidoIds = new Set<number>();
  liquidaciones.forEach((l) => l.comisiones?.forEach((c) => allComisionPedidoIds.add(c.pedidoId)));
  pendingComisiones.forEach((c) => allComisionPedidoIds.add(c.pedidoId));

  const deliveredUnliquidatedOrders = orders.filter(
    (o) => o.estado === "ENTREGADO" && !allComisionPedidoIds.has(o.id)
  );

  const derivedPendingFromOrders = deliveredUnliquidatedOrders.map((o) => ({
    id: -o.id, // synthetic id (negative to avoid collision)
    pedidoId: o.id,
    vendedorId: user?.id || -1,
    cantidadPares: o.items.reduce((s, it) => s + it.cantidad, 0),
    montoPorPar: 4,
    monto: o.items.reduce((s, it) => s + it.cantidad, 0) * 4,
    estado: "PENDIENTE" as const,
    generadaEn: o.creadoEn || new Date().toISOString(),
  }));

  const pendingList = [...pendingComisiones, ...derivedPendingFromOrders];

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
      <section className="rounded-[32px] border border-slate-200 bg-white p-10 shadow-[0_24px_70px_rgba(15,118,255,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 border border-sky-200">
              Panel de vendedor profesional
            </span>
            <h1 className="mt-4 text-4xl font-semibold text-slate-900 sm:text-5xl">Mis ventas y <span className="text-sky-600">comisiones</span></h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Controla tus pedidos, comisiones y tus ventas asistidas desde una interfaz clara y fácil de leer.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/catalogo">
              <Button variant="secondary" size="lg" className="shadow-lg shadow-sky-500/20 font-bold">
                <Plus className="h-4 w-4" /> Realizar venta asistida
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* BANNER: VENTA ASISTIDA INFO & REFERRAL LINK */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,118,255,0.08)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Venta asistida</p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">Convierte tus contactos en comisiones</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Cada venta que registras queda asignada a tu cuenta y te acerca a tu meta mensual.</p>
            </div>
            <div className="inline-flex items-center gap-3 rounded-3xl bg-sky-50 px-4 py-3 text-sky-700">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">+ $4.00 por par</span>
            </div>
          </div>
        </div>

        {/* REFERRAL LINK BOX */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,118,255,0.08)]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mi link de vendedor</p>
              <p className="mt-3 text-sm text-slate-700 break-all">{referralLink}</p>
            </div>
            <Share2 className="h-5 w-5 text-sky-500" />
          </div>
          <Button variant="secondary" size="sm" onClick={copyReferral} className="mt-6 w-full justify-center">
            <Copy className="h-3.5 w-3.5" /> Copiar link
          </Button>
        </div>
      </div>

      {/* KPI STATS */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Saldo por cobrar", value: formatCurrency(totalCommissions), note: `${totalPairs} pares entregados`, icon: <DollarSign className="h-6 w-6 text-sky-600" /> },
          { label: "Ya cobrado", value: formatCurrency(comisionesPagadas), note: "Liquidaciones pagadas", icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" /> },
          { label: "Por liquidar", value: formatCurrency(comisionesPendientes), note: `${pendingPairs} pares en camino`, icon: <TrendingUp className="h-6 w-6 text-sky-600" /> },
          { label: "Pedidos asignados", value: orders.length.toString(), note: `${deliveredOrders.length} finalizados`, icon: <ShoppingBag className="h-6 w-6 text-sky-500" /> },
        ].map((card) => (
          <div key={card.label} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,118,255,0.06)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{card.label}</p>
              <div className="rounded-xl bg-slate-100 p-2.5">{card.icon}</div>
            </div>
            <p className="mt-5 text-4xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.note}</p>
          </div>
        ))}
      </div>

      {/* MAIN: show different tables depending on selected tab */}
      <section className="mt-10 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,118,255,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Mis ventas y comisiones</h2>
            <p className="mt-2 text-sm text-slate-500">Filtra y revisa tus ventas según estado o liquidación.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente, ciudad o ID..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-sky-500"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-sky-500"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ENTREGADO">Entregados</option>
              <option value="PENDIENTE">En camino / pendientes</option>
            </select>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
          <div className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab("ventas")}
                  className={`rounded-full px-4 py-2 ${activeTab === "ventas" ? "bg-sky-600 text-white" : "bg-white text-slate-700 border"}`}
                >
                  Ventas totales ({orders.length})
                </button>
                <button
                  onClick={() => setActiveTab("por_liquidar")}
                  className={`rounded-full px-4 py-2 ${activeTab === "por_liquidar" ? "bg-sky-600 text-white" : "bg-white text-slate-700 border"}`}
                >
                  Ventas por liquidar ({pendingList.length})
                </button>
                <button
                  onClick={() => setActiveTab("pagadas")}
                  className={`rounded-full px-4 py-2 ${activeTab === "pagadas" ? "bg-sky-600 text-white" : "bg-white text-slate-700 border"}`}
                >
                  Ventas pagadas ({liquidaciones.filter((l) => l.pagada).length})
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Total por liquidar:</span>
                <span className="font-semibold">{formatCurrency(pendingList.reduce((s, c) => s + c.monto, 0))}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">Vista de solo lectura: el contador se encarga de generar y pagar liquidaciones.</p>
          </div>

          {isLoading && (
            <div className="flex min-h-[260px] items-center justify-center p-12 text-slate-500">Cargando datos...</div>
          )}

          {!isLoading && activeTab === "ventas" && (
            (filteredOrders.length === 0) ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 p-12 text-center text-slate-500">
                <ShoppingBag className="h-12 w-12 text-slate-300" />
                <p className="text-xl font-semibold text-slate-900">No hay pedidos que coincidan</p>
                <p className="text-sm">Usa la venta asistida para registrar pedidos a nombre de tus clientes.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-600">
                  <thead className="bg-white text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Pedido ID</th>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Pares</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Comisión</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-slate-50">
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
                        <tr key={o.id} className="hover:bg-slate-100/80">
                          <td className="px-6 py-4 font-mono font-semibold text-slate-900">#{o.id}</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">{o.clienteNombre || "Cliente Drip"}</p>
                            <p className="text-xs text-slate-500">{o.ciudad ? `${o.ciudad}, ${o.provincia || ""}` : "Ecuador"}</p>
                            <p className="mt-1 text-xs text-slate-400">{o.telefonoContacto || "Sin teléfono registrado"}</p>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700">{orderPairs} par(es)</td>
                          <td className="px-6 py-4 font-mono font-semibold text-slate-900">{formatCurrency(o.total ?? o.montoTotal ?? 0)}</td>
                          <td className="px-6 py-4"><Badge tone={o.estado === "ENTREGADO" ? "success" : "info"}>{o.estado}</Badge></td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 border border-sky-100">
                              {o.estado === "ENTREGADO" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                              {formatCurrency(commission)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {whatsappUrl && (
                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
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
            )
          )}

          {!isLoading && activeTab === "por_liquidar" && (
            <div className="grid gap-4 p-4">
              {liquidaciones.filter((l) => !l.pagada).length > 0 && (
                <div className="space-y-3">
                  {liquidaciones.filter((l) => !l.pagada).map((liq) => (
                    <article key={liq.id} className="overflow-hidden rounded-[12px] border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][liq.periodoMes - 1]} {liq.periodoAnio}</div>
                          <div className="text-sm text-slate-600">{liq.totalPares} pares · {formatCurrency(liq.totalComisiones)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {liq.comprobanteUrl && (
                            <a href={resolveMediaUrl(liq.comprobanteUrl) ?? "#"} target="_blank" rel="noreferrer" className="text-sm text-sky-600 underline">Ver comprobante</a>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {pendingList.length === 0 ? (
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">No hay comisiones pendientes por liquidar.</div>
              ) : (
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-white text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      <tr>
                        <th className="px-6 py-3">Pedido</th>
                        <th className="px-6 py-3">Pares</th>
                        <th className="px-6 py-3">$/par</th>
                        <th className="px-6 py-3">Comisión</th>
                        <th className="px-6 py-3">Origen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-slate-50">
                      {pendingList.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-100/80">
                          <td className="px-6 py-3 font-mono">#{c.pedidoId}</td>
                          <td className="px-6 py-3">{c.cantidadPares}</td>
                          <td className="px-6 py-3 font-mono">{formatCurrency(c.montoPorPar)}</td>
                          <td className="px-6 py-3 font-semibold">{formatCurrency(c.monto)}</td>
                          <td className="px-6 py-3 text-xs text-slate-500">{c.id < 0 ? "Venta reciente" : "Sistema"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!isLoading && activeTab === "pagadas" && (
            <div className="grid gap-4 p-4">
              {liquidaciones.filter((l) => l.pagada).length === 0 ? (
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">No hay liquidaciones pagadas aún.</div>
              ) : (
                <>
                  {liquidaciones.filter((l) => l.pagada).map((liq) => (
                    <article key={liq.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-sm p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][liq.periodoMes - 1]} {liq.periodoAnio}</div>
                          <div className="text-sm text-slate-600">{liq.totalPares} pares · {formatCurrency(liq.totalComisiones)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {liq.comprobanteUrl ? (
                            <a href={resolveMediaUrl(liq.comprobanteUrl) ?? "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100">
                              <ExternalLink className="h-4 w-4" /> Ver comprobante
                            </a>
                          ) : (
                            <span className="text-xs text-muted-t">—</span>
                          )}
                        </div>
                      </div>
                      {liq.comisiones && liq.comisiones.length > 0 && (
                        <div className="mt-3 text-sm text-slate-600">{liq.comisiones.length} pedido(s) incluidos</div>
                      )}
                    </article>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Removed duplicate 'Mis liquidaciones' section: views are integrated into the main tabbed area above. */}

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
