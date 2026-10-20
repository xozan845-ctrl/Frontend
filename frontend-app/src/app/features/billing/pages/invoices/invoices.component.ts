import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { BILLING_INVOICES } from '../../constants/billing.fixtures';
import { InvoiceFiltersChipsComponent } from '../../components/invoice-filters-chips/invoice-filters-chips.component';
import { InvoiceListTableComponent } from '../../components/invoice-list-table/invoice-list-table.component';
import { INVOICE_STATUSES } from '../../constants/billing.constants';
import { InvoiceStatus } from '../../models/billing.model';

/**
 * Página "Facturas" (ADR-23): listado con filtro por estado en chips y acceso
 * al detalle. En esta fase los datos son de presentación; el filtro y los
 * conteos se derivan en la página con `computed` (`R-ST-3`).
 */
@Component({
  selector: 'app-billing-invoices',
  standalone: true,
  imports: [RouterLink, InvoiceFiltersChipsComponent, InvoiceListTableComponent],
  templateUrl: './invoices.component.html',
})
export default class InvoicesComponent implements OnDestroy {
  private readonly seoService = inject(SeoService);

  readonly statuses = INVOICE_STATUSES;
  readonly statusFilter = signal<InvoiceStatus | null>(null);
  readonly invoices = [...BILLING_INVOICES].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

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
    this.statusFilter() ? 'Sin facturas con este estado' : 'Aún no hay facturas',
  );

  readonly emptySubtitle = computed(() =>
    this.statusFilter()
      ? 'Prueba con otro filtro o crea una factura nueva.'
      : 'Las facturas que emitas aparecerán aquí.',
  );

  constructor() {
    this.seoService.setPage(
      'Facturas — Facturación',
      'Consulta todas las facturas de tu tienda, filtra por estado y abre el comprobante de cada una.',
    );
  }

  ngOnDestroy(): void {
    this.seoService.reset();
  }

  setFilter(status: InvoiceStatus | null): void {
    this.statusFilter.set(status);
  }
}
