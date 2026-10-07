import { Component, OnDestroy, inject } from '@angular/core';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [EmptyStateComponent],
  templateUrl: './not-found.component.html',
})
export default class NotFoundComponent implements OnDestroy {
  private readonly seoService = inject(SeoService);

  constructor() {
    this.seoService.setPage('Página no encontrada', 'La página que buscas no existe o fue movida.');
  }

  ngOnDestroy(): void {
    this.seoService.reset();
  }
}
