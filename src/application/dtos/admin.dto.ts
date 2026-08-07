export interface CreateProductDTO {
  nombre: string;
  modelo: string;
  descripcion: string;
  calidad: "ORIGINAL" | "PRIMERA_CLASE" | "SEGUNDA_CLASE";
  precioBase: number;
  precioOferta?: number | null;
  marcaId: number;
  categoriaId: number;
  activo?: boolean;
}

export interface CreateVariantDTO {
  productoId: number;
  tallaId: number;
  stock: number;
  sku?: string;
  pesoKg?: number;
}

export interface CreateBrandDTO {
  nombre: string;
  descripcion?: string;
}

export interface CreateCategoryDTO {
  nombre: string;
  descripcion?: string;
}

export interface CreateTallaDTO {
  valor: string;
}

export interface VerifyPaymentDTO {
  comprobanteId: number;
  estado: "VERIFICADO" | "RECHAZADO";
  observacion?: string;
}

export interface ShipOrderDTO {
  pedidoId: number;
  numeroGuia: string;
}

export interface CreateCampaignDTO {
  titulo: string;
  asunto: string;
  contenidoHtml: string;
  segmento: "TODOS_LOS_CLIENTES" | "VENDEDORES" | "CONTADORES" | "CLIENTES_CON_COMPRAS" | "CLIENTES_SIN_COMPRAS";
}

export interface CreateUserDTO {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  password: string;
  rol: "ADMINISTRADOR" | "CONTADOR" | "VENDEDOR" | "CLIENTE";
}

export interface UpdateUserDTO {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  rol?: "ADMINISTRADOR" | "CONTADOR" | "VENDEDOR" | "CLIENTE";
}

export interface UpdateBrandDTO {
  nombre?: string;
  descripcion?: string;
}

export interface UpdateCategoryDTO {
  nombre?: string;
  descripcion?: string;
}
