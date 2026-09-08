import type { CustomNotificationPayload, NotificationItem, PushSubscriptionPayload } from "@/domain/entities/User";

export interface NotificationRepositoryPort {
  getNotifications(): Promise<NotificationItem[]>;
  markAsRead(id: number): Promise<NotificationItem>;
  markAllAsRead(): Promise<void>;
  deleteNotification(id: number): Promise<void>;
  sendCustomNotification(payload: CustomNotificationPayload): Promise<{ success: boolean; totalEnviados: number; notification: NotificationItem }>;
  getAdminNotificationHistory(): Promise<NotificationItem[]>;
  subscribeWebPush(subscription: PushSubscriptionPayload): Promise<boolean>;
  getVapidPublicKey(): Promise<string | null>;
}
