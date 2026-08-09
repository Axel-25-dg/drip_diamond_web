import type { CreateOrderPayload, Order, ShippingZone, UploadComprobanteMetadata } from "@/domain/entities/Order";
import type { Seller } from "@/domain/entities/User";

export interface OrderRepositoryPort {
  createOrder(payload: CreateOrderPayload): Promise<Order>;
  getOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order>;
  uploadComprobante(pedidoId: number, archivo: File, metadata?: UploadComprobanteMetadata): Promise<Order>;
  getActiveSellers(): Promise<Seller[]>;
  getShippingZones(): Promise<ShippingZone[]>;
}
