import { Component, input } from '@angular/core';
import {
  DELIVERY_STATUS_CLASSES,
  DELIVERY_STATUS_LABELS,
  ROUTE_TONE_CLASSES,
} from '../../constants/logistica.constants';
import { RouteOrder } from '../../models/logistica.model';

/** Tabla "Pedidos en ruta" (presentacional, `R-SO-8`). */
@Component({
  selector: 'app-logistica-orders-table',
  standalone: true,
  templateUrl: './orders-table.component.html',
})
export class OrdersTableComponent {
  readonly orders = input.required<readonly RouteOrder[]>();
  readonly loading = input(false);

  protected readonly statusClasses = DELIVERY_STATUS_CLASSES;
  protected readonly statusLabels = DELIVERY_STATUS_LABELS;
  protected readonly routeTones = ROUTE_TONE_CLASSES;
  protected readonly skeletonRows = [1, 2, 3, 4, 5];
}
