import type { AdminRepositoryPort } from "@/domain/ports/AdminRepositoryPort";
import type {
  CreateProductDTO,
  CreateVariantDTO,
  CreateBrandDTO,
  UpdateBrandDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CreateTallaDTO,
  VerifyPaymentDTO,
  ShipOrderDTO,
  CreateCampaignDTO,
  CreateUserDTO,
  UpdateUserDTO,
} from "@/application/dtos/admin.dto";

export class UploadImageUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(file: File, appLabel?: string, model?: string, objectId?: number) {
    return this.repo.uploadImage(file, appLabel, model, objectId);
  }
}

export class CreateProductUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(payload: CreateProductDTO) {
    return this.repo.createProduct(payload);
  }
}

export class UpdateProductUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(id: number, payload: Partial<CreateProductDTO>) {
    return this.repo.updateProduct(id, payload);
  }
}

export class CreateVariantUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(payload: CreateVariantDTO) {
    return this.repo.createVariant(payload);
  }
}

export class CreateBrandUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(payload: CreateBrandDTO) {
    return this.repo.createBrand(payload);
  }
}

export class UpdateBrandUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(id: number, payload: UpdateBrandDTO) {
    return this.repo.updateBrand(id, payload);
  }
}

export class DeleteBrandUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(id: number) {
    return this.repo.deleteBrand(id);
  }
}

export class GetBrandsUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute() {
    return this.repo.getBrands();
  }
}

export class CreateCategoryUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(payload: CreateCategoryDTO) {
    return this.repo.createCategory(payload);
  }
}

export class UpdateCategoryUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(id: number, payload: UpdateCategoryDTO) {
    return this.repo.updateCategory(id, payload);
  }
}

export class DeleteCategoryUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(id: number) {
    return this.repo.deleteCategory(id);
  }
}

export class GetCategoriesUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute() {
    return this.repo.getCategories();
  }
}

export class CreateTallaUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(payload: CreateTallaDTO) {
    return this.repo.createTalla(payload);
  }
}

export class GetTallasUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute() {
    return this.repo.getTallas();
  }
}

export class GetAdminUsersUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(rol?: string) {
    return this.repo.getUsers(rol);
  }
}

export class CreateUserAdminUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(payload: CreateUserDTO) {
    return this.repo.createUser(payload);
  }
}

export class UpdateUserAdminUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(id: number, payload: UpdateUserDTO) {
    return this.repo.updateUser(id, payload);
  }
}

export class DeleteUserAdminUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(id: number) {
    return this.repo.deleteUser(id);
  }
}

export class GetPendingPaymentsUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute() {
    return this.repo.getPendingPayments();
  }
}

export class VerifyPaymentUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(payload: VerifyPaymentDTO) {
    return this.repo.verifyPayment(payload);
  }
}

export class ShipOrderUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(payload: ShipOrderDTO) {
    return this.repo.shipOrder(payload);
  }
}

export class DeliverOrderUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(pedidoId: number) {
    return this.repo.deliverOrder(pedidoId);
  }
}

export class GetAdminStatsUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute() {
    return this.repo.getAdminStats();
  }
}

export class GetSellerOrdersUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(vendedorId?: number) {
    return this.repo.getSellerOrders(vendedorId);
  }
}

export class GetCommissionReportUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute() {
    return this.repo.getCommissionReport();
  }
}

export class GetCampaignsUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute() {
    return this.repo.getCampaigns();
  }
}

export class CreateCampaignUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(payload: CreateCampaignDTO) {
    return this.repo.createCampaign(payload);
  }
}

export class SendCampaignUseCase {
  constructor(private repo: AdminRepositoryPort) {}
  execute(campaignId: number) {
    return this.repo.sendCampaign(campaignId);
  }
}
