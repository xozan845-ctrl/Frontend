import { InjectionToken } from '@angular/core';
import * as LeafletNamespace from 'leaflet';
import type { LeafletApi } from './leaflet-api.types';

export type { LeafletApi } from './leaflet-api.types';

/**
 * Resuelve la API de Leaflet sorteando el interop CJS/ESM: esbuild la expone
 * como `default` y otros bundlers pueden exponer los named exports. Función
 * pura para poder probarla sin DOM ni mapa (`R-CX-3`).
 */
export function resolveLeaflet(namespace: LeafletApi = LeafletNamespace): LeafletApi {
  const withDefault = namespace as unknown as { default?: LeafletApi };
  return withDefault.default ?? namespace;
}

/**
 * Puerto de la librería de mapas (`R-AR-3`): el componente depende del token,
 * no de Leaflet, y los tests inyectan un doble sin cargar la librería real.
 */
export const LEAFLET_API = new InjectionToken<LeafletApi>('LEAFLET_API', {
  providedIn: 'root',
  factory: () => resolveLeaflet(),
});
