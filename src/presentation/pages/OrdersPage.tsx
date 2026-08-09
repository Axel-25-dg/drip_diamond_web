import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Package, UploadCloud } from "lucide-react";
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
      <h1 className="font-display text-4xl">Mis pedidos</h1>

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
    </div>
  );
}
