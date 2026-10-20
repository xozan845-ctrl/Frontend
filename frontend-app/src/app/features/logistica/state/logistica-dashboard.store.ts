import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, timer } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import {
  ALL_ZONES,
  LOGISTICA_DATES,
  LOGISTICA_DELIVERY_TOTAL,
  LOGISTICA_LOAD_DELAY_MS,
} from '../constants/logistica.constants';
import {
  LOGISTICA_CLIENTS,
  LOGISTICA_COURIERS,
  LOGISTICA_DELIVERY,
  LOGISTICA_KPIS,
  LOGISTICA_ORDERS,
  LOGISTICA_ROUTES,
  LOGISTICA_VEHICLES,
} from '../mocks/logistica.mocks';
import type { LogisticaDashboardState } from './logistica-dashboard.state';

const initialState: LogisticaDashboardState = {
  loading: false,
  zoneFilter: ALL_ZONES,
  dateLabel: LOGISTICA_DATES[0],
  kpis: [],
  delivery: [],
  deliveryTotal: 0,
  couriers: [],
  orders: [],
  clients: [],
  routes: [],
  vehicles: [],
};

/** Filtra por zona; "Todas las zonas" devuelve la lista completa. */
function filterByZone<T extends { zone: string }>(items: readonly T[], zone: string): T[] {
  return zone === ALL_ZONES ? [...items] : items.filter((item) => item.zone === zone);
}

/**
 * Estado del tablero de logística (ADR-25): carga los datos del boceto desde
 * `mocks/` con una latencia simulada, mantiene los filtros de zona y fecha y
 * deriva los totales del donut en `withComputed` (`R-ST-3`). Los datos son de
 * demostración hasta que Core Engine exponga rutas, repartidores y entregas.
 */
export const LogisticaDashboardStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    filteredOrders: computed(() => filterByZone(store.orders(), store.zoneFilter())),
    filteredClients: computed(() => filterByZone(store.clients(), store.zoneFilter())),
    activeCouriers: computed(
      () => store.couriers().filter((courier) => courier.status !== 'disponible').length,
    ),
    hasZoneFilter: computed(() => store.zoneFilter() !== ALL_ZONES),
  })),
  withMethods((store) => {
    /**
     * Carga visible del tablero (`R-UX-1`): enciende el estado de carga y lo
     * apaga cuando llegan los datos. La latencia es simulada mientras no hay
     * backend; se sustituirá por el puerto HTTP correspondiente.
     */
    const load = rxMethod<void>(
      pipe(
        switchMap(() => {
          patchState(store, { loading: true });
          return timer(LOGISTICA_LOAD_DELAY_MS).pipe(
            tap(() =>
              patchState(store, {
                kpis: LOGISTICA_KPIS,
                delivery: LOGISTICA_DELIVERY,
                deliveryTotal: LOGISTICA_DELIVERY_TOTAL,
                couriers: LOGISTICA_COURIERS,
                orders: LOGISTICA_ORDERS,
                clients: LOGISTICA_CLIENTS,
                routes: LOGISTICA_ROUTES,
                vehicles: LOGISTICA_VEHICLES,
                loading: false,
              }),
            ),
          );
        }),
      ),
    );

    return {
      load,

      /** Aplica el filtro de zona del encabezado. */
      setZoneFilter(zone: string): void {
        patchState(store, { zoneFilter: zone });
      },

      /** Cambia la jornada mostrada en el selector de fecha. */
      setDateLabel(dateLabel: string): void {
        patchState(store, { dateLabel });
      },
    };
  }),
);
