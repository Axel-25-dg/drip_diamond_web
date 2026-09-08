import type { CustomNotificationPayload, NotificationItem, PushSubscriptionPayload } from "@/domain/entities/User";
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

export class MarkAllNotificationsReadUseCase {
  constructor(private repo: NotificationRepositoryPort) {}
  execute(): Promise<void> {
    return this.repo.markAllAsRead();
  }
}

export class DeleteNotificationUseCase {
  constructor(private repo: NotificationRepositoryPort) {}
  execute(id: number): Promise<void> {
    return this.repo.deleteNotification(id);
  }
}

export class SendCustomNotificationUseCase {
  constructor(private repo: NotificationRepositoryPort) {}
  execute(payload: CustomNotificationPayload) {
    return this.repo.sendCustomNotification(payload);
  }
}

export class GetAdminNotificationHistoryUseCase {
  constructor(private repo: NotificationRepositoryPort) {}
  execute() {
    return this.repo.getAdminNotificationHistory();
  }
}

export class SubscribeWebPushUseCase {
  constructor(private repo: NotificationRepositoryPort) {}
  execute(subscription: PushSubscriptionPayload) {
    return this.repo.subscribeWebPush(subscription);
  }
}

export class GetVapidPublicKeyUseCase {
  constructor(private repo: NotificationRepositoryPort) {}
  execute() {
    return this.repo.getVapidPublicKey();
  }
}
