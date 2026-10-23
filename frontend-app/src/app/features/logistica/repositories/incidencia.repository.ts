import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { FieldIncident } from '../models/incidencia.model';

/** Cambios admitidos por `PATCH /field/incidencias/:id`. */
export interface IncidenciaChanges {
  status?: string;
  resolution?: string;
}

/** Puerto de incidencias de logística de campo (`/field/incidencias`). */
export interface IncidenciaRepository {
  list(): Observable<FieldIncident[]>;
  update(id: string, changes: IncidenciaChanges): Observable<FieldIncident>;
}

export const INCIDENCIA_REPOSITORY = new InjectionToken<IncidenciaRepository>(
  'IncidenciaRepository',
);
