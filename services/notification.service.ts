import type { Notification } from "@/types/domain/identity";

export interface NotificationService {
  listNotifications(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
  createNotification(notification: Notification): Promise<void>;
}
