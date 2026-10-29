import { Component, input, output } from '@angular/core';
import { CashMoneyPipe } from '../../../../../shared/pipes/cash-money.pipe';
import {
  CASH_PAYMENT_METHOD_KINDS,
  type CashPaymentMethodSummary,
} from '../../../../domains/finance/public-api';

/** Configuración y uso de los métodos de pago de la empresa. */
@Component({
  selector: 'app-payment-methods-panel',
  standalone: true,
  imports: [CashMoneyPipe],
  templateUrl: './payment-methods-panel.component.html',
})
export class PaymentMethodsPanelComponent {
  readonly summaries = input.required<readonly CashPaymentMethodSummary[]>();

  readonly requestAdd = output<void>();
  readonly requestToggle = output<string>();
  readonly requestRemove = output<string>();

  kindLabel(kind: string): string {
    return CASH_PAYMENT_METHOD_KINDS.find((item) => item.value === kind)?.label ?? 'Otro';
  }
}
