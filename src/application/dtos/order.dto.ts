export interface CartItemDTO {
  id: number;
  producto: number;
  producto_nombre: string;
  marca?: string;
  variante: number;
  talla: string;
  color: string;
  precio_unitario: string | number;
  cantidad: number;
  imagen_url: string | null;
  stock_disponible?: number;
}

export interface CartDTO {
  items: CartItemDTO[];
  subtotal: string | number;
}

export interface OrderItemDTO {
  id: number;
  producto: number;
  producto_nombre: string;
  talla: string;
  color: string;
  precio_unitario: string | number;
  cantidad: number;
  imagen_url: string | null;
}

export interface OrderDTO {
  id: number;
  numero?: string;
  estado: string;
  items: OrderItemDTO[];
  subtotal: string | number;
  costo_envio: string | number | null;
  total: string | number;
  vendedor: number | null;
  vendedor_nombre?: string | null;
  direccion_envio: string;
  provincia: string;
  ciudad: string;
  telefono_contacto: string;
  comprobante_url?: string | null;
  creado_en: string;
  actualizado_en?: string;
}

export interface ShippingZoneDTO {
  id: number;
  provincia: string;
  ciudad: string;
  zona?: string;
  costo: string | number;
}
