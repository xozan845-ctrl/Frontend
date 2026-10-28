import { Component, computed, input, output } from '@angular/core';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../../shared/ui/skeleton/skeleton-loader.component';
import { BillingProduct } from '../../models/billing.model';

/**
 * Tarjeta "Catálogo" de la factura (presentacional, `R-SO-8`): buscador, chips
 * de categorías y grid de productos con estados de carga, error y vacío
 * (`R-UX-1`). Recibe los productos ya filtrados y solo emite intenciones.
 */
@Component({
  selector: 'app-catalog-picker-card',
  standalone: true,
  imports: [AppCurrencyPipe, EmptyStateComponent, SkeletonLoaderComponent],
  templateUrl: './catalog-picker-card.component.html',
})
export class CatalogPickerCardComponent {
  readonly products = input.required<readonly BillingProduct[]>();
  readonly categories = input.required<readonly string[]>();
  readonly query = input.required<string>();
  readonly category = input<string | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly queryChange = output<string>();
  readonly categoryChange = output<string | null>();
  readonly add = output<BillingProduct>();
  readonly retry = output<void>();

  protected readonly hasFilters = computed(() => !!this.query().trim() || !!this.category());
  protected readonly retryClick = (): void => this.retry.emit();

  onQueryInput(event: Event): void {
    this.queryChange.emit((event.target as HTMLInputElement).value);
  }

  categoryClasses(active: boolean): string {
    const base =
      'rounded-full border px-3 py-1.5 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:outline-hidden';
    return active
      ? `${base} border-accent-600 bg-accent-600 text-white`
      : `${base} border-slate-200 text-slate-600 hover:border-accent-500 hover:text-accent-600 dark:border-surface-600 dark:text-slate-300 dark:hover:border-accent-500 dark:hover:text-accent-400`;
  }

  stockClasses(inStock: boolean): string {
    return inStock
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  }
}
