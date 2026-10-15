import { Component, computed, input, output } from '@angular/core';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { VENDOR_TAX_RATE } from '../../constants/vendor.constants';

/**
 * Totales del POS (presentacional, `R-SO-8`): subtotal, descuento editable en
 * porcentaje, IVA y total. No calcula: recibe los derivados del store
 * (`R-ST-2`) y solo emite el descuento digitado para que lo saneé el dominio.
 */
@Component({
  selector: 'app-order-totals',
  standalone: true,
  imports: [AppCurrencyPipe],
  templateUrl: './order-totals.component.html',
})
export class OrderTotalsComponent {
  readonly subtotal = input.required<number>();
  readonly discountPercent = input.required<number>();
  readonly discountAmount = input.required<number>();
  readonly taxAmount = input.required<number>();
  readonly total = input.required<number>();
  readonly discountChange = output<number>();

  protected readonly taxLabel = computed(() => `IVA (${Math.round(VENDOR_TAX_RATE * 100)} %)`);

  onDiscountInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.discountChange.emit(Number.isFinite(value) ? value : 0);
  }
}
