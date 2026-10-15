import { Component, OnDestroy, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { RecentOrdersTableComponent } from '../../components/recent-orders-table/recent-orders-table.component';
import { VendorOrdersStore } from '../../state/vendor-orders.store';

/**
 * Inicio del panel del vendedor (`R-UX-1`, `R-UX-6`): KPIs del día derivados de
 * los pedidos cargados en el store (`R-ST-3`), accesos rápidos a las tareas del
 * día y pedidos recientes reutilizando la tabla del POS (`R-SO-8`).
 */
@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [RouterLink, AppCurrencyPipe, RecentOrdersTableComponent],
  templateUrl: './dashboard.component.html',
})
export default class DashboardComponent implements OnDestroy {
  readonly orders = inject(VendorOrdersStore);
  private readonly seoService = inject(SeoService);

  protected readonly recentOrders = computed(() => this.orders.orders().slice(0, 5));

  constructor() {
    this.seoService.setPage(
      'Inicio — Panel del vendedor',
      'El resumen de tu tienda: ventas de hoy, pedidos pendientes y accesos rápidos.',
    );

    this.orders.loadOrders();
  }

  ngOnDestroy(): void {
    this.seoService.reset();
  }
}
