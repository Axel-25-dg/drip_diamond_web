import type { CartDTO, CartItemDTO, OrderDTO, ShippingZoneDTO } from "@/application/dtos/order.dto";
import type { Cart, CartItem, Order, OrderStatus, ShippingZone } from "@/domain/entities/Order";
import { formatAddressForDisplay } from "@/presentation/utils/format";

function resolveId(value: any): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") return value.trim() === "" ? null : Number(value) || null;
  if (typeof value === "object" && value !== null) {
    return (
      resolveId(value.id ?? value.pk ?? value.producto_id ?? value.variante_id ?? value.vendedor_id ?? value.usuario_id ?? value.user_id) ??
      null
    );
  }
  return null;
}

function toOrderItem(item: any): Order["items"][number] {
  const variant = item?.variante_producto;
  const product =
    variant?.producto ??
    item?.producto_info ??
    (typeof item?.producto === "object" ? item?.producto : null);
  const nombre =
    item?.producto_nombre ||
    item?.nombre ||
    item?.title ||
    item?.producto?.nombre ||
    item?.producto?.name ||
    item?.producto?.title ||
    product?.nombre ||
    product?.name ||
    "Producto";
  const talla =
    item?.talla ||
    variant?.talla?.valor ||
    item?.talla?.valor ||
    item?.talla?.size ||
    item?.producto?.talla?.valor ||
    item?.producto?.talla ||
    "";
  const color =
    item?.color ||
    variant?.color ||
    item?.color?.nombre ||
    item?.producto?.color ||
    item?.producto?.color?.nombre ||
    "";
  const cantidad = Number(item?.cantidad ?? item?.cantidad_pares ?? item?.cantidad_par ?? 1);
  const precioUnitario = toNumber(
    item?.precio_unitario ??
      item?.precio ??
      item?.precio_venta ??
      item?.valor_unitario ??
      item?.valor ??
      item?.monto ??
      (cantidad > 0 ? Number(item?.subtotal ?? 0) / cantidad : 0)
  );
  const imagenUrl =
    item?.imagen_url ??
    item?.imagen ??
    item?.imagen?.url ??
    item?.producto_imagen ??
    item?.imagen_principal ??
    item?.producto?.imagen_principal ??
    item?.producto?.foto_principal ??
    item?.producto?.imagen ??
    item?.producto?.foto ??
    item?.producto?.imagen?.url ??
    item?.producto?.foto?.url ??
    product?.imagen_principal ??
    product?.foto_principal ??
    product?.imagen ??
    product?.foto ??
    product?.imagen?.url ??
    product?.foto?.url ??
    variant?.imagen ??
    variant?.imagen?.url ??
    null;

  return {
    id: item?.id ?? item?.detalle_id ?? item?.pedido_detalle_id ?? 0,
    productoId:
      typeof item?.producto === "number"
        ? item.producto
        : item?.producto?.id ?? resolveId(item?.producto) ?? resolveId(variant?.producto) ?? 0,
    nombre,
    talla: String(talla),
    color: String(color),
    precioUnitario,
    cantidad,
    imagenUrl,
  };
}

const toNumber = (value: string | number | null | undefined): number =>
  value === null || value === undefined ? 0 : typeof value === "number" ? value : parseFloat(String(value)) || 0;

