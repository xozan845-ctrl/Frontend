import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import { SkeletonLoaderComponent } from '../../../../../shared/ui/skeleton/skeleton-loader.component';
import { Invoice } from '../../models/billing.model';
import { InvoiceStatusBadgeComponent } from '../invoice-status-badge/invoice-status-badge.component';

/**
 * Tabla de facturas (presentacional, `R-SO-8`): listado completo y "recientes"
 * del POS. Recibe las facturas ya filtradas y emite el reintento. Reutiliza el
 * badge de estado y el formato de moneda del proyecto.
 */
@Component({
  selector: 'app-invoice-list-table',
  standalone: true,
  imports: [
    RouterLink,
    AppCurrencyPipe,
    AppDatePipe,
    InvoiceStatusBadgeComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './invoice-list-table.component.html',
})
export class InvoiceListTableComponent {
  readonly invoices = input.required<readonly Invoice[]>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly title = input('Facturas registradas');
  readonly showViewAll = input(true);
  readonly emptyTitle = input('Aún no hay facturas');
  readonly emptySubtitle = input('Las facturas que emitas aparecerán aquí.');
  readonly retry = output<void>();

  protected readonly retryClick = (): void => this.retry.emit();
  protected readonly countLabel = computed(() => {
    const count = this.invoices().length;
    return `${count} ${count === 1 ? 'factura' : 'facturas'}`;
  });
}
