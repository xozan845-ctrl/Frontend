import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

const DEFAULT_ICONS: Record<string, string> = {
  icon: 'favicon.ico',
  'apple-touch-icon': 'icon.svg',
};

function mimeFromUrl(url: string): string | null {
  const path = url.split(/[?#]/)[0]?.toLowerCase() ?? '';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.ico')) return 'image/x-icon';
  return null;
}

/**
 * Branding reactivo de la pestaña: aplica el logo de la sección activa
 * (empresa o tienda) al favicon y lo restaura al salir del workspace.
 */
@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly doc = inject(DOCUMENT);

  /** Aplica `logoUrl` al favicon; `null` restaura el icono de la plataforma. */
  setLogo(logoUrl: string | null | undefined): void {
    const href = logoUrl?.trim() || null;
    this.updateLink('icon', href ?? DEFAULT_ICONS['icon']);
    this.updateLink('apple-touch-icon', href ?? DEFAULT_ICONS['apple-touch-icon']);
  }

  reset(): void {
    this.setLogo(null);
  }

  private updateLink(rel: string, href: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', rel);
      this.doc.head.appendChild(link);
    }

    link.setAttribute('href', href);
    const mime = mimeFromUrl(href);
    if (mime) link.setAttribute('type', mime);
    else link.removeAttribute('type');
  }
}
