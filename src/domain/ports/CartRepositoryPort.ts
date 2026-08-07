import type { Cart } from "@/domain/entities/Order";

export interface CartRepositoryPort {
  getCart(): Promise<Cart>;
  addItem(varianteId: number, cantidad: number): Promise<Cart>;
  removeItem(itemId: number): Promise<Cart>;
}
