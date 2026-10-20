/** Notificaciones de UI (tipos puros). */
export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}
