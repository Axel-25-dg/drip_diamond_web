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
    if (typeof val === "string" && val.trim() && val !== "null" && val !== "undefined") return val.trim();
    if (typeof val === "object") {
      return (
        val.url ??
        val.imagen_url ??
        val.imagen ??
        val.archivo ??
        val.path ??
        val.file ??
        null
      );
    }
    return null;
  };

  // Try every possible field the Django backend might use
  const candidates = [
    dto.imagen_principal,
    dto.imagen,
    dto.imagen_url,
    dto.foto,
    dto.foto_url,
    dto.foto_principal,
    dto.thumbnail,
    dto.cover,
    dto.picture,
    dto.image,
  ];

  for (const c of candidates) {
    const result = check(c);
    if (result) return result;
  }

  // Try arrays: imagenes[], galeria[]
  if (Array.isArray(dto.imagenes) && dto.imagenes.length > 0) {
    const r = check(dto.imagenes[0]);
    if (r) return r;
  }
  if (Array.isArray(dto.galeria) && dto.galeria.length > 0) {
    // prefer the one marked as principal
    const principal = dto.galeria.find((g: any) => g.es_principal);
    const r = check(principal ?? dto.galeria[0]);
    if (r) return r;
  }

  // Last resort: check variantes for an image
  if (Array.isArray(dto.variantes) && dto.variantes.length > 0) {
    for (const v of dto.variantes) {
      const r = check(v?.imagen ?? v?.imagen_url ?? v?.foto ?? null);
      if (r) return r;
    }
  }

  return null;
};

const extractTallas = (dto: any): string[] => {
  if (Array.isArray(dto.tallas_disponibles) && dto.tallas_disponibles.length > 0) {
    return dto.tallas_disponibles.map(String);
  }
  if (Array.isArray(dto.tallas) && dto.tallas.length > 0) {
    return dto.tallas.map(String);
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
      tallaId: typeof v.talla === "number" ? v.talla : v.talla?.id ?? 0,
      talla: v.talla_valor ?? (typeof v.talla === "object" ? v.talla.valor : String(v.talla)),
      color: v.color?.trim() ? v.color.trim() : "Estándar",
      stock: v.stock,
      sku: v.sku ?? null,
      pesoKg: v.peso_kg != null ? Number(v.peso_kg) : null,
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

export function toPromotion(dto: any): Promotion {
  return {
    id: dto.id ?? Date.now(),
    titulo: dto.titulo ?? "Promoción",
    descripcion: dto.descripcion ?? "",
    imagenUrl: dto.imagen_url ?? dto.imagenUrl ?? null,
    activo: dto.activo ?? true,
    tipo: dto.tipo ?? (dto.min_pares ? "ENVIO_GRATIS_DOS_PARES" : "GENERAL"),
    minPares: dto.min_pares ?? dto.minPares ?? 2,
    descuentoPorcentaje: dto.descuento_porcentaje ?? dto.descuentoPorcentaje,
    descuentoFijo: dto.descuento_fijo ?? dto.descuentoFijo,
    creadoEn: dto.creado_en ?? dto.creadoEn,
  };
}
