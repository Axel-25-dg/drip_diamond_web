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
  // Short in-memory cache to avoid bursts of identical GET requests (key -> {expires, data})
  private static _cache = new Map<string, { expires: number; data: any }>();
  private static _cacheTtl = 5000; // ms

  private _getCached<T>(key: string): T | null {
    const entry = ApiCatalogRepository._cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      ApiCatalogRepository._cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private _setCache(key: string, data: any) {
    ApiCatalogRepository._cache.set(key, { expires: Date.now() + ApiCatalogRepository._cacheTtl, data });
  }

  async getProducts(filters: ProductFilters): Promise<PaginatedResult<ProductSummary>> {
    const cacheKey = `products:${JSON.stringify(filters || {})}`;
    const cached = this._getCached<PaginatedResult<ProductSummary>>(cacheKey);
    if (cached) return cached;
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

    const result = {
      items,
      total,
      page: filters.page || 1,
      pageSize,
      totalPages,
    };
    this._setCache(cacheKey, result);
    return result;
  }


  async getProductById(id: number): Promise<Product> {
    const { data } = await httpClient.get<any>(`/productos/${id}/`);
    return toProduct(safeUnwrap<ProductDetailDTO>(data));
  }

  async getBrands(): Promise<Brand[]> {
    const cacheKey = "brands";
    const cached = this._getCached<Brand[]>(cacheKey);
    if (cached) return cached;
    const { data } = await httpClient.get<any>("/marcas/");
    const payload = safeUnwrap<any>(data);
    const list: any[] = Array.isArray(payload) ? payload : payload?.results ?? [];
    const result = list.map(toBrand);
    this._setCache(cacheKey, result);
    return result;
  }

  async getCategories(): Promise<Category[]> {
    const cacheKey = "categories";
    const cached = this._getCached<Category[]>(cacheKey);
    if (cached) return cached;
    const { data } = await httpClient.get<any>("/categorias/");
    const payload = safeUnwrap<any>(data);
    const list: any[] = Array.isArray(payload) ? payload : payload?.results ?? [];
    const result = list.map(toCategory);
    this._setCache(cacheKey, result);
    return result;
  }

  async getSizes(): Promise<Size[]> {
    const cacheKey = "sizes";
    const cached = this._getCached<Size[]>(cacheKey);
    if (cached) return cached;
    const { data } = await httpClient.get<any>("/tallas/");
    const payload = safeUnwrap<any>(data);
    const list: any[] = Array.isArray(payload) ? payload : payload?.results ?? [];
    const result = list.map(toSize);
    this._setCache(cacheKey, result);
    return result;
  }

  private _getCustomPromos(): Promotion[] {
    try {
      const stored = localStorage.getItem("drip_promociones_custom");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.map(toPromotion);
      }
    } catch { /* ignore */ }
    return [
      {
        id: 1,
        titulo: "Envío GRATIS por 2 o más pares",
        descripcion: "Por la compra de 2 o más pares de zapatillas, el envío por Servientrega es completamente GRATIS a todo Quito.",
        imagenUrl: null,
        activo: true,
        tipo: "ENVIO_GRATIS_DOS_PARES",
        minPares: 2,
        creadoEn: new Date().toISOString(),
      },
    ];
  }

  private _saveCustomPromos(promos: Promotion[]) {
    try {
      localStorage.setItem("drip_promociones_custom", JSON.stringify(promos));
    } catch { /* ignore */ }
  }

  async getPromotions(): Promise<Promotion[]> {
    let remoteList: Promotion[] = [];
    try {
      const { data } = await httpClient.get<any>("/promociones/");
      const payload = safeUnwrap<any>(data);
      const list: any[] = Array.isArray(payload) ? payload : payload?.results ?? [];
      remoteList = list.map(toPromotion);
    } catch {
      // API endpoint fallback
    }

    const localList = this._getCustomPromos();
    const map = new Map<number, Promotion>();

    // Load defaults/locals first
    for (const p of localList) map.set(p.id, p);
    // Remote overrides
    for (const p of remoteList) map.set(p.id, p);

    const merged = Array.from(map.values());
    if (remoteList.length > 0) {
      this._saveCustomPromos(merged);
    }
    return merged;
  }

  async createPromotion(payload: Partial<Promotion>): Promise<Promotion> {
    const newPromo: Promotion = {
      id: Date.now(),
      titulo: payload.titulo?.trim() || "Nueva Promoción",
      descripcion: payload.descripcion?.trim() || "",
      imagenUrl: payload.imagenUrl || null,
      activo: payload.activo ?? true,
      tipo: payload.tipo || "ENVIO_GRATIS_DOS_PARES",
      minPares: payload.minPares ?? 2,
      descuentoPorcentaje: payload.descuentoPorcentaje,
      descuentoFijo: payload.descuentoFijo,
      creadoEn: new Date().toISOString(),
    };

    try {
      const { data } = await httpClient.post<any>("/promociones/", {
        titulo: newPromo.titulo,
        descripcion: newPromo.descripcion,
        imagen_url: newPromo.imagenUrl,
        activo: newPromo.activo,
        tipo: newPromo.tipo,
        min_pares: newPromo.minPares,
        descuento_porcentaje: newPromo.descuentoPorcentaje,
        descuento_fijo: newPromo.descuentoFijo,
      });
      const remote = toPromotion(safeUnwrap(data));
      if (remote && remote.id) newPromo.id = remote.id;
    } catch {
      // Backend fallback
    }

    const current = this._getCustomPromos();
    const updated = [newPromo, ...current.filter((p) => p.id !== newPromo.id)];
    this._saveCustomPromos(updated);
    return newPromo;
  }

  async updatePromotion(id: number, payload: Partial<Promotion>): Promise<Promotion> {
    const current = this._getCustomPromos();
    const existing = current.find((p) => p.id === id);
    const updatedPromo: Promotion = {
      id,
      titulo: payload.titulo !== undefined ? payload.titulo : existing?.titulo || "Promoción",
      descripcion: payload.descripcion !== undefined ? payload.descripcion : existing?.descripcion || "",
      imagenUrl: payload.imagenUrl !== undefined ? payload.imagenUrl : existing?.imagenUrl || null,
      activo: payload.activo !== undefined ? payload.activo : existing?.activo ?? true,
      tipo: payload.tipo || existing?.tipo || "ENVIO_GRATIS_DOS_PARES",
      minPares: payload.minPares !== undefined ? payload.minPares : existing?.minPares ?? 2,
      descuentoPorcentaje: payload.descuentoPorcentaje !== undefined ? payload.descuentoPorcentaje : existing?.descuentoPorcentaje,
      descuentoFijo: payload.descuentoFijo !== undefined ? payload.descuentoFijo : existing?.descuentoFijo,
      creadoEn: existing?.creadoEn || new Date().toISOString(),
    };

    try {
      await httpClient.put<any>(`/promociones/${id}/`, {
        titulo: updatedPromo.titulo,
        descripcion: updatedPromo.descripcion,
        imagen_url: updatedPromo.imagenUrl,
        activo: updatedPromo.activo,
        tipo: updatedPromo.tipo,
        min_pares: updatedPromo.minPares,
        descuento_porcentaje: updatedPromo.descuentoPorcentaje,
        descuento_fijo: updatedPromo.descuentoFijo,
      }).catch(() => httpClient.patch<any>(`/promociones/${id}/`, { activo: updatedPromo.activo }));
    } catch {
      // Backend fallback
    }

    const newList = current.map((p) => (p.id === id ? updatedPromo : p));
    if (!newList.some((p) => p.id === id)) newList.unshift(updatedPromo);
    this._saveCustomPromos(newList);
    return updatedPromo;
  }

  async deletePromotion(id: number): Promise<void> {
    try {
      await httpClient.delete(`/promociones/${id}/`);
    } catch {
      // Backend fallback
    }
    const current = this._getCustomPromos();
    const updated = current.filter((p) => p.id !== id);
    this._saveCustomPromos(updated);
  }

  async togglePromotion(id: number, activo: boolean): Promise<Promotion> {
    return this.updatePromotion(id, { activo });
  }
}
