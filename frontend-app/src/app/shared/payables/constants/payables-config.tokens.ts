import { InjectionToken } from '@angular/core';
import type { PayablesScopeConfig } from '../models/payables-config.model';

/** Configuración del workspace activo para el módulo de cuentas por pagar. */
export const PAYABLES_SCOPE_CONFIG = new InjectionToken<PayablesScopeConfig>('PayablesScopeConfig');
