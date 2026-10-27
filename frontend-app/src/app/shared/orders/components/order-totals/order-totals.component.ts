import { Component, input, output } from '@angular/core';
import { AppCurrencyPipe } from '../../../pipes/app-currency.pipe';

/**
 * Totales de pedido/venta compartidos. El descuento puede ser editable (POS)
 * o solo informativo (resumen/venta rápida); el IVA se oculta cuando el flujo
 * no lo aplica. No calcula: recibe los derivados del store.
 */
@Component({
  selector: 'app-order-totals',
  standalone: true,
  imports: [AppCurrencyPipe],
  templateUrl: './order-totals.component.html',
})
export class OrderTotalsComponent {
  readonly subtotal = input.required<number>();
  readonly discountPercent = input(0);
  readonly discountAmount = input(0);
  readonly taxAmount = input(0);
  readonly taxLabel = input('IVA');
  readonly total = input.required<number>();
  readonly showTax = input(true);
  readonly discountEditable = input(true);
  readonly discountChange = output<number>();

  onDiscountInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.discountChange.emit(Number.isFinite(value) ? value : 0);
  }
}
