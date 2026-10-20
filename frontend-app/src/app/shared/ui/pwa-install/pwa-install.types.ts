/** Evento `beforeinstallprompt` (aún no tipado estándar en lib.dom). */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
