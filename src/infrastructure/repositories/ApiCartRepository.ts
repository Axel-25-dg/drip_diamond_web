import { httpClient } from "@/infrastructure/http/httpClient";
import type { CartRepositoryPort } from "@/domain/ports/CartRepositoryPort";
import type { Cart } from "@/domain/entities/Order";
import { toCart } from "@/infrastructure/adapters/order.adapter";

function safeUnwrap<T>(data: any): T {
  if (data && "success" in data && "data" in data) return data.data as T;
  return data as T;
}

export class ApiCartRepository implements CartRepositoryPort {
  async getCart(): Promise<Cart> {
    const { data } = await httpClient.get<any>("/pedidos/carrito/");
    return toCart(safeUnwrap(data));
  }

  async addItem(varianteId: number, cantidad: number): Promise<Cart> {
    const { data } = await httpClient.post<any>("/pedidos/carrito/", {
      variante_producto_id: varianteId,
      cantidad,
    });
    return toCart(safeUnwrap(data));
  }

  async removeItem(itemId: number): Promise<Cart> {
    const { data } = await httpClient.delete<any>("/pedidos/carrito/", {
      data: { item_id: itemId },
    });
    return toCart(safeUnwrap(data));
  }
}
