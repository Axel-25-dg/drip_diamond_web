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

export interface ComisionItem {
  id: number;
  pedidoId: number;
  vendedorId: number;
  cantidadPares: number;
  montoPorPar: number;
  monto: number;
  estado: "PENDIENTE" | "LIQUIDADA";
  generadaEn: string;
}

export interface Liquidacion {
  id: number;
  vendedorId: number;
  vendedorNombre?: string;
  periodoAnio: number;
  periodoMes: number;
  totalPares: number;
  totalComisiones: number;
  pagada: boolean;
  fechaPago?: string | null;
  comprobanteUrl?: string | null;
  comisiones?: ComisionItem[];
  creadaEn: string;
}

export interface AdminRepositoryPort {
  uploadImage(file: File, appLabel?: string, model?: string, objectId?: number): Promise<{ id: number; url: string }>;

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
  prepareOrder(pedidoId: number): Promise<Order>;
  updateOrderStatus(pedidoId: number, estado: string, extra?: Record<string, any>): Promise<Order>;

  // Dashboard Stats & Commissions
  getAdminStats(): Promise<AdminStats>;
  getSellerOrders(vendedorId?: number): Promise<Order[]>;
  getCommissionReport(): Promise<CommissionReport[]>;
  getSellerCommissionSummary(): Promise<{
    totalComisiones: number;
    comisionesPendientes: number;
    comisionesPagadas: number;
    ventasEntregadas: number;
    ventasAsignadas: number;
  } | null>;

  // Liquidaciones mensuales
  getLiquidaciones(vendedorId?: number): Promise<Liquidacion[]>;
  getComisionesPendientes(vendedorId?: number): Promise<ComisionItem[]>;
  generarLiquidacion(vendedorId: number, anio: number, mes: number): Promise<Liquidacion>;
  marcarLiquidacionPagada(liquidacionId: number, comprobante: File): Promise<Liquidacion>;

  // Email Campaigns
  getCampaigns(): Promise<EmailCampaign[]>;
  createCampaign(payload: CreateCampaignDTO): Promise<EmailCampaign>;
  sendCampaign(campaignId: number): Promise<{ totalEnviados: number; totalFallidos: number }>;
}
