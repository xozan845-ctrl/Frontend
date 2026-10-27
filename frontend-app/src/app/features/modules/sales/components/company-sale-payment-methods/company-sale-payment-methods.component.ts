import { Component, input, output } from '@angular/core';
import {
  COMPANY_SALE_PAYMENT_METHODS,
  type CompanySalePaymentMethod,
} from '../../../../empresas/public-api';

/** Selector accesible de forma de pago compartido por los modales de venta. */
@Component({
  selector: 'app-company-sale-payment-methods',
  standalone: true,
  templateUrl: './company-sale-payment-methods.component.html',
})
export class CompanySalePaymentMethodsComponent {
  readonly selected = input<CompanySalePaymentMethod>('efectivo');
  readonly disabled = input(false);
  readonly selectMethod = output<CompanySalePaymentMethod>();

  readonly methods = COMPANY_SALE_PAYMENT_METHODS;

  methodClass(method: CompanySalePaymentMethod): string {
    const base =
      'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60';
    return this.selected() === method
      ? `${base} border-accent-600 bg-accent-50 text-accent-700 dark:border-accent-500 dark:bg-accent-900/20 dark:text-accent-300`
      : `${base} border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-surface-600 dark:bg-surface-800 dark:text-slate-300 dark:hover:border-surface-500`;
  }
}
