import { Component, inject, signal } from '@angular/core';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { VendorOffer } from '../../models/vendor-offer.model';
import { VendorOffersStore } from '../../state/vendor-offers/vendor-offers.store';

/**
 * Ofertas del vendedor (ADR-29): lista paginada y edición del margen. La
 * página solo orquesta el `VendorOffersStore`; el HTTP y los errores viven en
 * las capas de estado/servicio (`R-CX-3`, `R-AR-9`).
 */
@Component({
  selector: 'app-vendor-products',
  standalone: true,
  imports: [AppCurrencyPipe, SkeletonLoaderComponent],
  templateUrl: './products.component.html',
})
export default class VendorProductsComponent {
  readonly offers = inject(VendorOffersStore);
  private readonly seoService = injectSeoPage(
    'Productos — Panel del vendedor',
    'Consulta tus ofertas publicadas, su stock y ajusta el margen de venta.',
  );

  readonly marginDrafts = signal<Record<string, number>>({});
  readonly validationError = signal<string | null>(null);

  private readonly loadOffers = this.offers.loadPage(1);

  marginOf(offer: VendorOffer): number {
    return this.marginDrafts()[offer.id] ?? offer.margin;
  }

  onMarginInput(offer: VendorOffer, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(value)) return;
    this.marginDrafts.update((drafts) => ({ ...drafts, [offer.id]: value }));
  }

  saveMargin(offer: VendorOffer): void {
    const margin = this.marginOf(offer);
    if (!Number.isInteger(margin) || margin < 0 || margin > 90) {
      this.validationError.set('El margen debe ser un entero entre 0 y 90.');
      return;
    }

    this.validationError.set(null);
    this.offers.updateMargin({ offerId: offer.id, margin });
  }

  isSaving(offerId: string): boolean {
    return this.offers.savingId() === offerId;
  }

  previousPage(): void {
    if (!this.offers.isFirstPage()) {
      this.offers.loadPage(this.offers.page() - 1);
    }
  }

  nextPage(): void {
    if (!this.offers.isLastPage()) {
      this.offers.loadPage(this.offers.page() + 1);
    }
  }

  refresh(): void {
    this.offers.refresh();
  }
}
