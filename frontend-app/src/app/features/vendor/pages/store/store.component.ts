import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { VendorStoreStore } from '../../state/vendor-store/vendor-store.store';

/**
 * Ficha de la tienda del vendedor (`GET /vendedores/me/tienda`, ADR-31):
 * identidad, empresa, participación y accesos a la tienda pública y al panel.
 */
@Component({
  selector: 'app-vendor-store',
  standalone: true,
  imports: [RouterLink, DatePipe, SkeletonLoaderComponent],
  templateUrl: './store.component.html',
})
export default class VendorStoreComponent {
  readonly vendorStore = inject(VendorStoreStore);
  private readonly seoService = injectSeoPage(
    'Mi tienda — Panel del vendedor',
    'Consulta la ficha de tu tienda, su empresa, participación y enlace público.',
  );

  private readonly loadStore = this.vendorStore.load();
}
