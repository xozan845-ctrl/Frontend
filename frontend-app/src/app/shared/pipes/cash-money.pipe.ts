import { Pipe, PipeTransform } from '@angular/core';
import { formatMoney } from '../../core/config/currency.config';

/**
 * Montos de caja con el código ISO visible (`NIO 1,234.56` / `USD 50.00`).
 * Se mantiene separado de `appCurrency` para no alterar el storefront.
 */
@Pipe({
  name: 'cashMoney',
  standalone: true,
})
export class CashMoneyPipe implements PipeTransform {
  transform(value: number | null | undefined, currency = 'NIO'): string {
    return formatMoney(value, currency);
  }
}
