import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { RecentOrdersTableComponent } from '../../components/recent-orders-table/recent-orders-table.component';
import { VendorOrdersStore } from '../../state/vendor-orders/vendor-orders.store';

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
export default class DashboardComponent {
  readonly orders = inject(VendorOrdersStore);
  private readonly seoService = injectSeoPage(
    'Inicio — Panel del vendedor',
    'El resumen de tu tienda: ventas de hoy, pedidos pendientes y accesos rápidos.',
  );

  protected readonly recentOrders = this.orders.recentOrders;

  private readonly loadOrders = this.orders.loadOrders();
}
