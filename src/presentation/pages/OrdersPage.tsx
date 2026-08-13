import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Package, UploadCloud, X } from "lucide-react";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Order } from "@/domain/entities/Order";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { EmptyState } from "@/presentation/components/ui/EmptyState";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button } from "@/presentation/components/ui/Button";
import { formatCurrency, formatDate, orderStatusLabel, orderStatusTone } from "@/presentation/utils/format";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState("");
  const [showStatePanel, setShowStatePanel] = useState(false);
  const [panelStatus, setPanelStatus] = useState<string>("PENDIENTE_DE_PAGO");

  useEffect(() => {
    useCases.getOrders
      .execute()
      .then(setOrders)
      .catch(() => toast.error("No se pudo cargar tu historial de pedidos."))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Spinner full />;

  return (
    <div className="container-app py-8 lg:py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">Mis pedidos</h1>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setShowStatePanel(true)}>Ver estado</Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Package className="h-12 w-12" />}
            title="Aún no tienes pedidos"
            description="Cuando compres, tu historial aparecerá aquí."
            action={
              <Link to="/catalogo">
                <Button variant="secondary" size="lg">
                  Ir al catálogo
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id}>
              <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-600 font-bold shadow-sm">
                    {order.numero}
                  </div>
                  <div>
                    <p className="font-semibold">Pedido {order.numero}</p>
                    <p className="text-xs text-ink/50">{formatDate(order.creadoEn)}</p>
                  </div>
                </div>

                <div className="ml-auto flex items-center gap-4">
                  <Badge tone={orderStatusTone(order.estado)} className="px-3 py-1.5 rounded-full">{orderStatusLabel(order.estado)}</Badge>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(order.total)}</div>
                    {(order.estado === "PENDIENTE_DE_PAGO" || order.estado === "PAGO_RECHAZADO") && (
                      <Link to={`/pedidos/${order.id}`}>
                        <button className="mt-2 inline-flex items-center gap-2 rounded-full bg-sky-600 px-3 py-1 text-sm font-semibold text-white">
                          <UploadCloud className="h-4 w-4" />
                          Enviar comprobante
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showStatePanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl border border-theme bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-display text-2xl">Estado de pedidos</h3>
              <button onClick={() => setShowStatePanel(false)} className="rounded-lg p-1 text-muted-t hover:bg-surf2">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-4">
              <div className="w-48">
                {["PENDIENTE_DE_PAGO","COMPROBANTE_ENVIADO","PAGO_EN_REVISION","PREPARANDO_PEDIDO","ENVIADO","ENTREGADO","CANCELADO"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPanelStatus(s)}
                    className={`mb-2 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${panelStatus === s ? 'bg-sky-100 text-sky-700' : 'bg-white text-secondary'}`}
                  >
                    {orderStatusLabel(s as any)}
                  </button>
                ))}
              </div>

              <div className="flex-1">
                <div className="mb-3 text-sm text-secondary">Mostrando: <strong>{orderStatusLabel(panelStatus as any)}</strong></div>
                <div className="flex flex-col gap-3">
                  {orders.filter(o => o.estado === panelStatus).map(o => (
                    <div key={o.id} className="flex items-center justify-between gap-3 rounded-lg border border-theme bg-white p-3">
                      <div>
                        <p className="font-semibold">Pedido #{o.numero}</p>
                        <p className="text-xs text-secondary">{formatDate(o.creadoEn)}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(o.total)}</div>
                      </div>
                    </div>
                  ))}
                  {orders.filter(o => o.estado === panelStatus).length === 0 && (
                    <div className="text-sm text-secondary">No hay pedidos con ese estado.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
