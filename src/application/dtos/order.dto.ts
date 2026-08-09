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
  id?: number;
  producto?: number;
  producto_nombre?: string;
  nombre?: string;
  talla?: string;
  color?: string;
  precio_unitario?: string | number;
  precio?: string | number;
  cantidad?: number;
  imagen_url?: string | null;
  imagen?: string | null;
  subtotal?: string | number;
  variante_producto?: {
    producto?: {
      nombre?: string;
      imagen_principal?: string | null;
      foto_principal?: string | null;
      marca?: { nombre?: string };
    };
    talla?: { valor?: string | number | null };
    color?: string;
    sku?: string;
  };
}

export interface OrderDTO {
  id: number;
  numero?: string;
  estado: string;
  items?: OrderItemDTO[];
  detalles?: OrderItemDTO[];
  subtotal?: string | number;
  costo_envio?: string | number | null;
  total?: string | number;
  vendedor?: number | null;
  vendedor_nombre?: string | null;
  direccion_envio?: string | Record<string, unknown> | null;
  direccion_formateada?: string | null;
  provincia?: string;
  ciudad?: string;
  telefono_contacto?: string;
  telefono?: string;
  comprobante_url?: string | null;
  comprobante_pago?: unknown;
  creado_en?: string;
  actualizado_en?: string;
  numero_guia?: string | null;
  usuario?: {
    id?: number;
    nombre?: string;
    apellido?: string;
    primer_nombre?: string;
    primer_apellido?: string;
    correo?: string;
    email?: string;
    telefono?: string;
  };
  usuario_nombre?: string | null;
  cliente_nombre?: string | null;
  cliente?: { nombre?: string; apellido?: string; correo?: string; telefono?: string };
}

export interface ShippingZoneDTO {
  id: number;
  provincia: string;
  ciudad: string;
  zona?: string;
  costo: string | number;
}
