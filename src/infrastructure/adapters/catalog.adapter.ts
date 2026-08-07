import type {
  BrandDTO,
  CategoryDTO,
  ProductDetailDTO,
  ProductListDTO,
  PromotionDTO,
  SizeDTO,
} from "@/application/dtos/catalog.dto";
import type {
  Brand,
  Category,
  Product,
  ProductSummary,
  Promotion,
  Size,
} from "@/domain/entities/Product";

const toNumber = (value: string | number | null | undefined): number =>
  value === null || value === undefined ? 0 : typeof value === "number" ? value : parseFloat(value);

const nameOf = (value: string | { nombre: string } | undefined): string =>
  typeof value === "string" ? value : value?.nombre ?? "";

const idOf = (value: number | { id: number } | undefined, fallback?: number): number =>
  typeof value === "number" ? value : value?.id ?? fallback ?? 0;

export function toProductSummary(dto: ProductListDTO): ProductSummary {
  return {
    id: dto.id,
    nombre: dto.nombre,
    marca: nameOf(dto.marca),
    categoria: nameOf(dto.categoria),
    precioBase: toNumber(dto.precio_base),
    precioOferta: dto.precio_oferta != null ? toNumber(dto.precio_oferta) : null,
    imagenPrincipal: dto.imagen_principal,
    estado: dto.estado,
    tallasDisponibles: dto.tallas_disponibles ?? [],
  };
}

export function toProduct(dto: ProductDetailDTO): Product {
  return {
    id: dto.id,
    nombre: dto.nombre,
    marca: nameOf(dto.marca),
    marcaId: idOf(dto.marca as any, dto.marca_id),
    modelo: dto.modelo,
    categoria: nameOf(dto.categoria),
    categoriaId: idOf(dto.categoria as any, dto.categoria_id),
    subcategoria: dto.subcategoria ?? null,
    calidad: dto.calidad ?? null,
    descripcion: dto.descripcion,
    precioBase: toNumber(dto.precio_base),
    precioOferta: dto.precio_oferta != null ? toNumber(dto.precio_oferta) : null,
    stock: dto.stock,
    estado: dto.estado,
    etiquetas: dto.etiquetas ?? [],
    imagenPrincipal: dto.imagen_principal,
    galeria: (dto.galeria ?? []).map((img) => ({
      id: img.id,
      url: img.url,
      esPrincipal: img.es_principal,
    })),
    variantes: (dto.variantes ?? []).map((v) => ({
      id: v.id,
      tallaId: typeof v.talla === "number" ? v.talla : v.talla.id,
      talla: v.talla_valor ?? (typeof v.talla === "object" ? v.talla.valor : String(v.talla)),
      color: v.color,
      stock: v.stock,
    })),
    creadoEn: dto.creado_en,
    actualizadoEn: dto.actualizado_en,
  };
}

export function toBrand(dto: BrandDTO): Brand {
  return { id: dto.id, nombre: dto.nombre, logoUrl: dto.logo_url ?? null };
}

export function toCategory(dto: CategoryDTO): Category {
  return {
    id: dto.id,
    nombre: dto.nombre,
    subcategoria: dto.subcategoria ?? null,
    imagenUrl: dto.imagen_url ?? null,
  };
}

export function toSize(dto: SizeDTO): Size {
  return { id: dto.id, valor: dto.valor };
}

export function toPromotion(dto: PromotionDTO): Promotion {
  return {
    id: dto.id,
    titulo: dto.titulo,
    descripcion: dto.descripcion,
    imagenUrl: dto.imagen_url ?? null,
    activo: dto.activo,
  };
}
