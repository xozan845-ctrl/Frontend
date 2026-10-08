import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { formatCurrency } from '../config/currency.config';

/**
 * Servicio transversal de SEO dinámico (`R-UX-6`): centraliza el `<title>` y
 * las `<meta>` de cada página para no repetir metadatos en cada componente.
 *
 * `providedIn: 'root'` → instancia única y *tree-shakeable* si nadie lo inyecta.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  private readonly defaultTitle = 'Quantum Store — Hardware Premium';
  private readonly defaultDescription =
    'Selección editorial de tecnología de alto rendimiento. Hardware sin concesiones para profesionales exigentes.';

  /** Aplica el patrón "Página | Marca" (lo específico primero, mejor para SEO). */
  updateTitle(pageTitle?: string): void {
    this.title.setTitle(pageTitle ? `${pageTitle} | Quantum Store` : this.defaultTitle);
  }

  /**
   * Actualiza `name="description"`. Se usa `||` (no `??`) a propósito: un
   * string vacío también debe caer al valor por defecto.
   */
  updateMeta(description?: string): void {
    this.meta.updateTag({ name: 'description', content: description || this.defaultDescription });
  }

  /** SEO completo de una ficha de producto, incluida Open Graph para compartir. */
  setProductPage(name: string, description: string, price: number): void {
    this.updateTitle(name);
    this.updateMeta(`${description.slice(0, 150)} — Desde ${formatCurrency(price)}`);
    this.meta.updateTag({ property: 'og:title', content: `${name} | Quantum Store` });
    this.meta.updateTag({ property: 'og:description', content: description.slice(0, 200) });
    this.meta.updateTag({ property: 'og:type', content: 'product' });
  }

  /** Título y descripción de una página genérica (sin Open Graph). */
  setPage(title: string, description?: string): void {
    this.updateTitle(title);
    this.updateMeta(description);
  }

  /** Restaura los metadatos por defecto (p. ej. en `ngOnDestroy` al salir). */
  reset(): void {
    this.updateTitle();
    this.updateMeta();
  }
}
