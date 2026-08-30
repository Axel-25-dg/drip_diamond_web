export interface Brand {
  id: number;
  nombre: string;
  descripcion?: string | null;
  logoUrl?: string | null;
}

export interface Category {
  id: number;
  nombre: string;
  descripcion?: string | null;
  subcategoria?: string | null;
  imagenUrl?: string | null;
}

export interface Size {
  id: number;
  valor: string;
}

export type Talla = Size;

export interface ProductVariant {
  id: number;
  tallaId: number;
  talla: string;
  color: string;
  stock: number;
  sku?: string | null;
  pesoKg?: number | null;
}

export type ProductStatus = "activo" | "agotado" | "inactivo" | string;

export interface ProductImage {
  id: number;
  url: string;
  esPrincipal?: boolean;
}

export interface Product {
  id: number;
  nombre: string;
  marca: string;
  marcaId: number;
  modelo: string;
  categoria: string;
  categoriaId: number;
  subcategoria?: string | null;
  calidad?: string | null;
  descripcion: string;
  precioBase: number;
  precioOferta?: number | null;
  stock: number;
  estado: ProductStatus;
  etiquetas: string[];
  imagenPrincipal: string | null;
  galeria: ProductImage[];
  variantes: ProductVariant[];
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface ProductSummary {
  id: number;
  nombre: string;
  marca: string;
  marcaId?: number;
  categoria: string;
  categoriaId?: number;
  precioBase: number;
  precioOferta?: number | null;
  imagenPrincipal: string | null;
  estado: ProductStatus;
  tallasDisponibles?: string[];
}

export interface Promotion {
  id: number;
  titulo: string;
  descripcion?: string;
  imagenUrl?: string | null;
  activo: boolean;
  tipo?: "ENVIO_GRATIS_DOS_PARES" | "DESCUENTO_PORCENTAJE" | "DESCUENTO_FIJO" | "GENERAL";
  minPares?: number;
  descuentoPorcentaje?: number;
  descuentoFijo?: number;
  creadoEn?: string;
}

export interface ProductFilters {
  search?: string;
  marcaId?: number;
  categoriaId?: number;
  tallaId?: number;
  precioMin?: number;
  precioMax?: number;
  ordering?: "precio" | "-precio" | "reciente" | "-reciente" | string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
