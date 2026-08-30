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
  createPromotion(payload: Partial<Promotion>): Promise<Promotion>;
  updatePromotion(id: number, payload: Partial<Promotion>): Promise<Promotion>;
  deletePromotion(id: number): Promise<void>;
  togglePromotion(id: number, activo: boolean): Promise<Promotion>;
}
