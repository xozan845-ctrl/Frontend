import { Pipe, PipeTransform } from '@angular/core';
import { formatCurrency } from '../../core/config/currency.config';

/**
 * Formatea montos con la moneda del storefront (córdobas, `C$1,200.00`).
 *
 * Uso: `{{ product.price | appCurrency }}`. Los valores nulos o no numéricos
 * devuelven cadena vacía (precios opcionales como `originalPrice`).
 */
@Pipe({
  name: 'appCurrency',
  standalone: true,
})
export class AppCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatCurrency(value);
  }
}
