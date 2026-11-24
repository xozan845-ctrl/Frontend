import { InjectionToken, type Signal } from '@angular/core';
import type { ReportSnapshot } from '../../models/report.model';

/**
 * Fuente de reportes del workspace: contrato reactivo de Angular con token de
 * inyección (R-AR-3). La lectura pura sin señales vive en
 * `services/reports-source/reports-source.port.ts` (R-NC-1).
 *
 * `error` y `lastUpdatedAt` permiten distinguir un fallo de un reporte vacío y
 * conservar el último dato válido cuando la recarga falla.
 */
export interface ReportsDataSource {
  readonly snapshot: Signal<ReportSnapshot>;
  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;
  readonly lastUpdatedAt: Signal<Date | null>;
  load(): void | Promise<void>;
}

export const REPORTS_DATA_SOURCE = new InjectionToken<ReportsDataSource>('ReportsDataSource');
