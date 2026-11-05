import { Component, computed, input } from '@angular/core';
import { INVOICE_STATUS_LABELS } from '../../constants/billing.constants';
import { InvoiceStatus } from '../../models/billing.model';

/** Clases AA por estado (`R-AC-5`). */
const STATUS_CLASSES: Readonly<Record<InvoiceStatus, string>> = {
  borrador: 'badge-warning',
  emitida: 'badge-info',
  pagada: 'badge-success',
  anulada: 'badge-danger',
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
