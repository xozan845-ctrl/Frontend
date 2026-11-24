import { Component, input } from '@angular/core';
import { injectSeoPage } from '@core/services/seo/seo.service';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { BillingDemoBannerComponent } from '../../components/billing-demo-banner/billing-demo-banner.component';

/**
 * Página "Detalle de factura" (`facturas/:id`, ADR-23, `R-DO-3`): la
 * facturación es `demo` y no existe fuente de comprobantes, así que no se
 * sintetiza ninguno. El parámetro de ruta se mantiene enlazado con
 * `withComponentInputBinding` para cuando se integre la fuente real.
 */
@Component({
  selector: 'app-billing-invoice-detail',
  standalone: true,
  imports: [BillingDemoBannerComponent, EmptyStateComponent],
  templateUrl: './invoice-detail.component.html',
})
export default class InvoiceDetailComponent {
  /** Parámetro de ruta (`facturas/:id`) enlazado con `withComponentInputBinding`. */
  readonly id = input.required<string>();

  private readonly seoService = injectSeoPage(
    'Detalle de factura — Facturación',
    'Revisa el comprobante, las líneas y los totales de una factura real cuando el módulo se integre.',
  );
}
