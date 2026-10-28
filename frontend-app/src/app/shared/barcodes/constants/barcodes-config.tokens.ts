import { InjectionToken } from '@angular/core';
import type { BarcodesScopeConfig } from '../models/barcodes-config.model';

/** Configuración del workspace activo para el módulo de códigos de barras. */
export const BARCODES_SCOPE_CONFIG = new InjectionToken<BarcodesScopeConfig>('BarcodesScopeConfig');
