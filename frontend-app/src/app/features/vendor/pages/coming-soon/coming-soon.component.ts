import { Component, OnDestroy, OnInit, inject, input } from '@angular/core';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SeoService } from '../../../../core/services/seo.service';

/**
 * Página genérica "En construcción" del panel del vendedor (`R-UX-1`): las
 * secciones sin fase se muestran como páginas reales con SEO propio (`R-UX-6`)
 * en lugar de enlaces muertos. `title` y `description` llegan desde `data` de
 * la ruta con `withComponentInputBinding`.
 */
@Component({
  selector: 'app-vendor-coming-soon',
  standalone: true,
  imports: [EmptyStateComponent],
  templateUrl: './coming-soon.component.html',
})
export default class ComingSoonComponent implements OnInit, OnDestroy {
  readonly title = input.required<string>();
  readonly description = input('Estamos preparando esta sección del panel del vendedor.');
  readonly icon = input('fa-solid fa-screwdriver-wrench');

  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.setPage(`${this.title()} — Panel del vendedor`, this.description());
  }

  ngOnDestroy(): void {
    this.seoService.reset();
  }
}
