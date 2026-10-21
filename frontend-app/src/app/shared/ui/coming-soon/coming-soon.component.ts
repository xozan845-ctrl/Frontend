import { Component, effect, input } from '@angular/core';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { injectSeoCleanup } from '../../../core/services/seo/seo.service';

/**
 * Página genérica "En construcción" (`R-UX-1`, `R-SH-3`): las secciones sin
 * fase se muestran como páginas reales con SEO propio (`R-UX-6`) en lugar de
 * enlaces muertos. `title`, `description`, `icon` y `context` llegan desde
 * `data` de la ruta con `withComponentInputBinding`.
 */
@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [EmptyStateComponent],
  templateUrl: './coming-soon.component.html',
})
export default class ComingSoonComponent {
  readonly title = input.required<string>();
  readonly description = input('Estamos preparando esta sección.');
  readonly icon = input('fa-solid fa-screwdriver-wrench');
  /** Módulo al que pertenece la sección; se usa en el título del documento. */
  readonly context = input('Quantum Store');

  private readonly seoService = injectSeoCleanup();

  private readonly syncSeo = effect(() => {
    this.seoService.setPage(`${this.title()} — ${this.context()}`, this.description());
  });
}
