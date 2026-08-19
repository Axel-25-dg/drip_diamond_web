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

function extractMediaValue(value: any): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const str = value.trim();
    if (!str || str === "null" || str === "undefined" || str === "[object Object]") return null;
    return str;
  }
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return extractMediaValue(value[0]);
    }
    return (
      extractMediaValue(value.url) ??
      extractMediaValue(value.imagen_url) ??
      extractMediaValue(value.imagen) ??
      extractMediaValue(value.foto) ??
      extractMediaValue(value.path) ??
      extractMediaValue(value.archivo) ??
      extractMediaValue(value.file) ??
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
    extractMediaValue(item?.imagen_url) ??
    extractMediaValue(item?.imagen) ??
    extractMediaValue(item?.producto_imagen) ??
    extractMediaValue(item?.imagen_principal) ??
    extractMediaValue(item?.producto?.imagen_principal) ??
    extractMediaValue(item?.producto?.foto_principal) ??
    extractMediaValue(item?.producto?.imagen) ??
    extractMediaValue(item?.producto?.foto) ??
    extractMediaValue(item?.producto?.imagen?.url) ??
    extractMediaValue(item?.producto?.foto?.url) ??
    extractMediaValue(product?.imagen_principal) ??
    extractMediaValue(product?.foto_principal) ??
    extractMediaValue(product?.imagen) ??
    extractMediaValue(product?.foto) ??
    extractMediaValue(product?.imagen?.url) ??
    extractMediaValue(product?.foto?.url) ??
    extractMediaValue(variant?.imagen) ??
    extractMediaValue(variant?.imagen?.url) ??
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
    extractMediaValue(dto.imagen_url) ??
    extractMediaValue((dto as any).imagen) ??
    extractMediaValue((dto as any).imagenUrl) ??
    extractMediaValue((dto as any).producto_imagen) ??
    extractMediaValue((dto as any).productoImagen) ??
    extractMediaValue((dto as any).producto_imagen_principal) ??
    extractMediaValue((dto as any).imagen_principal) ??
    extractMediaValue((dto as any).foto) ??
    extractMediaValue((dto as any).fotoUrl) ??
    extractMediaValue((dto as any).producto?.imagen_principal) ??
    extractMediaValue((dto as any).producto?.foto_principal) ??
    extractMediaValue((dto as any).producto?.imagen) ??
    extractMediaValue((dto as any).producto?.foto) ??
    extractMediaValue((dto as any).producto?.imagen?.url) ??
    extractMediaValue((dto as any).producto?.foto?.url) ??
    extractMediaValue((dto as any).variante_producto?.producto?.imagen_principal) ??
    extractMediaValue((dto as any).variante_producto?.producto?.foto_principal) ??
    extractMediaValue((dto as any).variante_producto?.producto?.imagen) ??
    extractMediaValue((dto as any).variante_producto?.producto?.foto) ??
    extractMediaValue((dto as any).variante_producto?.producto?.imagenUrl) ??
    extractMediaValue((dto as any).variante_producto?.producto?.fotoUrl) ??
    extractMediaValue((dto as any).variante_producto?.imagen) ??
    extractMediaValue((dto as any).variante_producto?.imagen?.url) ??
    extractMediaValue((dto as any).producto?.imagen?.url) ??
    extractMediaValue((dto as any).producto?.foto?.url) ??
    extractMediaValue((dto as any).producto?.imagenes) ??
    extractMediaValue((dto as any).producto?.galeria) ??
    extractMediaValue(product?.imagen_principal) ??
    extractMediaValue(product?.foto_principal) ??
    extractMediaValue(product?.imagen) ??
    extractMediaValue(product?.foto) ??
    extractMediaValue(product?.imagen?.url) ??
    extractMediaValue(product?.foto?.url) ??
    extractMediaValue(product?.imagenes) ??
    extractMediaValue(product?.galeria) ??
    null;
  const itemName =
    dto.producto_nombre ||
    (dto as any).nombre ||
    (dto as any).title ||
    (dto as any).producto?.nombre ||
    (dto as any).producto?.name ||
    (dto as any).producto?.title ||
    (dto as any).variante_producto?.producto?.nombre ||
    (dto as any).variante_producto?.producto?.name ||
    product?.nombre ||
    product?.name ||
    "Producto";

  const variantId = dto.variante ?? (dto as any).variante_producto?.id ?? 0;

  return {
    id: dto.id,
    productoId:
      typeof dto.producto === "number"
        ? dto.producto
        : (dto as any).producto?.id ?? resolveId((dto as any).producto) ?? resolveId((dto as any).variante_producto?.producto) ?? 0,
    varianteId: variantId,
    nombre: itemName,
    marca: dto.marca ?? product?.marca?.nombre ?? "",
    talla:
      dto.talla ||
      (dto as any).variante_producto?.talla?.valor ||
      (dto as any).variante_producto?.talla ||
      (dto as any).producto?.talla?.valor ||
      (dto as any).producto?.talla ||
      "",
    color:
      dto.color ||
      (dto as any).variante_producto?.color ||
      (dto as any).producto?.color ||
      "",
    precioUnitario: toNumber(
      dto.precio_unitario ??
        (dto as any).precio ??
        (dto as any).precio_venta ??
        (dto as any).valor_unitario ??
        (dto as any).valor ??
        (dto as any).monto ??
        ((dto.cantidad && dto.cantidad > 0) ? Number((dto as any).subtotal ?? 0) / dto.cantidad : 0)
    ),
    cantidad: dto.cantidad ?? 1,
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
    // New dedicated field from backend serializer
    (dto as any).cliente_nombre ||
    (dto as any).cliente?.nombre ||
    (dto as any).cliente?.primer_nombre ||
    (dto as any).usuario?.nombre ||
    (dto as any).usuario?.primer_nombre ||
    (dto as any).usuario?.nombre_completo ||
    dto.usuario_nombre ||
    [dto.usuario?.primer_nombre, dto.usuario?.nombre, dto.usuario?.primer_apellido, dto.usuario?.apellido]
      .filter(Boolean)
      .join(" ") ||
    null;
  const addressObj = (typeof addressValue === "object" && addressValue !== null ? addressValue : null) as Record<string, any> | null;

  const telefono =
    // Prefer phone stored in direccion_envio (entered at checkout)
    addressObj?.telefono_contacto ||
    (dto as any).cliente_telefono ||
    dto.telefono_contacto ||
    dto.telefono ||
    (dto as any).usuario?.telefono ||
    (dto as any).usuario?.celular ||
    (dto as any).cliente?.telefono ||
    (dto as any).cliente?.celular ||
    "";
  const ciudad =
    (dto as any).ciudad ||
    addressObj?.ciudad ||
    addressObj?.city ||
    (dto as any).cliente?.ciudad ||
    (dto as any).usuario?.ciudad ||
    "";
  const provincia =
    // First check the new dedicated provincia field from serializer
    (dto as any).provincia ||
    addressObj?.provincia ||
    addressObj?.province ||
    (dto as any).cliente?.provincia ||
    (dto as any).usuario?.provincia ||
    "";

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
    vendedorId:
      dto.vendedor ??
      (dto as any).vendedor_id ??
      resolveId((dto as any).vendedor) ??
      resolveId((dto as any).vendedor?.usuario) ??
      resolveId((dto as any).vendedor?.user) ??
      null,
    vendedorNombre:
      // New dedicated field from backend serializer
      (dto as any).vendedor_nombre ||
      dto.vendedor_nombre ||
      (typeof (dto as any).vendedor === "object"
        ? `${(dto as any).vendedor?.primer_nombre || (dto as any).vendedor?.nombre || ""} ${(dto as any).vendedor?.primer_apellido || (dto as any).vendedor?.apellido || ""}`.trim()
        : null) ||
      (typeof (dto as any).vendedor === "object" && (dto as any).vendedor?.usuario
        ? `${(dto as any).vendedor?.usuario?.primer_nombre || (dto as any).vendedor?.usuario?.nombre || ""} ${(dto as any).vendedor?.usuario?.primer_apellido || (dto as any).vendedor?.usuario?.apellido || ""}`.trim()
        : null) ||
      (typeof (dto as any).vendedor === "object" && (dto as any).vendedor?.user
        ? `${(dto as any).vendedor?.user?.first_name || (dto as any).vendedor?.user?.nombre || ""} ${(dto as any).vendedor?.user?.last_name || (dto as any).vendedor?.user?.apellido || ""}`.trim()
        : null) ||
      null,
    direccionEnvio:
      typeof addressValue === "string"
        ? addressValue
        : typeof addressValue === "object" && addressValue !== null
        ? ((addressValue.direccion_formateada || addressValue.direccion)
            ? String(addressValue.direccion_formateada || addressValue.direccion)
            : formatAddressForDisplay(addressValue))
        : String(addressValue ?? ""),
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
