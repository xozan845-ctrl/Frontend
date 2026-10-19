import { Component, computed, input, output } from '@angular/core';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { BILLING_TAX_RATE } from '../../constants/billing.constants';

/**
 * Totales de la factura (presentacional, `R-SO-8`): subtotal, descuento
 * editable en porcentaje, IVA y total. No calcula: recibe los derivados y solo
 * emite el descuento digitado. En modo lectura (detalle) oculta el campo.
 */
@Component({
  selector: 'app-invoice-totals-panel',
  standalone: true,
  imports: [AppCurrencyPipe],
  templateUrl: './invoice-totals-panel.component.html',
})
export class InvoiceTotalsPanelComponent {
  readonly subtotal = input.required<number>();
  readonly discountPercent = input.required<number>();
  readonly discountAmount = input.required<number>();
  readonly taxAmount = input.required<number>();
  readonly total = input.required<number>();
  readonly editable = input(true);
  readonly discountChange = output<number>();

  protected readonly taxLabel = computed(() => `IVA (${Math.round(BILLING_TAX_RATE * 100)} %)`);

  onDiscountInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.discountChange.emit(Number.isFinite(value) ? value : 0);
  }
}
