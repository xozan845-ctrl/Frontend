import { Component, input, output } from '@angular/core';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { Client } from '../../models/vendor-order.model';

/**
 * Selector de cliente del POS (presentacional, `R-SO-8`): buscador, lista de
 * resultados, tarjeta del cliente elegido y acceso al alta rápida. No conoce
 * stores: recibe los resultados ya buscados y emite intenciones.
 */
@Component({
  selector: 'app-client-picker',
  standalone: true,
  imports: [SkeletonLoaderComponent],
  templateUrl: './client-picker.component.html',
})
export class ClientPickerComponent {
  readonly selected = input<Client | null>(null);
  readonly results = input.required<Client[]>();
  readonly query = input.required<string>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly queryChange = output<string>();
  readonly clientSelected = output<Client>();
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
