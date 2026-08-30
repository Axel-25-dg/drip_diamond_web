import type { CartRepositoryPort } from "@/domain/ports/CartRepositoryPort";
import type { OrderRepositoryPort } from "@/domain/ports/OrderRepositoryPort";
import type { CreateOrderPayload, UploadComprobanteMetadata } from "@/domain/entities/Order";

export class GetCartUseCase {
  constructor(private repo: CartRepositoryPort) {}
  execute() {
    return this.repo.getCart();
  }
}

export class AddCartItemUseCase {
  constructor(private repo: CartRepositoryPort) {}
  execute(varianteId: number, cantidad: number) {
    if (cantidad < 1) throw new Error("La cantidad debe ser al menos 1.");
    return this.repo.addItem(varianteId, cantidad);
  }
}

export class RemoveCartItemUseCase {
  constructor(private repo: CartRepositoryPort) {}
  execute(itemId: number) {
    return this.repo.removeItem(itemId);
  }
}

export class CreateOrderUseCase {
  constructor(private repo: OrderRepositoryPort) {}
  execute(payload: CreateOrderPayload) {
    if (!payload.direccionEnvio.trim()) throw new Error("La dirección de envío es obligatoria.");
    return this.repo.createOrder(payload);
  }
}

export class GetOrdersUseCase {
  constructor(private repo: OrderRepositoryPort) {}
  execute() {
    return this.repo.getOrders();
  }
}

export class GetOrderDetailUseCase {
  constructor(private repo: OrderRepositoryPort) {}
  execute(id: number) {
    return this.repo.getOrderById(id);
  }
}

export class UploadComprobanteUseCase {
  constructor(private repo: OrderRepositoryPort) {}
  execute(pedidoId: number, archivo: File, metadata?: UploadComprobanteMetadata) {
    const maxSize = 5 * 1024 * 1024;
    if (archivo.size > maxSize) throw new Error("El comprobante no debe superar 5 MB.");
    return this.repo.uploadComprobante(pedidoId, archivo, metadata);
  }
}

export class CancelOrderUseCase {
  constructor(private repo: OrderRepositoryPort) {}
  execute(pedidoId: number) {
    return this.repo.cancelOrder(pedidoId);
  }
}

export class GetActiveSellersUseCase {
  constructor(private repo: OrderRepositoryPort) {}
  execute() {
    return this.repo.getActiveSellers();
  }
}

export class GetShippingZonesUseCase {
  constructor(private repo: OrderRepositoryPort) {}
  execute() {
    return this.repo.getShippingZones();
  }
}
