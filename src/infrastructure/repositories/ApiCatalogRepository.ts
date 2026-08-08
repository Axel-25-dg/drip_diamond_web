import { httpClient } from "@/infrastructure/http/httpClient";
import type { CatalogRepositoryPort } from "@/domain/ports/CatalogRepositoryPort";
import type {
  Brand,
  Category,
  PaginatedResult,
  Product,
  ProductFilters,
  ProductSummary,
  Promotion,
  Size,
} from "@/domain/entities/Product";
import type {
  ProductDetailDTO,
  ProductListDTO,
} from "@/application/dtos/catalog.dto";
import {
  toBrand,
  toCategory,
  toProduct,
  toProductSummary,
  toPromotion,
  toSize,
} from "@/infrastructure/adapters/catalog.adapter";

/** Handles both {success, data} envelope and raw DRF responses */
function safeUnwrap<T>(data: any): T {
  if (data && "success" in data && "data" in data) return data.data as T;
  return data as T;
}

export class ApiCatalogRepository implements CatalogRepositoryPort {
  async getProducts(filters: ProductFilters): Promise<PaginatedResult<ProductSummary>> {
    const params: Record<string, unknown> = {
      search: filters.search || undefined,
      marca: filters.marcaId || undefined,
      marca_id: filters.marcaId || undefined,
      categoria: filters.categoriaId || undefined,
      categoria_id: filters.categoriaId || undefined,
      talla: filters.tallaId || undefined,
      talla_id: filters.tallaId || undefined,
      precio_min: filters.precioMin || undefined,
      precio_max: filters.precioMax || undefined,
      ordering: filters.ordering || undefined,
      page: filters.page || 1,
      page_size: filters.pageSize || 50,
    };
    const { data } = await httpClient.get<any>("/productos/", { params });
    const payload = safeUnwrap<any>(data);
    let rawList: ProductListDTO[] = Array.isArray(payload)
      ? payload
      : payload?.results ?? payload?.items ?? [];

    let items = rawList.map(toProductSummary);

    // Client-side category fallback
    if (filters.categoriaId && items.length > 0) {
      const filtered = items.filter(
        (it) => (it as any).categoriaId === filters.categoriaId || (it as any).categoria_id === filters.categoriaId
      );
      // Only apply if backend didn't already filter (i.e., if some don't match)
      if (filtered.length < items.length) items = filtered;
    }

    // Client-side brand fallback
    if (filters.marcaId && items.length > 0) {
      const filtered = items.filter(
        (it) => (it as any).marcaId === filters.marcaId || (it as any).marca_id === filters.marcaId
      );
      if (filtered.length < items.length) items = filtered;
    }

    // Client-side size filter
    if (filters.tallaId) {
      try {
        const sizes = await this.getSizes();
        const foundSize = sizes.find((s) => s.id === filters.tallaId);
        const targetVal = foundSize?.valor ? String(foundSize.valor) : String(filters.tallaId);
        const filtered = items.filter((it) =>
          it.tallasDisponibles?.some(
            (t) => String(t).trim() === targetVal.trim() || String(t) === String(filters.tallaId)
          )
        );
        items = filtered;
      } catch {
        // fallback: keep all
      }
    }

    // Price filter client-side
    if (filters.precioMin != null) {
      items = items.filter((it) => it.precioBase >= filters.precioMin!);
    }
    if (filters.precioMax != null) {
      items = items.filter((it) => it.precioBase <= filters.precioMax!);
    }

    const count: number = items.length;
    const pageSize = filters.pageSize || 50;

    return {
      items,
      total: count,
      page: filters.page || 1,
      pageSize,
      totalPages: Math.max(1, Math.ceil(count / pageSize)),
    };
  }


  async getProductById(id: number): Promise<Product> {
    const { data } = await httpClient.get<any>(`/productos/${id}/`);
    return toProduct(safeUnwrap<ProductDetailDTO>(data));
  }

  async getBrands(): Promise<Brand[]> {
    const { data } = await httpClient.get<any>("/marcas/");
    const payload = safeUnwrap<any>(data);
    const list: any[] = Array.isArray(payload) ? payload : payload?.results ?? [];
    return list.map(toBrand);
  }

  async getCategories(): Promise<Category[]> {
    const { data } = await httpClient.get<any>("/categorias/");
    const payload = safeUnwrap<any>(data);
    const list: any[] = Array.isArray(payload) ? payload : payload?.results ?? [];
    return list.map(toCategory);
  }

  async getSizes(): Promise<Size[]> {
    const { data } = await httpClient.get<any>("/tallas/");
    const payload = safeUnwrap<any>(data);
    const list: any[] = Array.isArray(payload) ? payload : payload?.results ?? [];
    return list.map(toSize);
  }

  async getPromotions(): Promise<Promotion[]> {
    try {
      const { data } = await httpClient.get<any>("/promociones/");
      const payload = safeUnwrap<any>(data);
      const list: any[] = Array.isArray(payload) ? payload : payload?.results ?? [];
      return list.map(toPromotion);
    } catch {
      return [];
    }
  }
}
