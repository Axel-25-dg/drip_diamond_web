import { httpClient, unwrap, type ApiEnvelope } from "@/infrastructure/http/httpClient";
import type { CartRepositoryPort } from "@/domain/ports/CartRepositoryPort";
import type { Cart } from "@/domain/entities/Order";
import type { CartDTO } from "@/application/dtos/order.dto";
import { toCart } from "@/infrastructure/adapters/order.adapter";

export class ApiCartRepository implements CartRepositoryPort {
  async getCart(): Promise<Cart> {
    const { data } = await httpClient.get<ApiEnvelope<CartDTO>>("/pedidos/carrito/");
    return toCart(unwrap(data));
  }

  async addItem(varianteId: number, cantidad: number): Promise<Cart> {
    const { data } = await httpClient.post<ApiEnvelope<CartDTO>>("/pedidos/carrito/", {
      variante_producto_id: varianteId,
      cantidad,
    });
    return toCart(unwrap(data));
  }

  async removeItem(itemId: number): Promise<Cart> {
    const { data } = await httpClient.delete<ApiEnvelope<CartDTO>>("/pedidos/carrito/", {
      data: { item_id: itemId },
    });
    return toCart(unwrap(data));
  }
}
