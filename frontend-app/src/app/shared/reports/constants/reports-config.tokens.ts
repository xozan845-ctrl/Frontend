import { InjectionToken } from '@angular/core';
import type { ReportsScopeConfig } from '../models/reports-config.model';

/** Configuración del workspace activo para el módulo de reportes. */
export const REPORTS_SCOPE_CONFIG = new InjectionToken<ReportsScopeConfig>('ReportsScopeConfig');
