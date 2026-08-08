export interface ProductVariantDTO {
  id: number;
  talla: number | { id: number; valor: string };
  talla_valor?: string;
  color?: string | null;
  sku?: string | null;
  peso_kg?: number | string | null;
  stock: number;
}

export interface ProductImageDTO {
  id: number;
  url: string;
  es_principal?: boolean;
}

export interface ProductListDTO {
  id: number;
  nombre: string;
  marca: string | { id: number; nombre: string };
  categoria: string | { id: number; nombre: string };
  precio_base: string | number;
  precio_oferta?: string | number | null;
  imagen_principal: string | null;
  estado: string;
  tallas_disponibles?: string[];
}

export interface ProductDetailDTO extends Omit<ProductListDTO, "marca" | "categoria"> {
  marca: { id: number; nombre: string } | string;
  marca_id?: number;
  categoria: { id: number; nombre: string } | string;
  categoria_id?: number;
  subcategoria?: string | null;
  modelo: string;
  calidad?: string | null;
  descripcion: string;
  stock: number;
  etiquetas?: string[];
  galeria?: ProductImageDTO[];
  variantes?: ProductVariantDTO[];
  creado_en?: string;
  actualizado_en?: string;
}

export interface PaginatedDTO<T> {
  count: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
  results: T[];
}

export interface BrandDTO {
  id: number;
  nombre: string;
  descripcion?: string | null;
  logo_url?: string | null;
}

export interface CategoryDTO {
  id: number;
  nombre: string;
  descripcion?: string | null;
  subcategoria?: string | null;
  imagen_url?: string | null;
}

export interface SizeDTO {
  id: number;
  valor: string;
}

export interface PromotionDTO {
  id: number;
  titulo: string;
  descripcion?: string;
  imagen_url?: string | null;
  activo: boolean;
}
