import type { Product, Brand, Category, Talla } from "../entities/Product";
import type { Order } from "../entities/Order";
import type { User, PaymentProof, EmailCampaign, AdminStats, CommissionReport } from "../entities/User";
import type {
  CreateProductDTO,
  CreateVariantDTO,
  UpdateVariantDTO,
  CreateBrandDTO,
  UpdateBrandDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CreateTallaDTO,
  UpdateTallaDTO,
  VerifyPaymentDTO,
  ShipOrderDTO,
  CreateCampaignDTO,
  CreateUserDTO,
  UpdateUserDTO,
} from "@/application/dtos/admin.dto";

export interface AdminRepositoryPort {
  uploadImage(
    file: File,
    appLabel?: string,
    model?: string,
    objectId?: number
  ): Promise<{ id: number; url: string }>;

  createProduct(payload: CreateProductDTO): Promise<Product>;
  updateProduct(id: number, payload: Partial<CreateProductDTO>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  createVariant(payload: CreateVariantDTO): Promise<void>;
  updateVariant(id: number, payload: UpdateVariantDTO): Promise<void>;
  deleteVariant(id: number): Promise<void>;
  createBrand(payload: CreateBrandDTO): Promise<Brand>;
  updateBrand(id: number, payload: UpdateBrandDTO): Promise<Brand>;
  deleteBrand(id: number): Promise<void>;
  getBrands(): Promise<Brand[]>;
  createCategory(payload: CreateCategoryDTO): Promise<Category>;
  updateCategory(id: number, payload: UpdateCategoryDTO): Promise<Category>;
  deleteCategory(id: number): Promise<void>;
  getCategories(): Promise<Category[]>;
  createTalla(payload: CreateTallaDTO): Promise<Talla>;
  updateTalla(id: number, payload: UpdateTallaDTO): Promise<Talla>;
  deleteTalla(id: number): Promise<void>;
  getTallas(): Promise<Talla[]>;

  // User Management
  getUsers(rol?: string): Promise<User[]>;
  createUser(payload: CreateUserDTO): Promise<User>;
  updateUser(id: number, payload: UpdateUserDTO): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Payment Proofs & Order Processing
  getPendingPayments(): Promise<PaymentProof[]>;
  verifyPayment(payload: VerifyPaymentDTO): Promise<void>;
  shipOrder(payload: ShipOrderDTO): Promise<Order>;
  deliverOrder(pedidoId: number): Promise<Order>;

  // Dashboard Stats & Commissions
  getAdminStats(): Promise<AdminStats>;
  getSellerOrders(vendedorId?: number): Promise<Order[]>;
  getCommissionReport(): Promise<CommissionReport[]>;

  // Email Campaigns
  getCampaigns(): Promise<EmailCampaign[]>;
  createCampaign(payload: CreateCampaignDTO): Promise<EmailCampaign>;
  sendCampaign(campaignId: number): Promise<{ totalEnviados: number; totalFallidos: number }>;
}
