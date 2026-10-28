import { InjectionToken, type Signal } from '@angular/core';
import type { ReportSnapshot } from '../models/report.model';

/** Fuente de reportes del workspace: empresa o tienda del vendedor. */
export interface ReportsDataSource {
  readonly snapshot: Signal<ReportSnapshot>;
  readonly loading: Signal<boolean>;
  load(): void | Promise<void>;
}

export const REPORTS_DATA_SOURCE = new InjectionToken<ReportsDataSource>('ReportsDataSource');
