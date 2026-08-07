import { httpClient, unwrap, type ApiEnvelope } from "@/infrastructure/http/httpClient";
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
  BrandDTO,
  CategoryDTO,
  PaginatedDTO,
  ProductDetailDTO,
  ProductListDTO,
  PromotionDTO,
  SizeDTO,
} from "@/application/dtos/catalog.dto";
import {
  toBrand,
  toCategory,
  toProduct,
  toProductSummary,
  toPromotion,
  toSize,
} from "@/infrastructure/adapters/catalog.adapter";

export class ApiCatalogRepository implements CatalogRepositoryPort {
  async getProducts(filters: ProductFilters): Promise<PaginatedResult<ProductSummary>> {
    const params: Record<string, unknown> = {
      search: filters.search || undefined,
      marca: filters.marcaId || undefined,
      categoria: filters.categoriaId || undefined,
      talla: filters.tallaId || undefined,
      precio_min: filters.precioMin || undefined,
      precio_max: filters.precioMax || undefined,
      ordering: filters.ordering || undefined,
      page: filters.page || 1,
      page_size: filters.pageSize || 50,
    };
    const { data } = await httpClient.get<ApiEnvelope<any>>("/productos/", { params });
    const payload = unwrap(data);
    const rawList: ProductListDTO[] = Array.isArray(payload)
      ? payload
      : payload?.results || (payload?.items ?? []);
    const count: number = Array.isArray(payload) ? payload.length : payload?.count || rawList.length;
    const pageSize = filters.pageSize || 50;

    return {
      items: rawList.map(toProductSummary),
      total: count,
      page: filters.page || 1,
      pageSize,
      totalPages: Math.max(1, Math.ceil(count / pageSize)),
    };
  }

  async getProductById(id: number): Promise<Product> {
    const { data } = await httpClient.get<ApiEnvelope<ProductDetailDTO>>(`/productos/${id}/`);
    return toProduct(unwrap(data));
  }

  async getBrands(): Promise<Brand[]> {
    const { data } = await httpClient.get<ApiEnvelope<any>>("/marcas/");
    const payload = unwrap(data);
    const list = Array.isArray(payload) ? payload : payload?.results || [];
    return list.map(toBrand);
  }

  async getCategories(): Promise<Category[]> {
    const { data } = await httpClient.get<ApiEnvelope<any>>("/categorias/");
    const payload = unwrap(data);
    const list = Array.isArray(payload) ? payload : payload?.results || [];
    return list.map(toCategory);
  }

  async getSizes(): Promise<Size[]> {
    const { data } = await httpClient.get<ApiEnvelope<any>>("/tallas/");
    const payload = unwrap(data);
    const list = Array.isArray(payload) ? payload : payload?.results || [];
    return list.map(toSize);
  }

  async getPromotions(): Promise<Promotion[]> {
    const { data } = await httpClient.get<ApiEnvelope<any>>("/promociones/");
    const payload = unwrap(data);
    const list = Array.isArray(payload) ? payload : payload?.results || [];
    return list.map(toPromotion);
  }
}
