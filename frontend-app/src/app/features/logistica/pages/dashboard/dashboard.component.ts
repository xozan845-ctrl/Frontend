import { Component, inject } from '@angular/core';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { ClientsTableComponent } from '../../components/clients-table/clients-table.component';
import { CouriersListComponent } from '../../components/couriers-list/couriers-list.component';
import { DeliveriesDonutComponent } from '../../components/deliveries-donut/deliveries-donut.component';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import MapPanelComponent from '../../components/map-panel/map-panel.component';
import { OrdersTableComponent } from '../../components/orders-table/orders-table.component';
import { LOGISTICA_DATES, LOGISTICA_ZONES } from '../../constants/logistica.constants';
import { LogisticaDashboardStore } from '../../state/logistica-dashboard/logistica-dashboard.store';

/**
 * Tablero de logística (ADR-25, `R-UX-1`, `R-UX-6`): KPIs del día, mapa de
 * rutas, estado de entregas, repartidores activos y las tablas de pedidos y
 * clientes. Toda la composición vive aquí; los paneles son presentacionales
 * (`R-SO-8`) y los derivados salen del store (`R-ST-3`).
 */
@Component({
  selector: 'app-logistica-dashboard',
  standalone: true,
  imports: [
    KpiCardComponent,
    MapPanelComponent,
    DeliveriesDonutComponent,
    CouriersListComponent,
    OrdersTableComponent,
    ClientsTableComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export default class LogisticaDashboardComponent {
  readonly store = inject(LogisticaDashboardStore);

  protected readonly zones = LOGISTICA_ZONES;
  protected readonly dates = LOGISTICA_DATES;
  protected readonly skeletonKpis = [1, 2, 3, 4];

  private readonly seoService = injectSeoPage(
    'Logística',
    'Monitorea clientes, rutas y entregas en tiempo real desde el tablero de logística.',
  );

  constructor() {
    this.store.load();
  }

  protected onDateChange(event: Event): void {
    this.store.setDateLabel((event.target as HTMLSelectElement).value);
  }

  protected onZoneChange(event: Event): void {
    this.store.setZoneFilter((event.target as HTMLSelectElement).value);
  }
}
