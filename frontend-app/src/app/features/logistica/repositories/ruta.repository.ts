import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Parada, Ruta } from '../models/ruta.model';

/** Puerto de rutas de logística de campo (`/field/rutas`). */
export interface RutaRepository {
  /** Rutas del tenant con sus paradas. */
  list(): Observable<Ruta[]>;
  /** Cambia el estado de una ruta (`PATCH /field/rutas/:id`). */
  updateStatus(routeId: string, status: string): Observable<Ruta>;
  /** Actualiza una parada; el backend exige `nombre` en el body. */
  updateStop(
    routeId: string,
    stopId: string,
    updates: { name: string; completed: boolean },
  ): Observable<Parada>;
}

export const RUTA_REPOSITORY = new InjectionToken<RutaRepository>('RutaRepository');
