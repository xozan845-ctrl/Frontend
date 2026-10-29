import { Pipe, PipeTransform } from '@angular/core';
import { CURRENCY } from '../../core/config/currency.config';

/**
 * Montos de caja con el código ISO visible (`NIO 1,234.56`). Se mantiene
 * separado de `appCurrency` para que la caja no dependa del símbolo del
 * storefront y muestre siempre la moneda configurada.
 */
@Pipe({
  name: 'cashMoney',
  standalone: true,
})
export class CashMoneyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '';
    return new Intl.NumberFormat(CURRENCY.locale, {
      style: 'currency',
      currency: CURRENCY.code,
      currencyDisplay: 'code',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(value)
      .replace(/\u00A0/g, ' ');
  }
}
