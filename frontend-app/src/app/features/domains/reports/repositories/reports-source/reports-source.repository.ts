import { InjectionToken, type Signal } from '@angular/core';
import type { ReportSnapshot } from '../../models/report.model';

/**
 * Fuente de reportes del workspace: contrato reactivo de Angular con token de
 * inyección (R-AR-3). La lectura pura sin señales vive en
 * `services/reports-source/reports-source.port.ts` (R-NC-1).
 */
export interface ReportsDataSource {
  readonly snapshot: Signal<ReportSnapshot>;
  readonly loading: Signal<boolean>;
  load(): void | Promise<void>;
}

export const REPORTS_DATA_SOURCE = new InjectionToken<ReportsDataSource>('ReportsDataSource');
