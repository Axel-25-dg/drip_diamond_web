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

const normalizeStatus = (estado?: string, activo?: boolean): string => {
  if (activo === false) return "agotado";
  if (!estado) return "disponible";
  const lower = String(estado).toLowerCase();
  if (lower === "activo" || lower === "disponible" || lower === "active") return "disponible";
  if (lower === "agotado" || lower === "out_of_stock" || lower === "inactivo") return "agotado";
  return lower;
};

const extractMainImage = (dto: any): string | null => {
  const check = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === "string") return val;
    if (typeof val === "object") return val.url ?? val.imagen ?? val.archivo ?? val.path ?? null;
    return null;
  };

  return (
    check(dto.imagen_principal) ??
    check(dto.imagen) ??
    check(dto.imagen_url) ??
    check(dto.foto) ??
    (Array.isArray(dto.imagenes) && dto.imagenes.length > 0 ? check(dto.imagenes[0]) : null) ??
    (Array.isArray(dto.galeria) && dto.galeria.length > 0 ? check(dto.galeria[0]) : null) ??
    (Array.isArray(dto.variantes) && dto.variantes.length > 0 ? check(dto.variantes[0]?.imagen ?? dto.variantes[0]?.imagen_url) : null) ??
    null
  );
};

const extractTallas = (dto: any): string[] => {
  if (Array.isArray(dto.tallas_disponibles) && dto.tallas_disponibles.length > 0) {
    return dto.tallas_disponibles.map(String);
  }
  if (Array.isArray(dto.variantes) && dto.variantes.length > 0) {
    return Array.from(
      new Set(
        dto.variantes
          .map((v: any) => v.talla_valor ?? (typeof v.talla === "object" ? v.talla?.valor : String(v.talla)))
          .filter(Boolean)
      )
    );
  }
  return [];
};

export function toProductSummary(dto: ProductListDTO): ProductSummary {
  const pBase = toNumber(dto.precio_base);
  const pOferta = dto.precio_oferta != null ? toNumber(dto.precio_oferta) : null;
  const validOferta = pOferta != null && pOferta > 0 && pOferta < pBase ? pOferta : null;

  return {
    id: dto.id,
    nombre: dto.nombre,
    marca: nameOf(dto.marca),
    marcaId: idOf(dto.marca as any, dto.marca_id) || undefined,
    categoria: nameOf(dto.categoria),
    categoriaId: idOf(dto.categoria as any, dto.categoria_id) || undefined,
    precioBase: pBase,
    precioOferta: validOferta,
    imagenPrincipal: extractMainImage(dto),
    estado: normalizeStatus(dto.estado, (dto as any).activo),
    tallasDisponibles: extractTallas(dto),
  };
}

export function toProduct(dto: ProductDetailDTO): Product {
  const pBase = toNumber(dto.precio_base);
  const pOferta = dto.precio_oferta != null ? toNumber(dto.precio_oferta) : null;
  const validOferta = pOferta != null && pOferta > 0 && pOferta < pBase ? pOferta : null;

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
    precioBase: pBase,
    precioOferta: validOferta,
    stock: dto.stock,
    estado: normalizeStatus(dto.estado, (dto as any).activo),
    etiquetas: dto.etiquetas ?? [],
    imagenPrincipal: extractMainImage(dto),
    galeria: (dto.galeria ?? []).map((img) => ({
      id: img.id,
      url: img.url,
      esPrincipal: img.es_principal,
    })),
    variantes: (dto.variantes ?? []).map((v) => ({
      id: v.id,
      tallaId: typeof v.talla === "number" ? v.talla : v.talla.id,
      talla: v.talla_valor ?? (typeof v.talla === "object" ? v.talla.valor : String(v.talla)),
      color: v.color?.trim() ? v.color.trim() : "Estándar",
      stock: v.stock,
      sku: v.sku ?? null,
    })),
    creadoEn: dto.creado_en,
    actualizadoEn: dto.actualizado_en,
  };
}

export function toBrand(dto: BrandDTO): Brand {
  return { id: dto.id, nombre: dto.nombre, descripcion: dto.descripcion ?? null, logoUrl: dto.logo_url ?? null };
}

export function toCategory(dto: CategoryDTO): Category {
  return {
    id: dto.id,
    nombre: dto.nombre,
    descripcion: dto.descripcion ?? null,
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
