import { ApiCatalogRepository } from "@/infrastructure/repositories/ApiCatalogRepository";
import { ApiAuthRepository } from "@/infrastructure/repositories/ApiAuthRepository";
import { ApiCartRepository } from "@/infrastructure/repositories/ApiCartRepository";
import { ApiOrderRepository } from "@/infrastructure/repositories/ApiOrderRepository";
import { ApiAdminRepository } from "@/infrastructure/repositories/ApiAdminRepository";
import { ApiNotificationRepository } from "@/infrastructure/repositories/ApiNotificationRepository";

export const catalogRepository = new ApiCatalogRepository();
export const authRepository = new ApiAuthRepository();
export const cartRepository = new ApiCartRepository();
export const orderRepository = new ApiOrderRepository();
export const adminRepository = new ApiAdminRepository();
export const notificationRepository = new ApiNotificationRepository();
