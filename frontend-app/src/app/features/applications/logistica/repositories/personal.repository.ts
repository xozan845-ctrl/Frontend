import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { FieldEmployee } from '../models/personal.model';

/** Puerto de personal de logística de campo (`/field/personal`). */
export interface PersonalRepository {
  list(): Observable<FieldEmployee[]>;
}

export const PERSONAL_REPOSITORY = new InjectionToken<PersonalRepository>('PersonalRepository');
