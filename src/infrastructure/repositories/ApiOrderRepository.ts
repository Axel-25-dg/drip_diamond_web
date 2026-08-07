import { httpClient, unwrap, type ApiEnvelope } from "@/infrastructure/http/httpClient";
import type { OrderRepositoryPort } from "@/domain/ports/OrderRepositoryPort";
import type { CreateOrderPayload, Order, ShippingZone } from "@/domain/entities/Order";
import type { Seller } from "@/domain/entities/User";
import type { OrderDTO, ShippingZoneDTO } from "@/application/dtos/order.dto";
import type { PaginatedDTO } from "@/application/dtos/catalog.dto";
import type { SellerDTO } from "@/application/dtos/auth.dto";
import { toOrder, toShippingZone } from "@/infrastructure/adapters/order.adapter";
import { toSeller } from "@/infrastructure/adapters/auth.adapter";

export class ApiOrderRepository implements OrderRepositoryPort {
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const body: Record<string, any> = {
      vendedor_id: payload.vendedorId ?? null,
      tipo_entrega: payload.tipoEntrega ?? "DOMICILIO",
      direccion_envio: payload.direccionEnvio,
      referencia_adicional: payload.referenciaAdicional ?? payload.notas ?? "",
      ciudad: payload.ciudad,
    };

    if (payload.provincia) body.provincia = payload.provincia;
    if (payload.telefonoContacto) body.telefono_contacto = payload.telefonoContacto;
    if (payload.notas && !payload.referenciaAdicional) body.referencia_adicional = payload.notas;

    const { data } = await httpClient.post<ApiEnvelope<OrderDTO>>("/pedidos/", body);
    return toOrder(unwrap(data));
  }

  async getOrders(): Promise<Order[]> {
    const { data } = await httpClient.get<ApiEnvelope<OrderDTO[] | PaginatedDTO<OrderDTO>>>("/pedidos/");
    const payload = unwrap(data);
    const list = Array.isArray(payload) ? payload : payload.results;
    return list.map(toOrder);
  }

  async getOrderById(id: number): Promise<Order> {
    const { data } = await httpClient.get<ApiEnvelope<OrderDTO>>(`/pedidos/${id}/`);
    return toOrder(unwrap(data));
  }

  async uploadComprobante(pedidoId: number, archivo: File): Promise<Order> {
    const formData = new FormData();
    formData.append("comprobante", archivo);
    const { data } = await httpClient.post<ApiEnvelope<OrderDTO>>(
      `/pedidos/${pedidoId}/subir-comprobante/`,
      formData
    );
    return toOrder(unwrap(data));
  }

  async getActiveSellers(): Promise<Seller[]> {
    const { data } = await httpClient.get<ApiEnvelope<SellerDTO[] | PaginatedDTO<SellerDTO>>>(
      "/usuarios/vendedores/activos/"
    );
    const payload = unwrap(data);
    const list = Array.isArray(payload) ? payload : payload.results;
    return list.map(toSeller);
  }

  async getShippingZones(): Promise<ShippingZone[]> {
    const { data } = await httpClient.get<ApiEnvelope<ShippingZoneDTO[] | PaginatedDTO<ShippingZoneDTO>>>(
      "/costos-envio/"
    );
    const payload = unwrap(data);
    const list = Array.isArray(payload) ? payload : payload.results;
    return list.map(toShippingZone);
  }
}
