import { Component, computed, input, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import type { VendorProduct } from '../../../../applications/vendor/public-api';

/**
 * Tarjeta de producto del catálogo del POS (presentacional, `R-SO-8`): imagen
 * optimizada (`R-PF-2`), disponibilidad visible y acción de agregar. Un
 * producto agotado (dato explícito) no se puede agregar.
 */
@Component({
  selector: 'app-product-pick-card',
  standalone: true,
  imports: [AppCurrencyPipe, NgOptimizedImage],
  templateUrl: './product-pick-card.component.html',
})
export class ProductPickCardComponent {
  readonly product = input.required<VendorProduct>();
  readonly add = output<VendorProduct>();

  protected readonly stockClasses = computed(() =>
    this.product().inStock
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  );
}
