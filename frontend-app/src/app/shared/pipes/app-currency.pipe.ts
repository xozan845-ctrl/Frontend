import { inject, Pipe, PipeTransform } from '@angular/core';
import { formatCurrency } from '../../core/config/currency.config';
import { StoreConfigService } from '../../core/services/store-config/store-config.service';

/**
 * Formatea montos con la moneda del contexto activo (`C$1,200.00`, `$50.00`, …).
 *
 * Uso: `{{ product.price | appCurrency }}`. Los valores nulos o no numéricos
 * devuelven cadena vacía (precios opcionales como `originalPrice`).
 */
@Pipe({
  name: 'appCurrency',
  standalone: true,
  // La moneda puede cambiar sin que cambie el monto al navegar entre tiendas.
  pure: false,
})
export class AppCurrencyPipe implements PipeTransform {
  private readonly storeConfig = inject(StoreConfigService);

  transform(value: number | null | undefined): string {
    return formatCurrency(value, this.storeConfig.currency());
  }
}
