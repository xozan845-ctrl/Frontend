import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { SkeletonLoaderComponent } from '../../../../../shared/ui/skeleton/skeleton-loader.component';
import { CompanyPortalStore } from '../../state/company-portal/company-portal.store';

/** Tiendas consolidadas de la empresa (ADR-43). */
@Component({
  selector: 'app-company-stores',
  standalone: true,
  imports: [RouterLink, DatePipe, SkeletonLoaderComponent],
  templateUrl: './company-stores.component.html',
})
export default class CompanyStoresComponent {
  readonly portal = inject(CompanyPortalStore);
  private readonly seoService = injectSeoPage(
    'Tiendas — Empresa',
    'Consulta las tiendas de tu empresa, su participación y su storefront público.',
  );

  private readonly loadStores = this.portal.loadStores();
}
