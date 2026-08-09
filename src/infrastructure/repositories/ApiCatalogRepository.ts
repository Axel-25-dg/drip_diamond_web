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
    // Build params — send each filter with both possible names for max backend compatibility
    const params: Record<string, unknown> = {};
    if (filters.search) params.search = filters.search;
    if (filters.marcaId) {
      params.marca = filters.marcaId;
      params.marca_id = filters.marcaId;
    }
    if (filters.categoriaId) {
      params.categoria = filters.categoriaId;
      params.categoria_id = filters.categoriaId;
    }
    if (filters.tallaId) {
      params.talla = filters.tallaId;
      params.talla_id = filters.tallaId;
    }
    if (filters.precioMin != null) params.precio_min = filters.precioMin;
    if (filters.precioMax != null) params.precio_max = filters.precioMax;
    if (filters.ordering) params.ordering = filters.ordering;
    params.page = filters.page || 1;
    params.page_size = filters.pageSize || 12;

    const { data } = await httpClient.get<any>("/productos/", { params });
    const payload = safeUnwrap<any>(data);

    let rawList: ProductListDTO[];
    let serverTotal: number | undefined;
    let serverTotalPages: number | undefined;

    if (Array.isArray(payload)) {
      rawList = payload;
    } else {
      rawList = payload?.results ?? payload?.items ?? [];
      serverTotal = payload?.count ?? payload?.total;
      serverTotalPages = payload?.total_pages ?? payload?.totalPages;
    }

    let items = rawList.map(toProductSummary);

    // Client-side fallbacks only when backend returned unfiltered data
    // IMPORTANT: Only apply if categoriaId/marcaId were actually parsed from the summary items.
    // If ALL items have undefined IDs (backend only returns string names in the list), skip client filtering.
    if (filters.categoriaId && items.length > 0) {
      const itemsWithId = items.filter((it) => it.categoriaId != null);
      if (itemsWithId.length > 0) {
        // Some items have IDs — we can filter
        const filtered = items.filter((it) => it.categoriaId === filters.categoriaId);
        // Only restrict if not ALL already match (i.e., backend didn't filter)
        if (filtered.length < items.length && filtered.length > 0) {
          items = filtered;
        }
      }
      // If no items have IDs parsed, backend already filtered or listing doesn't include IDs — keep all
    }

    if (filters.marcaId && items.length > 0) {
      const itemsWithId = items.filter((it) => it.marcaId != null);
      if (itemsWithId.length > 0) {
        const filtered = items.filter((it) => it.marcaId === filters.marcaId);
        if (filtered.length < items.length && filtered.length > 0) {
          items = filtered;
        }
      }
    }

    if (filters.tallaId && items.length > 0) {
      try {
        const sizes = await this.getSizes();
        const foundSize = sizes.find((s) => s.id === filters.tallaId);
        const targetVal = foundSize?.valor ? String(foundSize.valor) : String(filters.tallaId);
        const filtered = items.filter((it) =>
          it.tallasDisponibles?.some(
            (t) => String(t).trim() === targetVal.trim() || String(t) === String(filters.tallaId)
          )
        );
        // Only apply if it actually filters something and leaves some results
        if (filtered.length < items.length && filtered.length > 0) items = filtered;
      } catch {
        // keep all if sizes endpoint fails
      }
    }

    if (filters.precioMin != null) {
      items = items.filter((it) => it.precioBase >= filters.precioMin!);
    }
    if (filters.precioMax != null) {
      items = items.filter((it) => it.precioBase <= filters.precioMax!);
    }

    const total = serverTotal ?? items.length;
    const pageSize = filters.pageSize || 12;
    const totalPages = serverTotalPages ?? Math.max(1, Math.ceil(total / pageSize));

    return {
      items,
      total,
      page: filters.page || 1,
      pageSize,
      totalPages,
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
