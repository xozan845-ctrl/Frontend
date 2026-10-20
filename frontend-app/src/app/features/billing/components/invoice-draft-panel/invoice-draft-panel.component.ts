import { Component, computed, input, output } from '@angular/core';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { InvoiceLine, invoiceLineTotal } from '../../models/billing.model';
import { InvoiceTotalsPanelComponent } from '../invoice-totals-panel/invoice-totals-panel.component';
import type { InvoiceLineQuantityChange } from './invoice-draft-panel.types';

/**
 * Panel "Factura actual" (presentacional, `R-SO-8`): líneas con steppers,
 * totales, notas y acciones de emisión. No calcula ni conoce stores: recibe
 * los derivados y emite intenciones de dominio.
 */
@Component({
  selector: 'app-invoice-draft-panel',
  standalone: true,
  imports: [AppCurrencyPipe, InvoiceTotalsPanelComponent],
  templateUrl: './invoice-draft-panel.component.html',
})
export class InvoiceDraftPanelComponent {
  readonly lines = input.required<readonly InvoiceLine[]>();
  readonly subtotal = input.required<number>();
  readonly discountPercent = input.required<number>();
  readonly discountAmount = input.required<number>();
  readonly taxAmount = input.required<number>();
  readonly total = input.required<number>();
  readonly notes = input.required<string>();
  readonly emitting = input(false);
  readonly quantityChange = output<InvoiceLineQuantityChange>();
  readonly removeLine = output<string>();
  readonly discountChange = output<number>();
  readonly notesChange = output<string>();
  readonly emitInvoice = output<void>();
  readonly saveDraft = output<void>();

  protected readonly isEmpty = computed(() => this.lines().length === 0);
  protected readonly submitDisabled = computed(() => this.isEmpty() || this.emitting());
  protected readonly countLabel = computed(() => {
    const count = this.lines().length;
    return `${count} ${count === 1 ? 'producto' : 'productos'}`;
  });

  protected lineTotal(line: InvoiceLine): number {
    return invoiceLineTotal(line);
  }

  protected decrease(line: InvoiceLine): void {
    if (line.quantity > 1) {
      this.quantityChange.emit({ productId: line.productId, quantity: line.quantity - 1 });
    }
  }

  protected increase(line: InvoiceLine): void {
    if (line.quantity < 999) {
      this.quantityChange.emit({ productId: line.productId, quantity: line.quantity + 1 });
    }
  }

  onNotesInput(event: Event): void {
    this.notesChange.emit((event.target as HTMLTextAreaElement).value);
  }
}
