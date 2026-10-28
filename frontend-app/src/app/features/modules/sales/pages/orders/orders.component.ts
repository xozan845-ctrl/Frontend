import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import {
  ORDER_STATUS_LABELS,
  VendorOrdersStore,
  type OrderStatus,
} from '../../../../vendor/public-api';
import { RecentOrdersTableComponent } from '../../../../vendor/public-ui';

/**
 * Página "Pedidos" (ADR-20): lista completa con filtro por estado en chips y
 * tabla reutilizada del POS (`R-SO-8`). El filtro y los conteos viven en el
 * store (`R-ST-3`); aquí solo se orquestan estado, SEO y eventos (`R-UX-6`).
 */
@Component({
  selector: 'app-vendor-orders',
  standalone: true,
  imports: [RouterLink, RecentOrdersTableComponent],
  templateUrl: './orders.component.html',
})
export default class OrdersComponent {
  readonly orders = inject(VendorOrdersStore);
  private readonly seoService = injectSeoPage(
    'Pedidos — Panel del vendedor',
    'Consulta la lista completa de pedidos de tu tienda, filtra por estado y revisa el detalle de cada venta.',
  );

  protected readonly statuses: OrderStatus[] = [
    'pendiente',
    'en_proceso',
    'completado',
    'cancelado',
  ];
  protected readonly labels = ORDER_STATUS_LABELS;
  protected readonly emptyTitle = computed(() =>
    this.orders.statusFilter() ? 'Sin pedidos con este estado' : 'Aún no hay pedidos',
  );
  protected readonly emptySubtitle = computed(() =>
    this.orders.statusFilter()
      ? 'Prueba con otro filtro o registra un pedido nuevo.'
      : 'Los pedidos que registres aparecerán aquí.',
  );

  private readonly loadOrders = this.orders.loadOrders();

  setFilter(status: OrderStatus | null): void {
    this.orders.setStatusFilter(status);
  }

  chipClasses(active: boolean): string {
    const base =
      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:outline-hidden';
    return active
      ? `${base} border-accent-600 bg-accent-600 text-white`
      : `${base} border-slate-200 text-slate-600 hover:border-accent-500 hover:text-accent-600 dark:border-surface-600 dark:text-slate-300 dark:hover:border-accent-500 dark:hover:text-accent-400`;
  }
}
