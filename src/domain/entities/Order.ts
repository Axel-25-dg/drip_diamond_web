export interface CartItem {
  id: number;
  productoId: number;
  varianteId: number;
  nombre: string;
  marca: string;
  talla: string;
  color: string;
  precioUnitario: number;
  cantidad: number;
  imagenUrl: string | null;
  stockDisponible: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
}

export type OrderStatus =
  | "CARRITO"
  | "PENDIENTE_DE_PAGO"
  | "COMPROBANTE_ENVIADO"
  | "PAGO_EN_REVISION"
  | "PAGO_APROBADO"
  | "PAGO_RECHAZADO"
  | "PREPARANDO_PEDIDO"
  | "ENVIADO"
  | "ENTREGADO"
  | "CANCELADO";

export interface ShippingZone {
  id: number;
  provincia: string;
  ciudad: string;
  zona?: string;
  costo: number;
}

export interface OrderItem {
  id: number;
  productoId: number;
  nombre: string;
  talla: string;
  color: string;
  precioUnitario: number;
  cantidad: number;
  imagenUrl: string | null;
}

export interface Order {
  id: number;
  numero: string;
  estado: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  costoEnvio: number | null;
  total: number;
  montoTotal?: number;
  clienteNombre?: string | null;
  numeroGuia?: string | null;
  vendedorId: number | null;
  vendedorNombre?: string | null;
  direccionEnvio: string;
  provincia: string;
  ciudad: string;
  telefonoContacto: string;
  comprobanteUrl?: string | null;
  creadoEn: string;
  actualizadoEn?: string;
}

export interface CreateOrderPayload {
  direccionEnvio: string;
  direccionFormateada?: string;
  provincia?: string;
  ciudad: string;
  telefonoContacto?: string;
  vendedorId: number | null;
  notas?: string;
  referenciaAdicional?: string;
  tipoEntrega?: "DOMICILIO" | "RETIRO_LOCAL";
}

export interface UploadComprobantePayload {
  pedidoId: number;
  archivo: File;
}
