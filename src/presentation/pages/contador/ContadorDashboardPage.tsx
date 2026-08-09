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
    <div className="container-app py-10">
      {/* Header */}
      <div className="border-b border-theme pb-6">
        <span className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-400/20">
          Panel de contabilidad y despacho
        </span>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl text-primary">
          Verificación & <span className="text-gradient-brand">Despacho</span>
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Aprueba comprobantes y avanza los pedidos hasta la entrega. La comisión
          se acredita al vendedor al marcar <strong>Entregado</strong>.
        </p>
        <div className="mt-4">
          <a
            href="/contador/liquidaciones"
            className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300"
          >
            <DollarSign className="h-4 w-4" />
            Gestionar liquidaciones y pagos a vendedores →
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-theme">
        {(
          [
            { key: "COMPROBANTES", label: "Comprobantes de Pago", icon: <FileText className="h-4 w-4" />, count: pendingCount },
            { key: "PEDIDOS", label: "Despacho de Pedidos", icon: <PackageCheck className="h-4 w-4" />, count: actionableOrders.length },
          ] as const
        ).map(({ key, label, icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === key
                ? "border-sky-500 text-sky-600 dark:text-sky-400"
                : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            {icon}
            {label}
            {count > 0 && (
              <span className="ml-1 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Comprobantes ── */}
      {activeTab === "COMPROBANTES" && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-theme bg-surf shadow-card">
          {isLoading ? (
            <div className="p-12 text-center text-secondary">Cargando comprobantes...</div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
              <p className="mt-3 font-display text-xl text-primary">
                ¡Al día! Sin comprobantes pendientes
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-theme text-xs font-bold uppercase tracking-wider text-muted-t">
                  <tr>
                    <th className="px-6 py-4">Pedido</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Monto</th>
                    <th className="px-6 py-4">Banco / Referencia</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-surf2 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-primary">#{p.pedidoId}</td>
                      <td className="px-6 py-4 font-semibold text-primary">{p.clienteNombre}</td>
                      <td className="px-6 py-4 font-mono font-bold text-sky-600">
                        {formatCurrency(p.montoDeclarado ?? p.monto)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-primary">{p.bancoOrigen || "—"}</p>
                        <p className="text-xs text-muted-t font-mono">Ref: {p.numeroReferencia || "—"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={p.estado === "VERIFICADO" ? "success" : p.estado === "RECHAZADO" ? "danger" : "warning"}>
                          {p.estado}
                        </Badge>
                      </td>
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

      {/* ── TAB 2: Despacho ── */}
      {activeTab === "PEDIDOS" && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-theme bg-surf shadow-card">
          {isLoading ? (
            <div className="p-12 text-center text-secondary">Cargando pedidos...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-secondary">
              No hay pedidos en proceso de despacho.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-theme text-xs font-bold uppercase tracking-wider text-muted-t">
                  <tr>
                    <th className="px-5 py-4">Pedido</th>
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Vendedor</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Guía</th>
                    <th className="px-5 py-4">Estado actual</th>
                    <th className="px-5 py-4 text-right">Siguiente paso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-surf2 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-primary">
                        {o.numero || `#${o.id}`}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-primary">{o.clienteNombre || "—"}</p>
                        <p className="text-xs text-muted-t">{o.ciudad || ""}</p>
                      </td>
                      <td className="px-5 py-4 text-secondary">
                        {o.vendedorNombre || <span className="text-muted-t">—</span>}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-primary">
                        {formatCurrency(o.total || 0)}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-muted-t">
                        {o.numeroGuia || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={orderStatusTone(o.estado)}>
                          {orderStatusLabel(o.estado)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {o.estado === "PAGO_APROBADO" && (
                          <Button
                            variant="outline"
                            size="sm"
                            isLoading={actionLoading === o.id}
                            onClick={() => advance(o.id, "PREPARANDO_PEDIDO")}
                            className="flex items-center gap-1.5"
                          >
                            <Boxes className="h-3.5 w-3.5" />
                            Preparar pedido
                          </Button>
                        )}
                        {o.estado === "PREPARANDO_PEDIDO" && (
                          <Button
                            variant="outline"
                            size="sm"
                            isLoading={actionLoading === o.id}
                            onClick={() => { setShipModal(o); setGuiaInput(""); }}
                            className="flex items-center gap-1.5"
                          >
                            <Truck className="h-3.5 w-3.5" />
                            Marcar enviado
                          </Button>
                        )}
                        {o.estado === "ENVIADO" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            isLoading={actionLoading === o.id}
                            onClick={() => advance(o.id, "ENTREGADO")}
                            className="flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Confirmar entrega
                          </Button>
                        )}
                        {o.estado === "ENTREGADO" && (
                          <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Entregado</span>
                        )}
                        {!["PAGO_APROBADO", "PREPARANDO_PEDIDO", "ENVIADO", "ENTREGADO"].includes(o.estado) && (
                          <span className="text-xs text-muted-t">—</span>
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

      {/* ── Proof modal ── */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-theme bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-theme pb-4">
              <div>
                <h3 className="font-display text-2xl text-primary">
                  Comprobante #{selectedProof.id}
                </h3>
                <p className="text-xs text-muted-t">
                  Pedido #{selectedProof.pedidoId} · {selectedProof.clienteNombre}
                </p>
              </div>
              <button
                onClick={() => setSelectedProof(null)}
                className="rounded-lg p-1 text-muted-t hover:bg-surf2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="aspect-video w-full overflow-hidden rounded-xl border border-theme bg-surf2 flex items-center justify-center">
                {resolveMediaUrl(selectedProof.comprobanteUrl) ? (
                  <img
                    src={resolveMediaUrl(selectedProof.comprobanteUrl)!}
                    alt="Comprobante"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-muted-t">
                    <FileText className="mx-auto h-8 w-8" />
                    <p className="mt-1 text-xs">Sin imagen adjunta</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-t">Monto declarado</span>
                  <p className="font-mono font-bold text-sky-600">
                    {formatCurrency(selectedProof.montoDeclarado ?? selectedProof.monto)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-t">Referencia</span>
                  <p className="font-mono font-bold text-primary">
                    {selectedProof.numeroReferencia || "—"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-t">
                  Observación
                </label>
                <input
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Ej. Depósito verificado en Pichincha Ahorros"
                  className="mt-1 h-10 w-full rounded-xl border border-theme bg-surf2 px-3 text-sm text-primary outline-none focus:border-sky-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="danger"
                  isLoading={isVerifying}
                  onClick={() => handleVerify("RECHAZADO")}
                >
                  <XCircle className="h-4 w-4" /> Rechazar
                </Button>
                <Button
                  variant="secondary"
                  isLoading={isVerifying}
                  onClick={() => handleVerify("VERIFICADO")}
                >
                  <CheckCircle className="h-4 w-4" /> Aprobar pago
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Ship modal ── */}
      {shipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-theme bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-2xl text-primary">Marcar como Enviado</h3>
                <p className="text-xs text-muted-t">
                  Pedido {shipModal.numero || `#${shipModal.id}`} ·{" "}
                  {shipModal.clienteNombre}
                </p>
              </div>
              <button
                onClick={() => setShipModal(null)}
                className="rounded-lg p-1 text-muted-t hover:bg-surf2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-t">
                Número de guía (opcional)
              </label>
              <input
                autoFocus
                value={guiaInput}
                onChange={(e) => setGuiaInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleShipConfirm()}
                placeholder="Ej. SERVIENTREGA-001234"
                className="mt-2 h-11 w-full rounded-xl border border-theme bg-surf2 px-4 text-sm text-primary outline-none focus:border-sky-400"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" size="lg" onClick={() => setShipModal(null)}>
                Cancelar
              </Button>
              <Button
                variant="secondary"
                size="lg"
                isLoading={actionLoading === shipModal.id}
                onClick={handleShipConfirm}
              >
                <Truck className="h-4 w-4" /> Confirmar envío
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
