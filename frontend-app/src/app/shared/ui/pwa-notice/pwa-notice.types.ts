/** Evento `beforeinstallprompt` (aún no tipado estándar en lib.dom). */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    /** Prompt capturado por `public/pwa-install-capture.js` antes de Angular. */
    __pwaInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}
