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

export interface CatalogRepositoryPort {
  getProducts(filters: ProductFilters): Promise<PaginatedResult<ProductSummary>>;
  getProductById(id: number): Promise<Product>;
  getBrands(): Promise<Brand[]>;
  getCategories(): Promise<Category[]>;
  getSizes(): Promise<Size[]>;
  getPromotions(): Promise<Promotion[]>;
}
