import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectSeoPage } from '@core/services/seo/seo.service';
import { BillingDemoBannerComponent } from '../../components/billing-demo-banner/billing-demo-banner.component';
import { InvoiceFiltersChipsComponent } from '../../components/invoice-filters-chips/invoice-filters-chips.component';
import { InvoiceListTableComponent } from '../../components/invoice-list-table/invoice-list-table.component';
import { INVOICE_STATUSES } from '../../constants/billing.constants';
import { Invoice, InvoiceStatus } from '../../models/billing.model';

/**
 * Página "Facturas" (ADR-23, `R-DO-3`): filtro por estado y listado. La
 * facturación es `demo`, así que no se pintan facturas ni conteos ficticios:
 * la fuente real aún no existe y la etiqueta lo hace explícito. Los derivados
 * se calculan en la página con `computed` (`R-ST-3`) para cuando llegue esa
 * fuente, hoy vacía.
 */
@Component({
  selector: 'app-billing-invoices',
  standalone: true,
  imports: [
    RouterLink,
    BillingDemoBannerComponent,
    InvoiceFiltersChipsComponent,
    InvoiceListTableComponent,
  ],
  templateUrl: './invoices.component.html',
})
export default class InvoicesComponent {
  private readonly seoService = injectSeoPage(
    'Facturas — Facturación',
    'Explora el listado de facturas; mientras el módulo sea demo no hay operaciones reales que mostrar.',
  );

  readonly statuses = INVOICE_STATUSES;
  readonly statusFilter = signal<InvoiceStatus | null>(null);
  readonly invoices: readonly Invoice[] = [];

  readonly counts = computed<Record<InvoiceStatus, number>>(() => {
    const counts: Record<InvoiceStatus, number> = {
      borrador: 0,
      emitida: 0,
      pagada: 0,
      anulada: 0,
    };
    for (const invoice of this.invoices) {
      counts[invoice.status] += 1;
    }
    return counts;
  });

  readonly filteredInvoices = computed(() => {
    const filter = this.statusFilter();
    return filter ? this.invoices.filter((invoice) => invoice.status === filter) : this.invoices;
  });

  readonly emptyTitle = computed(() =>
    this.statusFilter() ? 'Sin facturas con este estado' : 'Aún no hay facturas reales',
  );

  readonly emptySubtitle = computed(() =>
    this.statusFilter()
      ? 'Prueba con otro filtro cuando haya facturas reales.'
      : 'Las facturas aparecerán aquí cuando el módulo se conecte a una fuente real.',
  );

  setFilter(status: InvoiceStatus | null): void {
    this.statusFilter.set(status);
  }
}
