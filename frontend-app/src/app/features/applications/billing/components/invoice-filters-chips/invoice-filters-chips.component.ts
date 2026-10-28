import { Component, input, output } from '@angular/core';
import { INVOICE_STATUS_LABELS } from '../../constants/billing.constants';
import { InvoiceStatus } from '../../models/billing.model';

/**
 * Chips de filtro por estado (presentacional, `R-SO-8`): mismo lenguaje visual
 * que las categorías del catálogo. Recibe los conteos ya calculados.
 */
@Component({
  selector: 'app-invoice-filters-chips',
  standalone: true,
  templateUrl: './invoice-filters-chips.component.html',
})
export class InvoiceFiltersChipsComponent {
  readonly statuses = input.required<readonly InvoiceStatus[]>();
  readonly counts = input.required<Record<InvoiceStatus, number>>();
  readonly total = input.required<number>();
  readonly selected = input<InvoiceStatus | null>(null);
  readonly selectedChange = output<InvoiceStatus | null>();

  protected readonly labels = INVOICE_STATUS_LABELS;

  chipClasses(active: boolean): string {
    const base =
      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:outline-hidden';
    return active
      ? `${base} border-accent-600 bg-accent-600 text-white`
      : `${base} border-slate-200 text-slate-600 hover:border-accent-500 hover:text-accent-600 dark:border-surface-600 dark:text-slate-300 dark:hover:border-accent-500 dark:hover:text-accent-400`;
  }
}
