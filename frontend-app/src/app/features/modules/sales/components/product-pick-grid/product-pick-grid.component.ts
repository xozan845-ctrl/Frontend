import { Component, computed, input, output } from '@angular/core';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../../shared/ui/skeleton/skeleton-loader.component';
import type { VendorProduct } from '../../../../vendor/public-api';
import { ProductPickCardComponent } from '../product-pick-card/product-pick-card.component';

/**
 * Catálogo del POS (presentacional, `R-SO-8`): buscador, chips de categorías y
 * grid de tarjetas con estados de carga, error y vacío (`R-UX-1`). Recibe ya
 * filtrados los productos y solo emite intenciones.
 */
@Component({
  selector: 'app-product-pick-grid',
  standalone: true,
  imports: [EmptyStateComponent, SkeletonLoaderComponent, ProductPickCardComponent],
  templateUrl: './product-pick-grid.component.html',
})
export class ProductPickGridComponent {
  readonly products = input.required<VendorProduct[]>();
  readonly categories = input.required<string[]>();
  readonly query = input.required<string>();
  readonly category = input<string | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly queryChange = output<string>();
  readonly categoryChange = output<string | null>();
  readonly add = output<VendorProduct>();
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
}
