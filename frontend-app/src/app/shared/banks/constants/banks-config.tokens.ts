import { InjectionToken } from '@angular/core';
import type { BanksScopeConfig } from '../models/banks-config.model';

/** Configuración del workspace activo para el módulo de bancos. */
export const BANKS_SCOPE_CONFIG = new InjectionToken<BanksScopeConfig>('BanksScopeConfig');
