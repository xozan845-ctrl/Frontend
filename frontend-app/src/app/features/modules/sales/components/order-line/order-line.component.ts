import { Component, computed, input, output } from '@angular/core';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import type { OrderDraftLine } from '../../../../applications/vendor/public-api';
import { QuantityStepperComponent } from '../quantity-stepper/quantity-stepper.component';

/**
 * Línea del borrador del POS (presentacional, `R-SO-8`): producto, precio
 * unitario, stepper de cantidad, total de línea y acción de quitar. No conoce
 * stores: emite la cantidad nueva o la baja de la línea.
 */
@Component({
  selector: 'app-order-line',
  standalone: true,
  imports: [AppCurrencyPipe, QuantityStepperComponent],
  templateUrl: './order-line.component.html',
})
export class OrderLineComponent {
  readonly line = input.required<OrderDraftLine>();
  readonly quantityChange = output<number>();
  readonly remove = output<void>();

  /** Total de línea con el redondeo de dinero del POS (`R-U-6`). */
  protected readonly lineTotal = computed(
    () => Math.round(this.line().product.price * this.line().quantity * 100) / 100,
  );
}
