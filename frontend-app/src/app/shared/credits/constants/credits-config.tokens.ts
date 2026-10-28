import { InjectionToken } from '@angular/core';
import type { CreditsScopeConfig } from '../models/credits-config.model';

/** Configuración del workspace activo para el módulo de créditos. */
export const CREDITS_SCOPE_CONFIG = new InjectionToken<CreditsScopeConfig>('CreditsScopeConfig');
