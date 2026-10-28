import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods } from '@ngrx/signals';
import { REPORTS_DATA_SOURCE } from '../../repositories/reports-source.repository';

/** Store de reportes sobre la fuente del workspace activo (ADR-71). */
export const ReportsStore = signalStore(
  withComputed((store, source = inject(REPORTS_DATA_SOURCE)) => ({
    snapshot: computed(() => source.snapshot()),
    loading: computed(() => source.loading()),
    recentDays: computed(() => source.snapshot().days.slice(0, 14)),
    hasData: computed(() => source.snapshot().ordersCount > 0),
  })),
  withMethods((store, source = inject(REPORTS_DATA_SOURCE)) => ({
    load(): void | Promise<void> {
      return source.load();
    },
  })),
);
