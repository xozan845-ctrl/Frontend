import { Component, input } from '@angular/core';
import { COURIER_STATUS_META } from '../../constants/logistica.constants';
import { Courier, courierProgress } from '../../models/logistica.model';

/**
 * Lista "Repartidores activos" (presentacional, `R-SO-8`): avatar, progreso de
 * entregas y chip de estado. El progreso se acota a 0–100 en el modelo.
 */
@Component({
  selector: 'app-logistica-couriers-list',
  standalone: true,
  templateUrl: './couriers-list.component.html',
})
export class CouriersListComponent {
  readonly couriers = input.required<readonly Courier[]>();
  readonly loading = input(false);

  protected readonly statusMeta = COURIER_STATUS_META;
  protected readonly progress = courierProgress;
}
