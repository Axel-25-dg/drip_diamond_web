export interface VarianteInputDTO {
  talla: number;
  stock: number;
  peso_kg?: number | string;
  sku?: string;
}

export interface CreateProductDTO {
  nombre: string;
  modelo: string;
  descripcion?: string;
  calidad: "ORIGINAL" | "PRIMERA_CLASE" | "SEGUNDA_CLASE";
  precio_base: number | string;
  marca_id: number;
  categoria_id: number;
  activo?: boolean;
  variantes_input?: VarianteInputDTO[];
}

export interface CreateVariantDTO {
  productoId: number;
  tallaId: number;
  stock: number;
  sku?: string;
  pesoKg?: number;
}

export interface UpdateVariantDTO {
  stock?: number;
  sku?: string;
  pesoKg?: number | string;
}

export interface CreateBrandDTO {
  nombre: string;
  descripcion?: string;
  logo?: File;
}

export interface UpdateBrandDTO {
  nombre?: string;
  descripcion?: string;
  logo?: File;
}

export interface CreateCategoryDTO {
  nombre: string;
  descripcion?: string;
  imagen?: File;
}

export interface UpdateCategoryDTO {
  nombre?: string;
  descripcion?: string;
  imagen?: File;
}

export interface CreateTallaDTO {
  valor: string;
}

export interface UpdateTallaDTO {
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
