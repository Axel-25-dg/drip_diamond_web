import type { CatalogRepositoryPort } from "@/domain/ports/CatalogRepositoryPort";
import type { ProductFilters } from "@/domain/entities/Product";

export class GetProductsUseCase {
  constructor(private repo: CatalogRepositoryPort) {}
  execute(filters: ProductFilters) {
    return this.repo.getProducts(filters);
  }
}

export class GetProductDetailUseCase {
  constructor(private repo: CatalogRepositoryPort) {}
  execute(id: number) {
    return this.repo.getProductById(id);
  }
}

export class GetCatalogFiltersUseCase {
  constructor(private repo: CatalogRepositoryPort) {}
  async execute() {
    const [brands, categories, sizes] = await Promise.all([
      this.repo.getBrands(),
      this.repo.getCategories(),
      this.repo.getSizes(),
    ]);
    return { brands, categories, sizes };
  }
}

export class GetPromotionsUseCase {
  constructor(private repo: CatalogRepositoryPort) {}
  execute() {
    return this.repo.getPromotions();
  }
}
