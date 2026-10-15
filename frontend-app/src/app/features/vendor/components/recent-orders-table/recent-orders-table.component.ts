import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { VendorOrder } from '../../models/vendor-order.model';
import { OrderStatusBadgeComponent } from '../order-status-badge/order-status-badge.component';

/** Fecha corta del pedido para la tabla; `—` si la API no la trae (`R-RB-4`). */
export function formatOrderDate(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Hora corta de la última actualización del listado (modo "en vivo"). */
export function formatOrderTime(timestamp: number): string {
  return new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(timestamp),
  );
}

/**
 * Tabla "Pedidos recientes" del POS (presentacional, `R-SO-8`): pedidos con
 * estado, total y fecha, más estados de carga, error y vacío (`R-UX-1`). El
 * contenedor decide cuántos pedidos pasar y refresca el indicador "en vivo".
 */
@Component({
  selector: 'app-recent-orders-table',
  standalone: true,
  imports: [RouterLink, AppCurrencyPipe, SkeletonLoaderComponent, OrderStatusBadgeComponent],
  templateUrl: './recent-orders-table.component.html',
})
export class RecentOrdersTableComponent {
  readonly orders = input.required<VendorOrder[]>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  /** Modo "en vivo" activo: la lista se refresca sola (`R-PF-3`). */
  readonly live = input(false);
  /** Marca de tiempo (ms) de la última actualización lograda. */
  readonly lastUpdatedAt = input<number | null>(null);
  readonly retry = output<void>();

  protected readonly retryClick = (): void => this.retry.emit();
  protected readonly updatedLabel = computed(() => {
    const updated = this.lastUpdatedAt();
    return updated ? `Actualizado ${formatOrderTime(updated)}` : '';
  });

  protected formatDate(iso: string): string {
    return formatOrderDate(iso);
  }
}
