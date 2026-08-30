import type { CatalogRepositoryPort } from "@/domain/ports/CatalogRepositoryPort";
import type { ProductFilters, Promotion } from "@/domain/entities/Product";

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
    const [bRes, cRes, sRes] = await Promise.allSettled([
      this.repo.getBrands(),
      this.repo.getCategories(),
      this.repo.getSizes(),
    ]);
    const brands = bRes.status === "fulfilled" ? bRes.value : [];
    const categories = cRes.status === "fulfilled" ? cRes.value : [];
    const sizes = sRes.status === "fulfilled" ? sRes.value : [];
    return { brands, categories, sizes };
  }
}

export class GetPromotionsUseCase {
  constructor(private repo: CatalogRepositoryPort) {}
  execute() {
    return this.repo.getPromotions();
  }
}

export class CreatePromotionUseCase {
  constructor(private repo: CatalogRepositoryPort) {}
  execute(payload: Partial<Promotion>) {
    if (!payload.titulo?.trim()) throw new Error("El título de la promoción es obligatorio.");
    return this.repo.createPromotion(payload);
  }
}

export class UpdatePromotionUseCase {
  constructor(private repo: CatalogRepositoryPort) {}
  execute(id: number, payload: Partial<Promotion>) {
    return this.repo.updatePromotion(id, payload);
  }
}

export class DeletePromotionUseCase {
  constructor(private repo: CatalogRepositoryPort) {}
  execute(id: number) {
    return this.repo.deletePromotion(id);
  }
}

export class TogglePromotionUseCase {
  constructor(private repo: CatalogRepositoryPort) {}
  execute(id: number, activo: boolean) {
    return this.repo.togglePromotion(id, activo);
  }
}
