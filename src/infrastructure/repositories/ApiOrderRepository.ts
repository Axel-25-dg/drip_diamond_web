import { httpClient } from "@/infrastructure/http/httpClient";
import type { OrderRepositoryPort } from "@/domain/ports/OrderRepositoryPort";
import type { CreateOrderPayload, Order, ShippingZone } from "@/domain/entities/Order";
import type { Seller } from "@/domain/entities/User";
import { toOrder, toShippingZone } from "@/infrastructure/adapters/order.adapter";
import { toSeller } from "@/infrastructure/adapters/auth.adapter";

function safeUnwrap<T>(data: any): T {
  if (data && "success" in data && "data" in data) return data.data as T;
  return data as T;
}

function toList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload?.results) return payload.results as T[];
  return [] as T[];
}

export class ApiOrderRepository implements OrderRepositoryPort {
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const body: Record<string, any> = {
      vendedor: payload.vendedorId ?? null,
      vendedor_id: payload.vendedorId ?? null,
      tipo_entrega: payload.tipoEntrega ?? "DOMICILIO",
      direccion_envio: payload.direccionEnvio,
      referencia_adicional: payload.referenciaAdicional ?? payload.notas ?? "",
      ciudad: payload.ciudad,
      provincia: payload.provincia || "Pichincha",
      telefono_contacto: payload.telefonoContacto || "",
    };

    const { data } = await httpClient.post<any>("/pedidos/", body);
    return toOrder(safeUnwrap(data));
  }

  async getOrders(): Promise<Order[]> {
    const { data } = await httpClient.get<any>("/pedidos/");
    return toList<any>(safeUnwrap(data)).map(toOrder);
  }

  async getOrderById(id: number): Promise<Order> {
    const { data } = await httpClient.get<any>(`/pedidos/${id}/`);
    return toOrder(safeUnwrap(data));
  }

  async uploadComprobante(pedidoId: number, archivo: File): Promise<Order> {
    const formData = new FormData();
    formData.append("comprobante", archivo);
    const { data } = await httpClient.post<any>(`/pedidos/${pedidoId}/subir-comprobante/`, formData);
    return toOrder(safeUnwrap(data));
  }

  async getActiveSellers(): Promise<Seller[]> {
    try {
      const { data } = await httpClient.get<any>("/usuarios/vendedores/activos/");
      return toList<any>(safeUnwrap(data)).map(toSeller);
    } catch {
      return [];
    }
  }

  async getShippingZones(): Promise<ShippingZone[]> {
    try {
      const { data } = await httpClient.get<any>("/costos-envio/");
      return toList<any>(safeUnwrap(data)).map(toShippingZone);
    } catch {
      return [];
    }
  }
}
