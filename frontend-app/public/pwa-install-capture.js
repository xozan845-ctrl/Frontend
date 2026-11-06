/**
 * Captura `beforeinstallprompt` antes de que arranque Angular.
 *
 * Chrome puede emitir el evento antes de que el componente PWA se construya;
 * guardarlo aquí evita perder el prompt y que el banner de instalación nunca
 * aparezca. El componente escucha `pwa-install-available` y consume
 * `window.__pwaInstallPrompt`.
 */
(function capturePwaInstallPrompt() {
  window.__pwaInstallPrompt = null;

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    window.__pwaInstallPrompt = event;
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });

  window.addEventListener('appinstalled', function () {
    window.__pwaInstallPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
})();
