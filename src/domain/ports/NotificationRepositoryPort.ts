import type { NotificationItem } from "@/domain/entities/User";

export interface NotificationRepositoryPort {
  getNotifications(): Promise<NotificationItem[]>;
  markAsRead(id: number): Promise<NotificationItem>;
}
