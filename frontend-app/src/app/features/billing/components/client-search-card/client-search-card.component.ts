import { Component, input, output } from '@angular/core';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { BillingClient } from '../../models/billing.model';

/**
 * Tarjeta "Cliente" de la factura (presentacional, `R-SO-8`): buscador, lista
 * de resultados, cliente elegido y acceso al alta rápida. Recibe los resultados
 * ya filtrados y emite intenciones; no conoce stores.
 */
@Component({
  selector: 'app-client-search-card',
  standalone: true,
  imports: [SkeletonLoaderComponent],
  templateUrl: './client-search-card.component.html',
})
export class ClientSearchCardComponent {
  readonly selected = input<BillingClient | null>(null);
  readonly results = input.required<BillingClient[]>();
  readonly query = input.required<string>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly queryChange = output<string>();
  readonly clientSelected = output<BillingClient>();
  readonly clearSelection = output<void>();
  readonly createRequested = output<void>();
  readonly retry = output<void>();

  protected readonly retryClick = (): void => this.retry.emit();

  onQueryInput(event: Event): void {
    this.queryChange.emit((event.target as HTMLInputElement).value);
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
}
