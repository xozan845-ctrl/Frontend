import { Component } from '@angular/core';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [EmptyStateComponent],
  templateUrl: './not-found.component.html',
})
export default class NotFoundComponent {
  private readonly seoService = injectSeoPage(
    'Página no encontrada',
    'La página que buscas no existe o fue movida.',
  );
}