export function toCartItem(dto: CartItemDTO): CartItem {
  const product =
    typeof (dto as any).producto === "object"
      ? (dto as any).producto
      : (dto as any).variante_producto?.producto ?? null;
  const imgUrl =
    dto.imagen_url ??
    (dto as any).imagen ??
    (dto as any).imagen?.url ??
    (dto as any).producto_imagen ??
    (dto as any).producto_imagen_principal ??
    (dto as any).imagen_principal ??
    (dto as any).foto ??
    (dto as any).variante_producto?.producto?.imagen_principal ??
    (dto as any).variante_producto?.producto?.foto_principal ??
    (dto as any).variante_producto?.producto?.imagen ??
    (dto as any).variante_producto?.producto?.foto ??
    (dto as any).variante_producto?.imagen ??
    (dto as any).variante_producto?.imagen?.url ??
    (dto as any).producto?.imagen_principal ??
    (dto as any).producto?.foto_principal ??
    (dto as any).producto?.imagen ??
    (dto as any).producto?.foto ??
    (dto as any).producto?.imagen?.url ??
    (dto as any).producto?.foto?.url ??
    product?.imagen_principal ??
    product?.foto_principal ??
    product?.imagen ??
    product?.foto ??
    product?.imagen?.url ??
    product?.foto?.url ??
    null;
  const itemName =
    dto.producto_nombre ||
    (dto as any).nombre ||
    (dto as any).title ||
    (dto as any).producto?.nombre ||
    (dto as any).producto?.name ||
    product?.nombre ||
    product?.name ||
    (dto as any).variante_producto?.producto?.nombre ||
    "Producto";

  return {
    id: dto.id,
    productoId: typeof dto.producto === "number" ? dto.producto : (dto as any).producto?.id ?? resolveId((dto as any).producto) ?? resolveId((dto as any).variante_producto?.producto) ?? 0,
    varianteId: dto.variante,
    nombre: itemName,
    marca: dto.marca ?? product?.marca?.nombre ?? "",
    talla: dto.talla ?? (dto as any).variante_producto?.talla?.valor ?? "",
    color: dto.color ?? (dto as any).variante_producto?.color ?? "",
    precioUnitario: toNumber(
      dto.precio_unitario ??
        (dto as any).precio ??
        (dto as any).precio_venta ??
        (dto as any).valor_unitario ??
        (dto as any).valor ??
        ((dto.cantidad && dto.cantidad > 0) ? Number((dto as any).subtotal ?? 0) / dto.cantidad : 0)
    ),
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
  const items = (dto.detalles ?? dto.items ?? []).map(toOrderItem);
  const totalVal =
    toNumber(dto.total ?? (dto as any).monto_total ?? dto.subtotal) ||
    items.reduce((acc, item) => acc + item.precioUnitario * item.cantidad, 0);
  const addressValue = dto.direccion_envio ?? dto.direccion_formateada ?? null;
  const clientName =
    (dto as any).cliente_nombre ||
    (dto as any).cliente?.nombre ||
    (dto as any).usuario?.nombre ||
    (dto as any).usuario?.primer_nombre ||
    dto.usuario_nombre ||
    [dto.usuario?.primer_nombre, dto.usuario?.nombre, dto.usuario?.primer_apellido, dto.usuario?.apellido]
      .filter(Boolean)
      .join(" ") ||
    null;
  const telefono =
    dto.telefono_contacto ||
    dto.telefono ||
    (dto as any).usuario?.telefono ||
    (dto as any).cliente?.telefono ||
    "";
  const addressObj = (typeof addressValue === "object" && addressValue !== null ? addressValue : null) as Record<string, any> | null;
  const ciudad = (dto as any).ciudad || addressObj?.ciudad || addressObj?.city || "";
  const provincia = (dto as any).provincia || addressObj?.provincia || addressObj?.province || "";

  return {
    id: dto.id,
    numero: dto.numero ?? `#${dto.id}`,
    estado: (dto.estado as OrderStatus) || "PENDIENTE_DE_PAGO",
    items,
    subtotal: toNumber(dto.subtotal),
    costoEnvio: dto.costo_envio != null ? toNumber(dto.costo_envio) : null,
    total: totalVal,
    montoTotal: totalVal,
    clienteNombre: clientName,
    numeroGuia: (dto as any).numero_guia || null,
    vendedorId: dto.vendedor ?? (dto as any).vendedor_id ?? null,
    vendedorNombre:
      dto.vendedor_nombre ||
      (typeof (dto as any).vendedor === "object" ? `${(dto as any).vendedor?.primer_nombre || (dto as any).vendedor?.nombre || ""} ${(dto as any).vendedor?.primer_apellido || (dto as any).vendedor?.apellido || ""}`.trim() : null) ||
      null,
    direccionEnvio: formatAddressForDisplay(addressValue),
    provincia,
    ciudad,
    telefonoContacto: telefono,
    comprobanteUrl:
      dto.comprobante_url ||
      (dto as any).comprobante_pago?.archivo ||
      (dto as any).comprobante?.archivo ||
      null,
    creadoEn: dto.creado_en || new Date().toISOString(),
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
