import type { NotificationItem } from "@/domain/entities/User";
import type { NotificationRepositoryPort } from "@/domain/ports/NotificationRepositoryPort";

export class GetNotificationsUseCase {
  constructor(private repo: NotificationRepositoryPort) {}
  execute() {
    return this.repo.getNotifications();
  }
}

export class MarkNotificationReadUseCase {
  constructor(private repo: NotificationRepositoryPort) {}
  execute(id: number): Promise<NotificationItem> {
    return this.repo.markAsRead(id);
  }
}
