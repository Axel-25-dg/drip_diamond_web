import type { CartDTO, CartItemDTO, OrderDTO, ShippingZoneDTO } from "@/application/dtos/order.dto";
import type { Cart, CartItem, Order, OrderStatus, ShippingZone } from "@/domain/entities/Order";

const toNumber = (value: string | number | null | undefined): number =>
  value === null || value === undefined ? 0 : typeof value === "number" ? value : parseFloat(value);

export function toCartItem(dto: CartItemDTO): CartItem {
  const imgUrl =
    dto.imagen_url ??
    (dto as any).imagen ??
    (dto as any).producto_imagen ??
    (dto as any).producto?.imagen_principal ??
    (dto as any).producto?.imagen ??
    null;

  return {
    id: dto.id,
    productoId: dto.producto,
    varianteId: dto.variante,
    nombre: dto.producto_nombre,
    marca: dto.marca ?? "",
    talla: dto.talla,
    color: dto.color,
    precioUnitario: toNumber(dto.precio_unitario),
    cantidad: dto.cantidad,
    imagenUrl: imgUrl,
    stockDisponible: dto.stock_disponible ?? 0,
  };
}

export function toCart(dto: CartDTO): Cart {
  const items = (dto.items ?? []).map(toCartItem);
  const calcSubtotal = items.reduce((acc, item) => acc + item.precioUnitario * item.cantidad, 0);
  const sub = toNumber(dto.subtotal);
  return {
    items,
    subtotal: sub > 0 ? sub : calcSubtotal,
    totalItems: items.reduce((acc, item) => acc + item.cantidad, 0),
  };
}

export function toOrder(dto: OrderDTO): Order {
  const totalVal = toNumber(dto.total);
  return {
    id: dto.id,
    numero: dto.numero ?? `#${dto.id}`,
    estado: dto.estado as OrderStatus,
    items: (dto.items ?? []).map((it) => ({
      id: it.id,
      productoId: it.producto,
      nombre: it.producto_nombre,
      talla: it.talla,
      color: it.color,
      precioUnitario: toNumber(it.precio_unitario),
      cantidad: it.cantidad,
      imagenUrl: it.imagen_url,
    })),
    subtotal: toNumber(dto.subtotal),
    costoEnvio: dto.costo_envio != null ? toNumber(dto.costo_envio) : null,
    total: totalVal,
    montoTotal: totalVal,
    clienteNombre: (dto as any).cliente_nombre || (dto as any).cliente?.nombre || null,
    numeroGuia: (dto as any).numero_guia || null,
    vendedorId: dto.vendedor,
    vendedorNombre: dto.vendedor_nombre,
    direccionEnvio: dto.direccion_envio,
    provincia: dto.provincia,
    ciudad: dto.ciudad,
    telefonoContacto: dto.telefono_contacto,
    comprobanteUrl: dto.comprobante_url,
    creadoEn: dto.creado_en,
    actualizadoEn: dto.actualizado_en,
  };
}

export function toShippingZone(dto: ShippingZoneDTO): ShippingZone {
  return {
    id: dto.id,
    provincia: dto.provincia,
    ciudad: dto.ciudad,
    zona: dto.zona,
    costo: toNumber(dto.costo),
  };
}
