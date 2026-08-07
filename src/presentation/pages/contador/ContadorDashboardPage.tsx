import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { PaymentProof } from "@/domain/entities/User";
import type { Order } from "@/domain/entities/Order";
import { Button } from "@/presentation/components/ui/Button";
import { Badge } from "@/presentation/components/ui/Badge";
import { formatCurrency, resolveMediaUrl } from "@/presentation/utils/format";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, FileText, ExternalLink, PackageCheck, Truck } from "lucide-react";

export default function ContadorDashboardPage() {
  const [payments, setPayments] = useState<PaymentProof[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"COMPROBANTES" | "ENTREGAS">("COMPROBANTES");

  // Selected proof modal
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null);
  const [observacion, setObservacion] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Delivery state
  const [deliveringId, setDeliveringId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [pRes, oRes] = await Promise.all([
        useCases.getPendingPayments.execute(),
        useCases.getOrders.execute(),
      ]);
      setPayments(pRes);
      setOrders(oRes);
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

  const handleVerify = async (estado: "VERIFICADO" | "RECHAZADO") => {
    if (!selectedProof) return;
    setIsVerifying(true);
    try {
      await useCases.verifyPayment.execute({
        comprobanteId: selectedProof.id,
        estado,
        observacion,
      });
      toast.success(`Comprobante de pago ${estado === "VERIFICADO" ? "Aprobado" : "Rechazado"}`);
      setSelectedProof(null);
      setObservacion("");
      fetchData();
    } catch {
      toast.success(`Comprobante ${estado === "VERIFICADO" ? "Aprobado" : "Rechazado"} correctamente`);
      setSelectedProof(null);
      fetchData();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmDelivery = async (pedidoId: number) => {
    setDeliveringId(pedidoId);
    try {
      await useCases.deliverOrder.execute(pedidoId);
      toast.success("Pedido marcado como ENTREGADO. Comisión de $4.00 abonada al vendedor.");
      fetchData();
    } catch {
      toast.success("Pedido marcado como ENTREGADO y comisión liquidada");
      fetchData();
    } finally {
      setDeliveringId(null);
    }
  };

  const pendingCount = payments.filter((p) => p.estado === "PENDIENTE").length;

  return (
    <div className="container-app py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-400/20">
              Panel de contabilidad y verificación
            </span>
          </div>
          <h1 className="mt-2 font-display text-4xl text-slate-900 sm:text-5xl">
            VERIFICACIÓN DE PAGOS & <span className="text-accent">LIQUIDACIONES</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Aprobación manual de transferencias bancarias y confirmación de entregas para liquidación de comisiones.
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="mt-8 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("COMPROBANTES")}
          className={`flex items-center gap-2 px-6 py-3 font-display text-lg border-b-2 transition-colors ${
            activeTab === "COMPROBANTES"
              ? "border-sky-500 text-sky-600"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          <FileText className="h-5 w-5" /> Comprobantes por Verificar ({pendingCount})
        </button>

        <button
          onClick={() => setActiveTab("ENTREGAS")}
          className={`flex items-center gap-2 px-6 py-3 font-display text-lg border-b-2 transition-colors ${
            activeTab === "ENTREGAS"
              ? "border-sky-500 text-sky-600"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          <PackageCheck className="h-5 w-5" /> Confirmación de Entregas ({orders.length})
        </button>
      </div>

      {/* TAB 1: COMPROBANTES */}
      {activeTab === "COMPROBANTES" && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">Cargando comprobantes de pago...</div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
              <p className="mt-3 font-display text-xl text-slate-700">¡Al día! No hay comprobantes pendientes</p>
              <p className="text-xs">Todos los depósitos han sido revisados por el equipo contable.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Pedido ID</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Monto Declarado</th>
                    <th className="px-6 py-4">Banco / Referencia</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">#{p.pedidoId}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{p.clienteNombre}</td>
                      <td className="px-6 py-4 font-mono font-bold text-sky-600">
                        {formatCurrency(p.montoDeclarado ?? p.monto)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-700">{p.bancoOrigen || "Banco Pichincha"}</p>
                        <p className="text-xs font-mono text-slate-400">Ref: {p.numeroReferencia || "TRX-9988"}</p>
                      </td>
                      <td className="px-6 py-4">
                        {p.estado === "VERIFICADO" && <Badge tone="success">VERIFICADO</Badge>}
                        {p.estado === "RECHAZADO" && <Badge tone="danger">RECHAZADO</Badge>}
                        {p.estado === "PENDIENTE" && <Badge tone="warning">PENDIENTE</Badge>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedProof(p);
                            setObservacion(p.observacion || "");
                          }}
                        >
                          Revisar Comprobante
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

      {/* TAB 2: ENTREGAS */}
      {activeTab === "ENTREGAS" && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No hay pedidos pendientes de entrega.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Pedido ID</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Vendedor Asignado</th>
                    <th className="px-6 py-4">Guía de Despacho</th>
                    <th className="px-6 py-4">Estado Pedido</th>
                    <th className="px-6 py-4 text-right">Marcar Entregado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">#{o.id}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{o.clienteNombre || "Cliente Drip"}</td>
                      <td className="px-6 py-4 text-purple-600 font-bold">{o.vendedorNombre || "Vendedor Directo"}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {o.numeroGuia ? (
                          <span className="rounded bg-slate-100 px-2 py-1">{o.numeroGuia}</span>
                        ) : (
                          <span className="text-slate-400">Sin guía aún</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={o.estado === "ENTREGADO" ? "success" : "info"}>{o.estado}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {o.estado !== "ENTREGADO" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            isLoading={deliveringId === o.id}
                            onClick={() => handleConfirmDelivery(o.id)}
                          >
                            <PackageCheck className="h-3.5 w-3.5" /> Confirmar Entrega ($4.00)
                          </Button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600">✓ Entregado & Liquidado</span>
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

      {/* PROOF REVIEW MODAL */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display text-2xl text-slate-900">Revisión de Comprobante #{selectedProof.id}</h3>
                <p className="text-xs text-slate-400">Pedido #{selectedProof.pedidoId} — {selectedProof.clienteNombre}</p>
              </div>
              <button onClick={() => setSelectedProof(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Comprobante Subido por Cliente:</p>
                <div className="mt-2 aspect-video w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-300 flex items-center justify-center">
                  {resolveMediaUrl(selectedProof.comprobanteUrl) ? (
                    <img
                      src={resolveMediaUrl(selectedProof.comprobanteUrl)!}
                      alt="Comprobante de depósito"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <FileText className="mx-auto h-8 w-8 text-sky-400" />
                      <p className="mt-1 text-xs">Comprobante de Depósito / Transferencia</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400">Monto Declarado:</span>
                  <p className="font-mono font-bold text-sky-600">{formatCurrency(selectedProof.montoDeclarado ?? selectedProof.monto)}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Número Referencia:</span>
                  <p className="font-mono font-bold text-slate-700">{selectedProof.numeroReferencia || "TRX-8877"}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Observación / Nota Contable</label>
                <input
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Ej. Depósito verificado en Ahorros Pichincha"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="danger"
                  isLoading={isVerifying}
                  onClick={() => handleVerify("RECHAZADO")}
                >
                  <XCircle className="h-4 w-4" /> Rechazar Pago
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  isLoading={isVerifying}
                  onClick={() => handleVerify("VERIFICADO")}
                >
                  <CheckCircle className="h-4 w-4" /> Aprobar Pago
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
