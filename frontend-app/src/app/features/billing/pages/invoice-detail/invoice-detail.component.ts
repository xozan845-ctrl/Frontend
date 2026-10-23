import { Component, computed, effect, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectSeoCleanup } from '../../../../core/services/seo/seo.service';
import { AppDatePipe } from '../../../../shared/pipes/app-date.pipe';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { BILLING_INVOICES, paymentTermLabel } from '../../constants/billing.fixtures';
import { InvoiceLinesTableComponent } from '../../components/invoice-lines-table/invoice-lines-table.component';
import { InvoiceStatusBadgeComponent } from '../../components/invoice-status-badge/invoice-status-badge.component';
import { InvoiceTotalsPanelComponent } from '../../components/invoice-totals-panel/invoice-totals-panel.component';
import { BILLING_STORE_NAME } from '../../constants/billing.constants';

/**
 * Página "Detalle de factura" (`facturas/:id`, ADR-23): comprobante con datos
 * de la tienda y del cliente, líneas, totales y estado. Preparada para
 * impresión (`@media print`) y con el id enlazado por `withComponentInputBinding`.
 */
@Component({
  selector: 'app-billing-invoice-detail',
  standalone: true,
  imports: [
    RouterLink,
    AppDatePipe,
    EmptyStateComponent,
    InvoiceLinesTableComponent,
    InvoiceStatusBadgeComponent,
    InvoiceTotalsPanelComponent,
  ],
  templateUrl: './invoice-detail.component.html',
})
export default class InvoiceDetailComponent {
  /** Parámetro de ruta (`facturas/:id`) enlazado con `withComponentInputBinding`. */
  readonly id = input.required<string>();

  private readonly seoService = injectSeoCleanup();

  readonly storeName = BILLING_STORE_NAME;
  readonly invoice = computed(() => BILLING_INVOICES.find((item) => item.id === this.id()) ?? null);
  readonly paymentTerm = computed(() => {
    const invoice = this.invoice();
    return invoice ? paymentTermLabel(invoice.paymentTerm) : '';
  });

  /** SEO inicial y dinámico de la factura (`R-AR-15`, `R-UX-6`). */
  private readonly syncInvoiceSeo = effect(() => {
    const invoice = this.invoice();
    if (invoice) {
      this.seoService.setPage(
        `Factura ${invoice.number} — Facturación`,
        `Comprobante de la factura ${invoice.number} de ${invoice.clientName}.`,
      );
    } else {
      this.seoService.setPage(
        'Detalle de factura — Facturación',
        'Revisa el comprobante, las líneas y los totales de una factura.',
      );
    }
  });

  print(): void {
    window.print();
  }
}
