import { Component, computed, input } from '@angular/core';
import { INVOICE_STATUS_LABELS } from '../../constants/billing.constants';
import { InvoiceStatus } from '../../models/billing.model';

/** Clases AA por estado (`R-AC-5`). */
const STATUS_CLASSES: Readonly<Record<InvoiceStatus, string>> = {
  borrador: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  emitida: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  pagada: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  anulada: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

/**
 * Badge de estado de la factura (presentacional, `R-SO-8`): etiqueta humana
 * (`R-UX-4`) y color con contraste AA (`R-AC-5`).
 */
@Component({
  selector: 'app-invoice-status-badge',
  standalone: true,
  templateUrl: './invoice-status-badge.component.html',
})
export class InvoiceStatusBadgeComponent {
  readonly status = input.required<InvoiceStatus>();

  protected readonly label = computed(() => INVOICE_STATUS_LABELS[this.status()]);
  protected readonly badgeClasses = computed(() => STATUS_CLASSES[this.status()]);
}
