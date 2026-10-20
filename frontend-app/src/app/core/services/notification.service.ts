import { Injectable, signal } from '@angular/core';
import type { Notification, NotificationType } from '../models/notification.model';

export type { Notification, NotificationType } from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private nextId = 0;
  readonly messages = signal<Notification[]>([]);

  showSuccess(message: string): void {
    this.addNotification(message, 'success');
  }

  showError(message: string): void {
    this.addNotification(message, 'error');
  }

  showInfo(message: string): void {
    this.addNotification(message, 'info');
  }

  dismiss(id: number): void {
    this.messages.update((msgs) => msgs.filter((m) => m.id !== id));
  }

  private addNotification(message: string, type: NotificationType): void {
    const id = this.nextId++;
    this.messages.update((msgs) => [...msgs, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => this.dismiss(id), 4000);
  }
}
