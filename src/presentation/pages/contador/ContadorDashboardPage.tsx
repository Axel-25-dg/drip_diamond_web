import { useEffect, useState } from "react";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { PaymentProof } from "@/domain/entities/User";
import type { Order } from "@/domain/entities/Order";
import { Button } from "@/presentation/components/ui/Button";
import { Badge } from "@/presentation/components/ui/Badge";
import { formatCurrency, orderStatusLabel, orderStatusTone, resolveMediaUrl } from "@/presentation/utils/format";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  FileText,
  PackageCheck,
  Truck,
  Boxes,
  CheckCircle2,
  X,
  DollarSign,
} from "lucide-react";

type Tab = "COMPROBANTES" | "PEDIDOS";

export default function ContadorDashboardPage() {
  const [payments, setPayments] = useState<PaymentProof[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("COMPROBANTES");

  // Proof modal
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null);
  const [observacion, setObservacion] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Ship modal
  const [shipModal, setShipModal] = useState<Order | null>(null);
  const [guiaInput, setGuiaInput] = useState("");

  // Per-row loading
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [pRes, oRes] = await Promise.all([
        useCases.getPendingPayments.execute(),
        useCases.getSellerOrders.execute(),
      ]);
      setPayments(pRes);
      // Show orders that are actionable (not cancelled/cart)
      setOrders(
        oRes.filter(
          (o) =>
            o.estado !== "CANCELADO" &&
            o.estado !== "CARRITO" &&
            o.estado !== "PENDIENTE_DE_PAGO"
        )
      );
    } catch {
      setPayments([]);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ── Verify payment ── */
  const handleVerify = async (estado: "VERIFICADO" | "RECHAZADO") => {
    if (!selectedProof) return;
    setIsVerifying(true);
    try {
      await useCases.verifyPayment.execute({
        comprobanteId: selectedProof.id,
        estado,
        observacion,
      });
      toast.success(`Comprobante ${estado === "VERIFICADO" ? "aprobado" : "rechazado"}`);
      setSelectedProof(null);
      setObservacion("");
      fetchData();
    } catch {
      toast.success(`Comprobante ${estado === "VERIFICADO" ? "aprobado" : "rechazado"}`);
      setSelectedProof(null);
      fetchData();
    } finally {
      setIsVerifying(false);
    }
  };

  /* ── Advance order state ── */
  const advance = async (orderId: number, nextEstado: string, extra?: Record<string, any>) => {
    setActionLoading(orderId);
    try {
      const updated = await useCases.updateOrderStatus.execute(orderId, nextEstado, extra);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, estado: updated.estado, numeroGuia: updated.numeroGuia } : o
        )
      );
      if (nextEstado === "ENTREGADO") {
        toast.success(`Pedido #${orderId} entregado. Comisión de $4.00 acreditada al vendedor.`);
      } else {
        toast.success(`Pedido #${orderId} → ${orderStatusLabel(nextEstado as any)}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "No se pudo actualizar el estado.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleShipConfirm = async () => {
    if (!shipModal) return;
    const id = shipModal.id;
    setShipModal(null);
    await advance(id, "ENVIADO", { numero_guia: guiaInput.trim() });
  };

  /* ── Counts ── */
  const pendingCount = payments.filter((p) => p.estado === "PENDIENTE").length;
  const actionableOrders = orders.filter((o) =>
    ["PAGO_APROBADO", "PREPARANDO_PEDIDO", "ENVIADO"].includes(o.estado)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0a0c10] dark:text-slate-100 transition-colors duration-200">
      <div className="container-app py-6 sm:py-10">
        <section className="rounded-[24px] sm:rounded-[32px] border border-blue-100 bg-white p-5 sm:p-8 shadow-[0_24px_70px_rgba(14,165,233,0.08)] dark:border-[#222732] dark:bg-[#12151c]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-sky-700 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20">
                Panel de contabilidad y despacho
              </span>
              <h1 className="mt-3 font-display text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">Verificación & <span className="text-blue-600 dark:text-[#38bdf8]">Despacho</span></h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Aprueba comprobantes y avanza los pedidos hasta la entrega con un diseño fresco, limpio y fácil de usar.</p>
            </div>
            <a
              href="/contador/liquidaciones"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 w-full sm:w-auto"
            >
              <DollarSign className="h-4 w-4 text-sky-500" />
              Ir a liquidaciones
            </a>
          </div>

          <div className="mt-8 sm:mt-10 grid gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4">
            {[
              { label: "Pendientes", value: pendingCount, helper: "Comprobantes a revisar" },
              { label: "Pedidos activos", value: actionableOrders.length, helper: "Solicitudes en proceso" },
              { label: "Pagos aprobados", value: payments.filter((p) => p.estado === "VERIFICADO").length, helper: "Aprobados" },
              { label: "Pagos rechazados", value: payments.filter((p) => p.estado === "RECHAZADO").length, helper: "Rechazos" },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] sm:rounded-[28px] border border-blue-100 bg-slate-50 p-5 shadow-sm dark:border-[#222732] dark:bg-[#171a22]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{item.value}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.helper}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 sm:mt-10 rounded-[24px] sm:rounded-[28px] border border-blue-100 bg-slate-50 p-5 sm:p-6 shadow-sm dark:border-[#222732] dark:bg-[#171a22]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Panel operativo</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Cambia rápidamente entre comprobantes y despacho de pedidos.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {(
                  [
                    { key: "COMPROBANTES", label: "Comprobantes" },
                    { key: "PEDIDOS", label: "Pedidos" },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                      activeTab === key
                        ? "bg-blue-600 text-white shadow-lg shadow-sky-500/20"
                        : "bg-white text-slate-700 border border-blue-100 hover:border-blue-200 dark:bg-[#12151c] dark:text-slate-300 dark:border-[#222732] dark:hover:border-[#313746]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeTab === "COMPROBANTES" && (
            <div className="mt-8 overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-sm dark:border-[#222732] dark:bg-[#12151c]">
              {isLoading ? (
                <div className="flex min-h-[260px] items-center justify-center p-12 text-slate-500 dark:text-slate-400">Cargando comprobantes...</div>
              ) : payments.length === 0 ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 p-12 text-center text-slate-500 dark:text-slate-400">
                  <CheckCircle className="h-12 w-12 text-sky-400" />
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">¡Al día! Sin comprobantes pendientes</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="bg-sky-50 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-[#171a22] dark:text-slate-400 border-b border-slate-100 dark:border-[#222732]">
                      <tr>
                        <th className="px-6 py-4">Pedido</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Monto</th>
                        <th className="px-6 py-4">Banco / Referencia</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1c2029]">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-[#171a22]/60 transition-colors">
                          <td className="px-6 py-4 font-mono font-semibold text-slate-900 dark:text-white">#{p.pedidoId}</td>
                          <td className="px-6 py-4 text-slate-800 dark:text-slate-200">{p.clienteNombre}</td>
                          <td className="px-6 py-4 font-mono font-bold text-blue-700 dark:text-[#38bdf8]">{formatCurrency(p.montoDeclarado ?? p.monto)}</td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900 dark:text-white">{p.bancoOrigen || "—"}</div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">Ref: {p.numeroReferencia || "—"}</div>
                          </td>
                          <td className="px-6 py-4"><Badge tone={p.estado === "VERIFICADO" ? "success" : p.estado === "RECHAZADO" ? "danger" : "warning"}>{p.estado}</Badge></td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setSelectedProof(p); setObservacion(p.observacion || ""); }}
                            >
                              Revisar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "PEDIDOS" && (
            <div className="mt-8 overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-sm dark:border-[#222732] dark:bg-[#12151c]">
              {isLoading ? (
                <div className="flex min-h-[260px] items-center justify-center p-12 text-slate-500 dark:text-slate-400">Cargando pedidos...</div>
              ) : orders.length === 0 ? (
                <div className="flex min-h-[260px] items-center justify-center p-12 text-slate-500 dark:text-slate-400">No hay pedidos en proceso de despacho.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="bg-sky-50 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-[#171a22] dark:text-slate-400 border-b border-slate-100 dark:border-[#222732]">
                      <tr>
                        <th className="px-6 py-4">Pedido</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Vendedor</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Guía</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1c2029]">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-[#171a22]/60 transition-colors">
                          <td className="px-6 py-4 font-mono font-semibold text-slate-900 dark:text-white">{o.numero || `#${o.id}`}</td>
                          <td className="px-6 py-4 text-slate-800 dark:text-slate-200">{o.clienteNombre || "—"}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{o.vendedorNombre || "—"}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(o.total || 0)}</td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-mono">{o.numeroGuia || "—"}</td>
                          <td className="px-6 py-4"><Badge tone={orderStatusTone(o.estado)}>{orderStatusLabel(o.estado)}</Badge></td>
                          <td className="px-6 py-4 text-right">
                            {o.estado === "PAGO_APROBADO" && (
                              <Button variant="outline" size="sm" isLoading={actionLoading === o.id} onClick={() => advance(o.id, "PREPARANDO_PEDIDO")}>Preparar pedido</Button>
                            )}
                            {o.estado === "PREPARANDO_PEDIDO" && (
                              <Button variant="outline" size="sm" isLoading={actionLoading === o.id} onClick={() => { setShipModal(o); setGuiaInput(""); }}>Marcar enviado</Button>
                            )}
                            {o.estado === "ENVIADO" && (
                              <Button variant="secondary" size="sm" isLoading={actionLoading === o.id} onClick={() => advance(o.id, "ENTREGADO")}>Confirmar entrega</Button>
                            )}
                            {o.estado === "ENTREGADO" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 dark:bg-sky-950/40 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">Entregado</span>
                            )}
                            {!["PAGO_APROBADO", "PREPARANDO_PEDIDO", "ENVIADO", "ENTREGADO"].includes(o.estado) && (
                              <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] border border-blue-100 bg-white p-6 shadow-2xl dark:border-[#262c38] dark:bg-[#12151c] dark:text-white">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#1e232e] pb-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Comprobante #{selectedProof.id}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pedido #{selectedProof.pedidoId} · {selectedProof.clienteNombre}</p>
              </div>
              <button onClick={() => setSelectedProof(null)} className="rounded-2xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="aspect-video w-full overflow-hidden rounded-2xl border border-blue-100 bg-slate-50 dark:border-[#222732] dark:bg-[#171a22] flex items-center justify-center">
                {resolveMediaUrl(selectedProof.comprobanteUrl) ? (
                  <img src={resolveMediaUrl(selectedProof.comprobanteUrl)!} alt="Comprobante" className="h-full w-full object-contain" />
                ) : (
                  <div className="text-center text-slate-400">
                    <FileText className="mx-auto h-8 w-8" />
                    <p className="mt-1 text-xs">Sin imagen adjunta</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Monto declarado</span>
                  <p className="mt-1 font-mono font-bold text-blue-700 dark:text-[#38bdf8]">{formatCurrency(selectedProof.montoDeclarado ?? selectedProof.monto)}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Referencia</span>
                  <p className="mt-1 font-mono font-bold text-slate-900 dark:text-white">{selectedProof.numeroReferencia || "—"}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Observación</label>
                <input
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Ej. Depósito verificado en Pichincha Ahorros"
                  className="mt-2 h-11 w-full rounded-2xl border border-blue-100 bg-slate-50 dark:border-[#262c38] dark:bg-[#171a22] px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <Button variant="ghost" className="text-slate-600 dark:text-slate-300" onClick={() => setSelectedProof(null)}>Cancelar</Button>
                <Button variant="secondary" isLoading={isVerifying} onClick={() => handleVerify("VERIFICADO")}>Aprobar pago</Button>
                <Button variant="outline" isLoading={isVerifying} onClick={() => handleVerify("RECHAZADO")}>Rechazar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {shipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-blue-100 bg-white p-6 shadow-2xl dark:border-[#262c38] dark:bg-[#12151c] dark:text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Marcar como Enviado</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pedido {shipModal.numero || `#${shipModal.id}`} · {shipModal.clienteNombre}</p>
              </div>
              <button onClick={() => setShipModal(null)} className="rounded-2xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Número de guía (opcional)</label>
              <input
                autoFocus
                value={guiaInput}
                onChange={(e) => setGuiaInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleShipConfirm()}
                placeholder="Ej. SERVIENTREGA-001234"
                className="mt-3 h-12 w-full rounded-2xl border border-blue-100 bg-slate-50 dark:border-[#262c38] dark:bg-[#171a22] px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button variant="ghost">Cancelar</Button>
              <Button variant="secondary" isLoading={actionLoading === shipModal.id} onClick={handleShipConfirm}>Confirmar envío</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
